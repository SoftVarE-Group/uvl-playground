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
import {initIntroJS} from "./intro.ts";
import {editor} from "monaco-editor";
import IOverlayWidget = editor.IOverlayWidget;
import IContentWidget = editor.IContentWidget;
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
buildWorkerDefinition('./node_modules/monaco-editor-workers/dist/workers', new URL('', window.location.href).href, false);

const languageId = 'uvls';
let languageClient: MonacoLanguageClient;
let fileID;
let model;
const connectionText = document.getElementById("connection");
let debounceGenGraph;
let updateGraph = false;
const MAX_NUMBER_LINES = 100;
const MAX_NUMBER_CHARACTERS = 10000;

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
            displayEditorError( "Could not connect to language server. Reconnecting ...");
        }
        if(languageClient !== undefined && languageClient.isRunning()){
            //languageClient.dispose();
        }
        setTimeout(() => {
            createWebSocket(url);
        }, 500);
    };
    webSocket.onopen = () => {
        if(connectionText){
            displayEditorError("");
        }
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
            reader,
            writer
        });

        languageClient.start();
        reader.onClose(() => {
            if(languageClient !== undefined && languageClient.isRunning()){
                //languageClient.dispose();
            }
            setTimeout(() => {
                createWebSocket(url);
            }, 500);
        });
    };
    /*
    webSocket.onclose = () => {
        if(languageClient !== undefined && languageClient.isRunning()){
            languageClient.dispose();
        }
        setTimeout(() => {
            createWebSocket(url);
        }, 500);
    }
    */
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
                    debounceGenGraph = lodash.debounce(() => {
                        client?.sendRequest(ExecuteCommandRequest.type, information).then((res) => {
                            createDiagramFromDot(res as string);
                        });
                    }, 500);
                    console.log("command: " + command);
                    console.log("args: " + args);

                    if(command === "uvls/open_config") {
                        const dialog: HTMLDialogElement | null = document.querySelector("#dialog")
                        const modalClose: HTMLButtonElement | null = document.querySelector('#modalClose');
                        if(modalClose){
                            modalClose.onclick = () => dialog?.close();
                        }
                        dialog?.showModal();
                        //we do not support config view
                        return;
                    }
                    else if(command === "uvls/generate_diagram") {
                        client?.sendRequest(ExecuteCommandRequest.type, information).then((res) => {
                            createDiagramFromDot(res as string);
                        });

                        if(!updateGraph){
                            updateGraph = true;

                            const firstPane = document.getElementById("first");
                            const secondPane = document.getElementById("second");
                            if(firstPane && secondPane){
                                firstPane.style.width = "50%";
                                secondPane.style.width = "50%";
                            }

                        }else{
                            updateGraph = false;
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
        let svg = viz.renderSVGElement(res!);
        svg.id = "SVGGraph";
        div[0].replaceChildren(svg);
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
    modelRef.object.setLanguageId(languageId);

    // create monaco editor
    const editor = createConfiguredEditor(document.getElementById('container')!, {
        model: modelRef.object.textEditorModel,
        automaticLayout: true
    });

    editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if(!model){
            return;
        }
        const lineCount = model?.getLineCount();

        if(lineCount  && lineCount > MAX_NUMBER_LINES){
            vscode.commands.executeCommand("deleteLeft");
            if(connectionText){
                displayEditorErrorAtContent(editor, `The Editor only allows content up to ${MAX_NUMBER_LINES} Lines!`);
            }
        }
        else if (aggregateCharacters(model) > MAX_NUMBER_CHARACTERS){
            vscode.commands.executeCommand("deleteLeft");
            if(connectionText){
                displayEditorErrorAtContent(editor, `The Editor only allows content up to ${MAX_NUMBER_CHARACTERS} Characters!`);
            }
        }
        debouncedSave();
        if(updateGraph && debounceGenGraph !== undefined){
            debounceGenGraph();
        }
    })

    initIntroJS();
    const debouncedSave = lodash.debounce(saveFm, 1000);

    globalEditor = editor;
};

let globalEditor: IStandaloneCodeEditor | null;


let currentWidget: IOverlayWidget | null;
function displayEditorError(msg: string) {
    if(!globalEditor){
        return;
    }
    const overlayWidget: IOverlayWidget = {
        getId(): string {
            return 'myCustomWidget';
        },
        getPosition(): editor.IOverlayWidgetPosition | null {
            return {
                preference: monaco.editor.OverlayWidgetPositionPreference.TOP_CENTER
            }
        },
        getDomNode(): HTMLElement {
            const node = document.createElement('div');
            const span = document.createElement('span');
            span.textContent = msg;
            span.className = "top-error";
            node.replaceChildren(span);
            return node;
        }
    }
    if(currentWidget){
        globalEditor.removeOverlayWidget(currentWidget);
    }
    currentWidget = overlayWidget;
    globalEditor.addOverlayWidget(overlayWidget);
    // setTimeout(() => {
    //     if(!globalEditor) return;
    //     globalEditor.removeOverlayWidget(overlayWidget);
    // }, 2000);
}

let currentContentWidget: IContentWidget | null;

function displayEditorErrorAtContent(editor: editor.IStandaloneCodeEditor, msg: string) {

    const selection = editor.getSelection();
    const contentWidget: IContentWidget = {
        getId(): string {
            return 'myCustomWidget';
        },
        getPosition(): editor.IContentWidgetPosition | null {
            if(selection){
                return {
                    position: selection.getStartPosition(),
                    preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
                }
            }
            return {
                position: {lineNumber: 1, column: 1},
                preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
            }
        },
        getDomNode(): HTMLElement {
            const node = document.createElement('div');
            const span = document.createElement('span');
            node.className = "uvl-tooltip";
            span.className = "tooltip-text";
            span.textContent = msg;
            node.replaceChildren(span);
            return node;
        }
    }
    if(currentContentWidget){
        editor.removeContentWidget(currentContentWidget);
    }
    currentContentWidget = contentWidget;
    editor.addContentWidget(contentWidget);

    debouceRemoveWidget(editor);
}

const debouceRemoveWidget = lodash.debounce(removeWidget, 2000);

function removeWidget(editor: IStandaloneCodeEditor) {
    console.log("Editor: ", editor);
    if(currentContentWidget){
        editor.removeContentWidget(currentContentWidget);
    }
    currentContentWidget = null;
}

function aggregateCharacters(model: editor.ITextModel): number {
    let addReducer = (previousValue: number, currentValue: string) => {return previousValue + currentValue.length};
    const characters: number = model?.getLinesContent().reduce(addReducer, 0);
    return characters;
}

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

export function sendGenerateGraphCommand(){
    vscode.commands.executeCommand("uvls/generate_diagram", `file:///workspace/${fileID}.uvl`);
}