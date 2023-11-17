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
import {createServerProcess, IConnection, createConnection, forward} from 'vscode-ws-jsonrpc/server';
import {
    Message, RequestMessage
} from 'vscode-languageserver';
import BiMap from "bidirectional-map";
import config from './config.js';


type MessageWithId = Message & { id: number | string | undefined};

const initUVLS = () => {
    const serverName: string = 'UVLS';
    const ls = config.languageServerBinary;
    serverConnection = createServerProcess(serverName, ls)!;

    if (!serverConnection) {
        console.log("Fuuuuuuuuuu");
        process.exit(42);
    }

    serverConnection.reader.listen((data: Message) => {
        const typedData = data as MessageWithId;
        if(typedData.id != undefined){
            const entry = superMapperMap.get(Number(typedData.id!));
            if (entry != undefined) {
                if (entry[1] != undefined) {
                    typedData.id = entry[1];
                }
                const socketConnection: IConnection = connectionMap.get(entry[0].toString())!;
                socketConnection.writer.write(typedData).then(() => console.log("Written to SocketConn")).catch((reason) => console.log("Failed for reason: ", reason));
            }
        }
    })
};

function multiplexHandler(socket: IWebSocket) {
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const socketConnection = createConnection(reader, writer, () => socket.dispose());
    connectionMap.set(connectionMap.size.toString(), socketConnection);
    socketConnectionGlobal = socketConnection;


    socketConnection.reader.listen((message) => {
        if (Message.isRequest(message)) {
            const method = (message as RequestMessage).method;
        }
        const socketNumber = connectionMap.getKey(socketConnection)!;
        const jsonrpc: MessageWithId = message as MessageWithId;
        // Retrieve ClientID
        console.log(jsonrpc.id);
        let sendingNumber = Number(jsonrpc.id!);
        console.log("sn: " + sendingNumber + " - jid: " + jsonrpc.id);
        // Update LastUsedID
        if (jsonrpc.id !== undefined ) {
            lastUsedID = lastUsedID + 1;
            jsonrpc.id = lastUsedID;
            
            superMapperMap.set(lastUsedID, [Number(socketNumber), sendingNumber]);
        }
        serverConnection.writer.write(jsonrpc).then(() => console.log("Written to serverCon")).catch((reason) => console.log("Failed for reason: ", reason));
    })
}

const superMapperMap = new Map<number, [number, number]>();
const connectionMap = new BiMap<IConnection>();
let serverConnection: IConnection;
let socketConnectionGlobal: IConnection;
let lastUsedID = -1;

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