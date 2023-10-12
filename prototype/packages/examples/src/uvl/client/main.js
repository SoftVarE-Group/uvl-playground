"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.startPythonClient = void 0;
var monaco = require("monaco-editor");
var vscode = require("vscode");
var monaco_vscode_theme_defaults_default_extension_1 = require("@codingame/monaco-vscode-theme-defaults-default-extension");
require("@codingame/monaco-vscode-python-default-extension");
var services_1 = require("vscode/services");
var monaco_1 = require("vscode/monaco");
var extensions_1 = require("vscode/extensions");
var monaco_vscode_configuration_service_override_1 = require("@codingame/monaco-vscode-configuration-service-override");
var monaco_vscode_keybindings_service_override_1 = require("@codingame/monaco-vscode-keybindings-service-override");
var monaco_vscode_theme_service_override_1 = require("@codingame/monaco-vscode-theme-service-override");
var monaco_vscode_textmate_service_override_1 = require("@codingame/monaco-vscode-textmate-service-override");
var monaco_languageclient_1 = require("monaco-languageclient");
var vscode_languageclient_1 = require("vscode-languageclient");
var vscode_ws_jsonrpc_1 = require("vscode-ws-jsonrpc");
var files_1 = require("vscode/service-override/files");
var vscode_1 = require("vscode");
var common_js_1 = require("../../common.js");
var monaco_editor_workers_1 = require("monaco-editor-workers");
(0, monaco_editor_workers_1.buildWorkerDefinition)('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);
var languageId = 'python';
var languageClient;
var createWebSocket = function (url) {
    var webSocket = new WebSocket(url);
    webSocket.onopen = function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket, reader, writer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    socket = (0, vscode_ws_jsonrpc_1.toSocket)(webSocket);
                    reader = new vscode_ws_jsonrpc_1.WebSocketMessageReader(socket);
                    writer = new vscode_ws_jsonrpc_1.WebSocketMessageWriter(socket);
                    languageClient = createLanguageClient({
                        reader: reader,
                        writer: writer
                    });
                    return [4 /*yield*/, languageClient.start()];
                case 1:
                    _a.sent();
                    reader.onClose(function () { return languageClient.stop(); });
                    return [2 /*return*/];
            }
        });
    }); };
    return webSocket;
};
var createLanguageClient = function (transports) {
    return new monaco_languageclient_1.MonacoLanguageClient({
        name: 'Pyright Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: [languageId],
            // disable the default error handler
            errorHandler: {
                error: function () { return ({ action: vscode_languageclient_1.ErrorAction.Continue }); },
                closed: function () { return ({ action: vscode_languageclient_1.CloseAction.DoNotRestart }); }
            },
            // pyright requires a workspace folder to be present, otherwise it will not work
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: monaco.Uri.parse('/workspace')
            },
            synchronize: {
                fileEvents: [vscode.workspace.createFileSystemWatcher('**')]
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: function () {
                return Promise.resolve(transports);
            }
        }
    });
};
var startPythonClient = function () { return __awaiter(void 0, void 0, void 0, function () {
    var extension, fileSystemProvider, registerCommand, modelRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // init vscode-api
            return [4 /*yield*/, (0, monaco_languageclient_1.initServices)({
                    userServices: __assign(__assign(__assign(__assign({}, (0, monaco_vscode_theme_service_override_1["default"])()), (0, monaco_vscode_textmate_service_override_1["default"])()), (0, monaco_vscode_configuration_service_override_1["default"])(vscode_1.Uri.file('/workspace'))), (0, monaco_vscode_keybindings_service_override_1["default"])()),
                    debugLogging: true,
                    logLevel: services_1.LogLevel.Debug
                })];
            case 1:
                // init vscode-api
                _a.sent();
                console.log('Before ready themes');
                return [4 /*yield*/, (0, monaco_vscode_theme_defaults_default_extension_1.whenReady)()];
            case 2:
                _a.sent();
                console.log('After ready themes');
                extension = {
                    name: 'python-client',
                    publisher: 'monaco-languageclient-project',
                    version: '1.0.0',
                    engines: {
                        vscode: '^1.78.0'
                    },
                    contributes: {
                        languages: [{
                                id: languageId,
                                aliases: [
                                    'Python'
                                ],
                                extensions: [
                                    '.py',
                                    '.pyi'
                                ]
                            }],
                        commands: [{
                                command: 'pyright.restartserver',
                                title: 'Pyright: Restart Server',
                                category: 'Pyright'
                            },
                            {
                                command: 'pyright.organizeimports',
                                title: 'Pyright: Organize Imports',
                                category: 'Pyright'
                            }],
                        keybindings: [{
                                key: 'ctrl+k',
                                command: 'pyright.restartserver',
                                when: 'editorTextFocus'
                            }]
                    }
                };
                (0, extensions_1.registerExtension)(extension, 1 /* LocalProcess */);
                (0, monaco_vscode_configuration_service_override_1.updateUserConfiguration)("{\n        \"editor.fontSize\": 14,\n        \"workbench.colorTheme\": \"Default Dark Modern\"\n    }");
                fileSystemProvider = new files_1.RegisteredFileSystemProvider(false);
                fileSystemProvider.registerFile(new files_1.RegisteredMemoryFile(vscode.Uri.file('/workspace/hello.py'), 'print("Hello, World!")'));
                (0, files_1.registerFileSystemOverlay)(1, fileSystemProvider);
                // create the web socket and configure to start the language client on open, can add extra parameters to the url if needed.
                createWebSocket((0, common_js_1.createUrl)('localhost', 30000, '/pyright', {
                    // Used to parse an auth token or additional parameters such as import IDs to the language server
                    authorization: 'UserAuth'
                    // By commenting above line out and commenting below line in, connection to language server will be denied.
                    // authorization: 'FailedUserAuth'
                }, false));
                registerCommand = function (cmdName, handler) { return __awaiter(void 0, void 0, void 0, function () {
                    var commands;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, vscode.commands.getCommands(true)];
                            case 1:
                                commands = _a.sent();
                                if (!commands.includes(cmdName)) {
                                    vscode.commands.registerCommand(cmdName, handler);
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                // always exectute the command with current language client
                return [4 /*yield*/, registerCommand('pyright.restartserver', function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        languageClient.sendRequest('workspace/executeCommand', { command: 'pyright.restartserver', arguments: args });
                    })];
            case 3:
                // always exectute the command with current language client
                _a.sent();
                return [4 /*yield*/, registerCommand('pyright.organizeimports', function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        languageClient.sendRequest('workspace/executeCommand', { command: 'pyright.organizeimports', arguments: args });
                    })];
            case 4:
                _a.sent();
                return [4 /*yield*/, (0, monaco_1.createModelReference)(monaco.Uri.file('/workspace/hello.py'))];
            case 5:
                modelRef = _a.sent();
                modelRef.object.setLanguageId(languageId);
                // create monaco editor
                (0, monaco_1.createConfiguredEditor)(document.getElementById('container'), {
                    model: modelRef.object.textEditorModel,
                    automaticLayout: true
                });
                return [2 /*return*/];
        }
    });
}); };
exports.startPythonClient = startPythonClient;
