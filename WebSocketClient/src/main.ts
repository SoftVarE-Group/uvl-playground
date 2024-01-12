import * as monaco from 'monaco-editor';
import {editor} from 'monaco-editor';
import * as vscode from 'vscode';
import {CodeLens, LogLevel, ProviderResult, Uri} from 'vscode';
import {whenReady} from '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import {createConfiguredEditor, createModelReference} from 'vscode/monaco';
import {ExtensionHostKind, registerExtension} from 'vscode/extensions';
import getConfigurationServiceOverride, {
    updateUserConfiguration
} from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import {initServices, MonacoLanguageClient} from 'monaco-languageclient';
import {CloseAction, ErrorAction, ExecuteCommandSignature, MessageTransports} from 'vscode-languageclient';
import {toSocket, WebSocketMessageReader, WebSocketMessageWriter} from 'vscode-ws-jsonrpc';
import {
    RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay
} from 'vscode/service-override/files';
import config from './config.js';
import {instance} from "@viz-js/viz";
import {Message} from 'vscode-jsonrpc';
import {v4 as uuidv4} from 'uuid';
import lodash from 'lodash';
import {ExecuteCommandRequest} from 'vscode-languageserver-protocol';
import initUvlTutorial from './uvlTutorial.ts';

import {buildWorkerDefinition} from 'monaco-editor-workers';
import {initIntroJS} from "./intro.ts";
import {downloadFile, uploadFile} from "./ImportExportFiles.ts";
import {initExamples} from "../assets/uvlExamples.ts";
import {aggregateCharacters, displayEditorError, displayEditorErrorAtContent} from "./util.ts";
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;

buildWorkerDefinition('./node_modules/monaco-editor-workers/dist/workers', new URL('', window.location.href).href, false);

const languageId = 'uvls';
let languageClient: MonacoLanguageClient;
let fileID;
let model;
let updateGraph = false;

const createUrl = (hostname: string, port: number, path: string, secure: boolean): string => {
    const protocol = secure ? 'wss' : 'ws';
    const url = new URL(`${protocol}://${hostname}:${port}${path}`);
    return url.toString();
};

const createWebSocket = (url: string): WebSocket => {
    const webSocket = new WebSocket(url);

    webSocket.onerror = () => {
        displayEditorError("Could not connect to language server. Reconnecting ...");
        setTimeout(() => {
            createWebSocket(url);
        }, 500);
    };
    webSocket.onopen = () => {
        displayEditorError("");
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
            reader, writer
        });

        languageClient.start();
        reader.onClose(() => {
            setTimeout(() => {
                createWebSocket(url);
            }, 500);
        });
    };

    return webSocket;
};

function onExecuteCommand(command: string, args: any[], client: MonacoLanguageClient, next: ExecuteCommandSignature) {
    const information = {command: command, arguments: args};
    debounceGenGraph = lodash.debounce(() => {
        client?.sendRequest(ExecuteCommandRequest.type, {
            command: "uvls/generate_diagram",
            arguments: [`file:///workspace/${fileID}.uvl`]
        }).then((res) => {
            createDiagramFromDot(res as string);
        });
    }, 500);
    if (command === "uvls/open_config") {
        const dialog: HTMLDialogElement | null = document.querySelector("#dialog")
        const modalClose: HTMLButtonElement | null = document.querySelector('#modalClose');
        if (modalClose) {
            modalClose.onclick = () => dialog?.close();
        }
        //we do not support config view
        dialog?.showModal();
        return;
    } else if (command === "uvls/generate_diagram") {
        client?.sendRequest(ExecuteCommandRequest.type, information).then((res) => {
            createDiagramFromDot(res as string);
        });
        model.setLanguageId("blablibub");
        model.setLanguageId(languageId);
        if (!updateGraph) {
            updateGraph = true;

            const firstPane = document.getElementById("first");
            const secondPane = document.getElementById("second");
            if (firstPane && secondPane) {
                firstPane.style.width = "50%";
                secondPane.style.width = "50%";
            }

        } else {
            updateGraph = false;
            const div = document.getElementsByClassName("graph");
            const firstPane = document.getElementById("first");
            while (div[0].firstChild) {
                div[0].removeChild(div[0].firstChild);
            }
            const secondPane = document.getElementById("second");
            if (firstPane && secondPane) {
                firstPane.style.width = "100%";
                secondPane.style.width = "0%";
            }
        }
    } else {
        next(command, args);
    }
}

const createLanguageClient = (transports: MessageTransports): MonacoLanguageClient => {
    vscode.commands.registerCommand("uvlPlayground/uploadFile", () => {
        const newContent = uploadFile();
        newContent.then((textContent) => {
            const opsModel = globalEditor?.getModel();
            if (opsModel) {
                const fullModelRange = opsModel.getFullModelRange();
                const operation: IIdentifiedSingleEditOperation = {text: textContent, range: fullModelRange};
                opsModel.applyEdits([operation], true);
            }
        })
    });
    vscode.commands.registerCommand("uvlPlayground/downloadFile", () => {
        const model1 = globalEditor?.getModel();
        if (model1) {
            downloadFile(model1.getLinesContent().reduce((prev, curr) => {
                return prev + curr + '\n'
            }, ""), fileID);
        }
    });
    const client = new MonacoLanguageClient({
        name: 'UVL Language Client', clientOptions: {
            // use a language id as a document selector
            documentSelector: [languageId], // disable the default error handler
            errorHandler: {
                error: () => ({action: ErrorAction.Continue}), closed: () => ({action: CloseAction.Restart})
            }, // pyright requires a workspace folder to be present, otherwise it will not work
            workspaceFolder: {
                index: 0, name: 'workspace', uri: monaco.Uri.parse('/workspace')
            }, synchronize: {
                fileEvents: [vscode.workspace.createFileSystemWatcher('**')]
            }, connectionOptions: {
                // This construct can be used to filter the messages we are receiving from the language server
                messageStrategy: {
                    handleMessage(message: Message, next: (message: Message) => void) {
                        if (Message.isRequest(message)) {
                            // Filters requests send by uvls -> Anti-Pattern in our opinion
                        } else if (Message.isResponse(message)) {
                            // Filters responses send by uvls
                        } else if (Message.isNotification(message)) {
                            // Filters Notification messages following json-rpc spec
                        }
                        // "next" is the default behaviour
                        next(message);
                    }
                }
            }, // The Middleware allows us to intercept all messages that would be sent to the language server
            middleware: {
                executeCommand(command, args, next) {
                    onExecuteCommand(command, args, client, next);
                }, provideCodeLenses(document, token, next): ProviderResult<CodeLens[]> {
                    const results = next(document, token);
                    if (results instanceof Promise) {
                        results.then((codeLenses: CodeLens[]) => {
                            codeLenses.forEach((codeLens) => {
                                if (codeLens.command?.title === "generate graph") {
                                    codeLens.command.title = updateGraph ? "Hide Feature Model" : "Show Feature Model";
                                }
                            });
                            const command1: vscode.Command = {
                                title: "Download File",
                                command: "uvlPlayground/downloadFile",
                                tooltip: "Download a File"
                            }
                            const codeLens1: CodeLens = new CodeLens(codeLenses[0].range, command1);
                            codeLenses.push(codeLens1);
                            const command: vscode.Command = {
                                title: "Upload File",
                                command: "uvlPlayground/uploadFile",
                                tooltip: "Upload a File"
                            }
                            const codeLens: CodeLens = new CodeLens(codeLenses[0].range, command);
                            codeLenses.push(codeLens);
                        })
                    }
                    return results;
                }
            }
        }, // create a language client connection from the JSON RPC connection on demand
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
        let svg = viz.renderSVGElement(res);
        svg.id = "SVGGraph";
        div[0].replaceChildren(svg);
    });
}

export const startUvlClient = async () => {
    // init vscode-api
    const useDebugLogging = config.debug ? LogLevel.Debug : LogLevel.Off;
    await initServices({
        userServices: {
            ...getThemeServiceOverride(), ...getTextmateServiceOverride(), ...getConfigurationServiceOverride(Uri.file('/workspace')), ...getKeybindingsServiceOverride(),
        }, debugLogging: config.debug, logLevel: useDebugLogging,
    });

    await whenReady();
    // extension configuration derived from:
    // https://github.com/microsoft/pyright/blob/main/packages/vscode-pyright/package.json
    // only a minimum is required to get pyright working
    const extension = {
        name: 'uvl-client', publisher: 'monaco-languageclient-project', version: '1.0.0', engines: {
            vscode: '^1.78.0'
        }, contributes: {
            languages: [{
                id: languageId, aliases: ['UVL'], extensions: ['.uvl',]
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
    createWebSocket(createUrl(config.languageServerHostName, config.port, '/', location.protocol === 'https:'));


    // use the file create before
    const modelRef = await createModelReference(monaco.Uri.file(`/workspace/${fileID}.uvl`));
    model = modelRef.object;
    modelRef.object.setLanguageId(languageId);

    // create monaco editor
    const editor = createConfiguredEditor(document.getElementById('container')!, {
        model: modelRef.object.textEditorModel, automaticLayout: true, minimap: {enabled: false}
    });

    // Needs to be redone at some point as undo does not always work
    editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (!model) {
            return;
        }
        const lineCount = model.getLineCount();
        let numberCharacters = aggregateCharacters(model);

        if (lineCount > config.MAX_NUMBER_LINES) {
            if (lineCount > config.MAX_NUMBER_LINES + 1) {
                vscode.commands.executeCommand("undo");
            } else {
                vscode.commands.executeCommand("deleteLeft");
            }
            displayEditorErrorAtContent(`The Editor only allows content up to ${config.MAX_NUMBER_LINES} Lines! (Because of performance reasons)`);
        } else if (numberCharacters > config.MAX_NUMBER_CHARACTERS) {
            if (numberCharacters > config.MAX_NUMBER_CHARACTERS + 1) {
                vscode.commands.executeCommand("undo");
            } else {
                vscode.commands.executeCommand("deleteLeft");
            }
            displayEditorErrorAtContent(`The Editor only allows content up to ${config.MAX_NUMBER_CHARACTERS} Characters! (Because of performance reasons)`);
        }
        debouncedSave();
        if (updateGraph && debounceGenGraph !== undefined) {
            debounceGenGraph();
        }
    })

    initIntroJS();
    initUvlTutorial(editor);
    initExamples(editor);
    const debouncedSave = lodash.debounce(saveFm, 1000);

    globalEditor = editor;
};

let debounceGenGraph = lodash.debounce(() => {
    languageClient?.sendRequest(ExecuteCommandRequest.type, {
        command: "uvls/generate_diagram",
        arguments: [`file:///workspace/${fileID}.uvl`]
    }).then((res) => {
        createDiagramFromDot(res as string);
    });
}, 500);

export let globalEditor: editor.IStandaloneCodeEditor | null;


function getInitialFm() {
    let initialFm = `features
    HelloWorld
        optional
            Greetings`;
    const storedFm = window.localStorage.getItem("fm");
    if (storedFm !== null) {
        initialFm = storedFm;
    }
    return initialFm;
}

function saveFm() {
    if (model !== undefined) {
        const content = model.textEditorModel?.getValue();
        window.localStorage.setItem("fm", content);
    }
}

export function sendGenerateGraphCommand() {
    vscode.commands.executeCommand("uvls/generate_diagram", `file:///workspace/${fileID}.uvl`);
}