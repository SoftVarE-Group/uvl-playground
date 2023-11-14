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

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('./node_modules/monaco-editor-workers/dist/workers', new URL('', window.location.href).href, false);

const languageId = 'uvls';
let languageClient: MonacoLanguageClient;

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
    webSocket.onopen = async () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
            reader,
            writer
        });
        await languageClient.start();
        reader.onClose(() => languageClient.stop());
    };
    return webSocket;
};

const createLanguageClient = (transports: MessageTransports): MonacoLanguageClient => {
    return new MonacoLanguageClient({
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
                messageStrategy: {
                    handleMessage(message: Message, next: (message: Message) => void) {
                        if(Message.isRequest(message)){
                            console.log("Sending Request");
                        }
                        if(Message.isResponse(message)){
                            console.log("Receiving Response");
                            let result = message.result;
                            if(typeof result === "string" || result instanceof String){
                                if(result.startsWith("digraph")){
                                    createDiagramFromDot(result as string);
                                }
                            }
                        }
                        if(Message.isNotification(message)){
                            console.log("Notification Message");
                        }

                        console.log(message);
                        next(message);
                    }
                }
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            }
        }
    });
};

function createDiagramFromDot(res: string): void {
    instance().then(viz => {
        const div = document.getElementsByClassName("graph");
        div[0].replaceChildren(viz.renderSVGElement(res!));
    });
}

function generateDiagram(): void {
    vscode.commands.executeCommand("uvls/generate_diagram", 'file:///workspace/fm.uvl')
        .then((res) => createDiagramFromDot(res as string));
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

    const button = document.getElementById("rerender");
    if(button){
        button.onclick = () => generateDiagram();
    }
    else{
        console.log("I cannot find the button")
    }

    updateUserConfiguration(`{
        "editor.fontSize": 14,
        "workbench.colorTheme": "Default Dark Modern",
        theme: "vs-dark"
    }`);

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/workspace/fm.uvl'), 'features\n\tfeature1\n\t\tor\n\t\t\tfeature2\n\t\t\tfeature3\n\nconstraints\n\tfeature1'));
    registerFileSystemOverlay(1, fileSystemProvider);

    // create the web socket and configure to start the language client on open, can add extra parameters to the url if needed.
    createWebSocket(createUrl(config.languageServerHostName,config.port,'/', {
        // Used to parse an auth token or additional parameters such as import IDs to the language server
        authorization: 'UserAuth'
        // By commenting above line out and commenting below line in, connection to language server will be denied.
        // authorization: 'FailedUserAuth'
    }, location.protocol === 'https:'));


    // use the file create before
    const modelRef = await createModelReference(monaco.Uri.file('/workspace/fm.uvl'));
    modelRef.object.setLanguageId(languageId);

    // create monaco editor
    createConfiguredEditor(document.getElementById('container')!, {
        model: modelRef.object.textEditorModel,
        automaticLayout: true
    });
};
