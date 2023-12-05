/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import * as vscode from 'vscode';
import { whenReady } from '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import { createConfiguredEditor, createModelReference } from 'vscode/monaco';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
import getConfigurationServiceOverride, { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import { initServices, MonacoLanguageClient } from 'monaco-languageclient';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from 'vscode/service-override/files';
import {LogLevel, Uri} from 'vscode';
import config from './config.js';
import { instance } from "@viz-js/viz";
import { Message } from 'vscode-jsonrpc';
import { v4 as uuidv4 } from 'uuid';
import lodash from 'lodash';
import { ExecuteCommandRequest } from 'vscode-languageserver-protocol'

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('./node_modules/monaco-editor-workers/dist/workers', new URL('', window.location.href).href, false);

const languageId = 'uvls';
let languageClient: MonacoLanguageClient;
let fileID;
let model;
const connectionText = document.getElementById("connection");
let debounceGenGraph;

const createUrl = (hostname: string, port: number, path: string, searchParams: Record<string, any> = {}, secure: boolean): string => {
    const protocol = secure ? 'wss' : 'ws';
    const url = new URL(`${protocol}://${hostname}:${port}${path}`);

    for (let [key, value] of Object.entries(searchParams)) {
        if (value instanceof Array) {
            value = value.join(',');
        }
        if (value) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
};

const createWebSocket = (url: string): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onerror = () => {
        if(connectionText){
            connectionText.textContent = "Could not connect to language server. Reconnecting ...";
        }
        setTimeout(() => {
            createWebSocket(url);
        }, 1000);
    };
    webSocket.onopen = async () => {
        if(connectionText){
            connectionText.textContent = "";
        }
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
            reader,
            writer
        });
        await languageClient.start();
        reader.onClose(() => {
            languageClient.stop();
            createWebSocket(url);
        });
    };
    return webSocket;
};

const createLanguageClient = (transports: MessageTransports): MonacoLanguageClient => {
    const client = new MonacoLanguageClient({
        name: 'UVL Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: [languageId],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            },
            // pyright requires a workspace folder to be present, otherwise it will not work
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: monaco.Uri.parse('/workspace')
            },
            synchronize: {
                fileEvents: [vscode.workspace.createFileSystemWatcher('**')]
            },
            connectionOptions: {
                // This construct can be used to filter the messages we are receiving from the language server
                messageStrategy: {
                    handleMessage(message: Message, next: (message: Message) => void) {
                        if(Message.isRequest(message)){
                            // Filters requests send by uvls -> Anti-Pattern in our opinion
                        }
                        else if(Message.isResponse(message)){
                            // Filters responses send by uvls
                        }
                        else if(Message.isNotification(message)){
                            // Filters Notification messages following json-rpc spec
                        }
                        // "next" is the default behaviour
                        next(message);
                    }
                }
            },
            // The Middleware allows us to intercept all messages that would be sent to the language server
            middleware: {
                executeCommand(command, args, next) {
                    const information = {command: command, arguments: args};
                    if(command === "uvls/open_config") {
                        //we do not support config view
                        return;
                    }
                    else if(command === "uvls/generate_diagram") {
                        client?.sendRequest(ExecuteCommandRequest.type, information).then((res) => {
                            createDiagramFromDot(res as string);
                        });

                        if(debounceGenGraph === undefined){
                            debounceGenGraph = lodash.debounce(() => {
                                client?.sendRequest(ExecuteCommandRequest.type, information).then((res) => {
                                    createDiagramFromDot(res as string);
                                });
                            }, 500);
                            
                            const firstPane = document.getElementById("first");
                            const secondPane = document.getElementById("second");
                            if(firstPane && secondPane){
                                firstPane.style.width = "50%";
                                secondPane.style.width = "50%"; 
                            }

                        }else{
                            debounceGenGraph = undefined;
                            const div = document.getElementsByClassName("graph");
                            const firstPane = document.getElementById("first");
                            while (div[0].firstChild) {
                                div[0].removeChild(div[0].firstChild);
                            }
                            const secondPane = document.getElementById("second");
                            if(firstPane && secondPane){
                                firstPane.style.width = "100%";
                                secondPane.style.width = "0%"; 
                            }
                        }
                        
                    }
                    else {
                        next(command, args);
                    }
                },
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            }
        }
    });
    
    return client;
};

function createDiagramFromDot(res: string): void {
    instance().then(viz => {
        const div = document.getElementsByClassName("graph");
        div[0].replaceChildren(viz.renderSVGElement(res!));
    });
}

export const startPythonClient = async () => {
    // init vscode-api
    const useDebugLogging = config.debug ? LogLevel.Debug : LogLevel.Off;
    await initServices({
        userServices: {
            ...getThemeServiceOverride(),
            ...getTextmateServiceOverride(),
            ...getConfigurationServiceOverride(Uri.file('/workspace')),
            ...getKeybindingsServiceOverride(),
        },
        debugLogging: config.debug,
        logLevel: useDebugLogging,
    });

    await whenReady();
    // extension configuration derived from:
    // https://github.com/microsoft/pyright/blob/main/packages/vscode-pyright/package.json
    // only a minimum is required to get pyright working
    const extension = {
        name: 'uvl-client',
        publisher: 'monaco-languageclient-project',
        version: '1.0.0',
        engines: {
            vscode: '^1.78.0'
        },
        contributes: {
            languages: [{
                id: languageId,
                aliases: [
                    'UVL'
                ],
                extensions: [
                    '.uvl',
                ]
            }]
        }
    };
    registerExtension(extension, ExtensionHostKind.LocalProcess);

    updateUserConfiguration(`{
        "editor.fontSize": 14,
        "workbench.colorTheme": "Default Dark Modern",
        theme: "vs-dark"
    }`);

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileID = uuidv4();
    fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file(`/workspace/${fileID}.uvl`), getInitialFm()));
    registerFileSystemOverlay(1, fileSystemProvider);

    // create the web socket and configure to start the language client on open, can add extra parameters to the url if needed.
    createWebSocket(createUrl(config.languageServerHostName,config.port,'/', {
        // Used to parse an auth token or additional parameters such as import IDs to the language server
        authorization: 'UserAuth'
        // By commenting above line out and commenting below line in, connection to language server will be denied.
        // authorization: 'FailedUserAuth'
    }, location.protocol === 'https:'));



    // use the file create before
    const modelRef = await createModelReference(monaco.Uri.file(`/workspace/${fileID}.uvl`));
    model = modelRef.object;

    const debouncedSave = lodash.debounce(saveFm, 1000);

    modelRef.object.onDidChangeContent(() => {
       debouncedSave();
       if(debounceGenGraph !== undefined){
        debounceGenGraph();
       }
    });


    modelRef.object.setLanguageId(languageId);

    // create monaco editor
    createConfiguredEditor(document.getElementById('container')!, {
        model: modelRef.object.textEditorModel,
        automaticLayout: true
    });
};

function getInitialFm(){
    let initialFm = "features\n\tfeature1\n\t\tor\n\t\t\tfeature2\n\t\t\tfeature3\n\nconstraints\n\tfeature1";
    const storedFm = window.localStorage.getItem("fm");
    if(storedFm !== null){
        initialFm = storedFm;
    }
    return initialFm;
}

function saveFm(){
    if(model !== undefined){
        const content = model.textEditorModel?.getValue();
        window.localStorage.setItem("fm", content);
    }
}