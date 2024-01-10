import {WebSocketServer} from 'ws';
import {IncomingMessage} from 'http';
import {Socket} from 'net';
import express from 'express';
import {IWebSocket, WebSocketMessageReader, WebSocketMessageWriter} from 'vscode-ws-jsonrpc';
import {createConnection, createServerProcess, forward} from 'vscode-ws-jsonrpc/server';
import {InitializeParams, InitializeRequest, Message} from 'vscode-languageserver';
import config from './config.js';

const MAX_MESSAGE_SIZE = 100000;

const launchLanguageServer = (socket: IWebSocket) => {
    const serverName: string = 'UVLS';
    const ls = config.languageServerBinary;
    const serverConnection = createServerProcess(serverName, ls);

    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const socketConnection = createConnection(reader, writer, () => socket.dispose());
    if (serverConnection) {
        forward(socketConnection, serverConnection, message => {
            if (JSON.stringify(message).length > MAX_MESSAGE_SIZE) {
                console.log(`blocked message larger than ${MAX_MESSAGE_SIZE}`);
                message = {jsonrpc: "2.0"};
                socketConnection.dispose();
                return message;
            }
            if (Message.isRequest(message)) {
                console.log(`${serverName} Server received:`);
                logObjectRecursively(message);
                if (message.method === InitializeRequest.type.method) {
                    const initializeParams = message.params as InitializeParams;
                    initializeParams.processId = process.pid;
                }
            }
            if (Message.isNotification(message)) {
                logObjectRecursively(message);
            }
            if (Message.isResponse(message)) {
                console.log(`${serverName} Server sent:`);
                logObjectRecursively(message);
            }
            return message;
        });
    }
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

export const runUVLServer = () => {
    process.on('uncaughtException', function (err: any) {
        console.error('Uncaught Exception: ', err.toString());
        if (err.stack) {
            console.error(err.stack);
        }
    });

    // create the express application
    const app = express();
    // start the server
    const server = app.listen(config.port);
    // create the web socket
    const wss = new WebSocketServer({
        noServer: true, perMessageDeflate: false, clientTracking: true,
    });

    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        wss.handleUpgrade(request, socket, head, webSocket => {
            const socket: IWebSocket = {
                send: content => webSocket.send(content, error => {
                    if (error) {
                        throw error;
                    }
                }),
                onMessage: cb => webSocket.on('message', (data) => {
                    cb(data);
                }),
                onError: cb => webSocket.on('error', cb),
                onClose: cb => webSocket.on('close', cb),
                dispose: () => webSocket.close()
            };
            // launch the server when the web socket is opened
            if (webSocket.readyState === webSocket.OPEN) {
                launchLanguageServer(socket);
            } else {
                webSocket.on('open', () => {
                    launchLanguageServer(socket);
                });
            }
        });
    });
};

runUVLServer();