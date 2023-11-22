/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {WebSocketServer} from 'ws';
import {IncomingMessage} from 'http';
import {URL} from 'url';
import {Socket} from 'net';
import express from 'express';
import {IWebSocket, WebSocketMessageReader, WebSocketMessageWriter} from 'vscode-ws-jsonrpc';
import {createConnection, createServerProcess, IConnection} from 'vscode-ws-jsonrpc/server';
import {Message, NotificationMessage, RequestMessage, ResponseMessage} from 'vscode-languageserver';
import config from './config.js';

let serverConnection: IConnection;
/* the protocol uses messages without an ID, but they need to be delivered to a specific client
This is a hack around: we map uris (that are unique to client) to a connection and deliver messages
without id but with a uri to the correct client
 */
const uriToConnectionMap = new Map<string, IConnection>();
const clientScopeToServerScope = new Map<Number, Number>();
const serverScopeToClientScope = new Map<Number, Number>();
const connectionToClientId = new Map<IConnection, Number>();
const clientIdToConnection = new Map<Number, IConnection>();
const serverScopeIdToClientId = new Map<Number, Number>();
const clientIdAndClientScopeIdToServerScopeId = new Map<[Number, Number], Number>;
let nextFreeClientId = 0;
let nextFreeServerScopeId = 0;
let initMessage1: Message | undefined;
let initMessage2: Message | undefined;
let initialized = false;

function getClientScopeIdFromServerScopeId(serverScopeId: Number): Number | undefined {
    const clientScopeId = serverScopeToClientScope.get(serverScopeId);
    return clientScopeId;
}

function getServerScopeIdFromClientScopeId(clientScopeId: Number, clientId: Number): Number {
    let serverScopeId = clientIdAndClientScopeIdToServerScopeId.get([clientId, clientScopeId]);
    if (serverScopeId === undefined) {
        clientScopeToServerScope.set(clientScopeId, nextFreeServerScopeId);
        serverScopeToClientScope.set(nextFreeServerScopeId, clientScopeId);
        serverScopeId = nextFreeServerScopeId;
        nextFreeServerScopeId++;
        serverScopeIdToClientId.set(serverScopeId, clientId);
        clientIdAndClientScopeIdToServerScopeId.set([clientId, clientScopeId], serverScopeId);
    }
    return serverScopeId;
}

function getConnectionFromServerScopeId(serverScopeId: Number): IConnection | undefined {
    const clientId = serverScopeIdToClientId.get(serverScopeId);
    let connection;
    if (clientId !== undefined) {
        connection = clientIdToConnection.get(clientId);
    }
    return connection;
}

function addNewConnection(connection: IConnection) {
    const clientId = nextFreeClientId;
    clientIdToConnection.set(clientId, connection);
    nextFreeClientId++;
    return clientId;
}

const initUVLS = () => {
    const serverName: string = 'UVLS';
    const ls = config.languageServerBinary;
    serverConnection = createServerProcess(serverName, ls)!;

    if (!serverConnection) {
        console.error("Server could not be started");
        process.exit(1);
    }

    serverConnection.reader.listen((message: Message) => {
        let socketConnection: IConnection | undefined;
        let newMessage: Message = message;
        if (Message.isRequest(message)) {
            const typedMessage = message as RequestMessage;
            const serverScopeId = Number(typedMessage.id);
            const clientConnection = getConnectionFromServerScopeId(serverScopeId);
            const clientScopeId = getClientScopeIdFromServerScopeId(serverScopeId);
            if (clientScopeId !== undefined) {
                newMessage["id"] = clientScopeId;
            }
            if (clientConnection !== undefined) {
                socketConnection = clientConnection;
            }
            if (typedMessage.method === "client/registerCapability") {
                initMessage2 = newMessage;
            } else if (typedMessage.method === "workspace/executeCommand") {
                const fileUri = typedMessage.params?.["arguments"][0]?.["uri"].split("create/").pop();
                if(fileUri !== undefined){
                    socketConnection = uriToConnectionMap.get(fileUri);
                }
            }

        } else if (Message.isResponse(message)) {
            const typedMessage = message as ResponseMessage;
            if (typedMessage.id === 0) {
                initMessage1 = message;
            }
            const serverScopeId = Number(typedMessage.id);
            const clientConnection = getConnectionFromServerScopeId(serverScopeId);
            const clientScopeId = getClientScopeIdFromServerScopeId(serverScopeId);
            if (clientScopeId !== undefined) {
                newMessage["id"] = clientScopeId;
            }
            if (clientConnection !== undefined) {
                socketConnection = clientConnection;
            }
        } else if (Message.isNotification(message)) {
            const typedMessage = message as NotificationMessage;
            const uri: string | undefined = typedMessage.params?.["uri"];
            if (uri !== undefined && uri.split("///").length === 2) {
                socketConnection = uriToConnectionMap.get(uri.split("///")[1]);

            }
        }
        if (socketConnection) {
            socketConnection.writer.write(newMessage);
        } else {
            console.log(`Could not resolve destination of server message to right client\nMessage: ${JSON.stringify(message)}`)
        }
    })
};

function multiplexHandler(socket: IWebSocket) {
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const socketConnection = createConnection(reader, writer, () => socket.dispose());
    const clientId = addNewConnection(socketConnection);


    socketConnection.reader.listen((message) => {
        let newMessage = message;
        if (Message.isRequest(message)) {
            const typedMessage = message as RequestMessage;
            if (typedMessage.method === "initialize" && initMessage1 !== undefined) {
                socketConnection.writer.write(initMessage1);
                return;
            } else if (typedMessage.method === "workspace/executeCommand") {
                const serverScopeId = getServerScopeIdFromClientScopeId(Number(typedMessage.id), clientId);
                newMessage["id"] = serverScopeId;
            } else {
                const serverScopeId = getServerScopeIdFromClientScopeId(Number(typedMessage.id), clientId);
                newMessage["id"] = serverScopeId;
            }

        } else if (Message.isResponse(message)) {
            const typedMessage = message as ResponseMessage;
            const serverScopeId = getServerScopeIdFromClientScopeId(Number(typedMessage.id), clientId);
            newMessage["id"] = serverScopeId;

        } else if (Message.isNotification(message)) {
            const typedMessage = message as NotificationMessage;
            if (typedMessage.method === "initialized" && !initialized) {
                initialized = true;
                serverConnection.writer.write(newMessage);
                return;
            } else if (typedMessage.method === "textDocument/didOpen") {
                const uri: string | undefined = typedMessage.params?.["textDocument"]?.["uri"];
                if (uri !== undefined && uri.split("///").length === 2) {
                    uriToConnectionMap.set(uri.split("///")[1], socketConnection);
                }

            } else if (typedMessage.method === "$/cancelRequest") {
                newMessage["params"]["id"] = getServerScopeIdFromClientScopeId(newMessage["params"]["id"], clientId);
            } else if (typedMessage.method === "initialized" && initMessage2 !== undefined) {
                socketConnection.writer.write(initMessage2);
                return;
            } else {
                // other messages are just forwarded to the uvls
            }

        }
        serverConnection.writer.write(newMessage);
    })
}

export const runUVLServer = () => {
    process.on('uncaughtException', function (err: any) {
        console.error('Uncaught Exception: ', err.toString());
        if (err.stack) {
            console.error(err.stack);
        }
    });

    initUVLS();

    // create the express application
    const app = express();
    // start the server
    const server = app.listen(config.port);
    // create the web socket
    const wss = new WebSocketServer({
        noServer: true, perMessageDeflate: false, clientTracking: true,
    });

    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        const baseURL = `http://${request.headers.host}/`;
        const pathname = request.url ? new URL(request.url, baseURL).pathname : undefined;
        wss.handleUpgrade(request, socket, head, webSocket => {
            const socket: IWebSocket = {
                send: content => {
                    webSocket.send(content, error => {
                        if (error) {
                            throw error;
                        }
                    })
                },
                onMessage: cb => webSocket.on('message', (data) => {
                    cb(data);
                }),
                onError: cb => webSocket.on('error', cb),
                onClose: cb => webSocket.on('close', cb),
                dispose: () => webSocket.close()
            };
            // launch the server when the web socket is opened
            if (webSocket.readyState === webSocket.OPEN) {
                multiplexHandler(socket);
            } else {
                webSocket.on('open', () => {
                    multiplexHandler(socket);
                });
            }
        });
    });
};

function logObjectRecursively(obj, depth = 0) {
    const indent = '  '.repeat(depth);
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                console.log(`${indent}${key}:`);
                logObjectRecursively(obj[key], depth + 1);
            } else {
                console.log(`${indent}${key}: ${obj[key]}`);
            }
        }
    }
}

runUVLServer();