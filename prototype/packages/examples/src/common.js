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
exports.createJsonEditor = exports.performInit = exports.createDefaultJsonContent = exports.createWebSocketAndStartClient = exports.createUrl = exports.createLanguageClient = void 0;
var monaco_editor_1 = require("monaco-editor");
var monaco_1 = require("vscode/monaco");
require("@codingame/monaco-vscode-theme-defaults-default-extension");
require("@codingame/monaco-vscode-json-default-extension");
var monaco_vscode_configuration_service_override_1 = require("@codingame/monaco-vscode-configuration-service-override");
var monaco_vscode_keybindings_service_override_1 = require("@codingame/monaco-vscode-keybindings-service-override");
var monaco_vscode_theme_service_override_1 = require("@codingame/monaco-vscode-theme-service-override");
var monaco_vscode_textmate_service_override_1 = require("@codingame/monaco-vscode-textmate-service-override");
var monaco_languageclient_1 = require("monaco-languageclient");
var vscode_languageclient_1 = require("vscode-languageclient");
var vscode_ws_jsonrpc_1 = require("vscode-ws-jsonrpc");
var vscode_1 = require("vscode");
var createLanguageClient = function (transports) {
    return new monaco_languageclient_1.MonacoLanguageClient({
        name: 'Sample Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ['json'],
            // disable the default error handler
            errorHandler: {
                error: function () { return ({ action: vscode_languageclient_1.ErrorAction.Continue }); },
                closed: function () { return ({ action: vscode_languageclient_1.CloseAction.DoNotRestart }); }
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
exports.createLanguageClient = createLanguageClient;
var createUrl = function (hostname, port, path, searchParams, secure) {
    if (searchParams === void 0) { searchParams = {}; }
    if (secure === void 0) { secure = location.protocol === 'https:'; }
    var protocol = secure ? 'wss' : 'ws';
    var url = new URL("".concat(protocol, "://").concat(hostname, ":").concat(port).concat(path));
    for (var _i = 0, _a = Object.entries(searchParams); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (value instanceof Array) {
            value = value.join(',');
        }
        if (value) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
};
exports.createUrl = createUrl;
var createWebSocketAndStartClient = function (url) {
    var webSocket = new WebSocket(url);
    webSocket.onopen = function () {
        var socket = (0, vscode_ws_jsonrpc_1.toSocket)(webSocket);
        var reader = new vscode_ws_jsonrpc_1.WebSocketMessageReader(socket);
        var writer = new vscode_ws_jsonrpc_1.WebSocketMessageWriter(socket);
        var languageClient = (0, exports.createLanguageClient)({
            reader: reader,
            writer: writer
        });
        languageClient.start();
        reader.onClose(function () { return languageClient.stop(); });
    };
    return webSocket;
};
exports.createWebSocketAndStartClient = createWebSocketAndStartClient;
var createDefaultJsonContent = function () {
    return "{\n    \"$schema\": \"http://json.schemastore.org/coffeelint\",\n    \"line_endings\": \"unix\"\n}";
};
exports.createDefaultJsonContent = createDefaultJsonContent;
var performInit = function (vscodeApiInit) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(vscodeApiInit === true)) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, monaco_languageclient_1.initServices)({
                        userServices: __assign(__assign(__assign(__assign({}, (0, monaco_vscode_theme_service_override_1["default"])()), (0, monaco_vscode_textmate_service_override_1["default"])()), (0, monaco_vscode_configuration_service_override_1["default"])(vscode_1.Uri.file('/workspace'))), (0, monaco_vscode_keybindings_service_override_1["default"])()),
                        debugLogging: true
                    })];
            case 1:
                _a.sent();
                // register the JSON language with Monaco
                monaco_editor_1.languages.register({
                    id: 'json',
                    extensions: ['.json', '.jsonc'],
                    aliases: ['JSON', 'json'],
                    mimetypes: ['application/json']
                });
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
exports.performInit = performInit;
var createJsonEditor = function (config) { return __awaiter(void 0, void 0, void 0, function () {
    var uri, modelRef, editor, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                uri = vscode_1.Uri.parse('/workspace/model.json');
                return [4 /*yield*/, (0, monaco_1.createModelReference)(uri, config.content)];
            case 1:
                modelRef = _a.sent();
                modelRef.object.setLanguageId('json');
                editor = (0, monaco_1.createConfiguredEditor)(config.htmlElement, {
                    model: modelRef.object.textEditorModel,
                    glyphMargin: true,
                    lightbulb: {
                        enabled: true
                    },
                    automaticLayout: true
                });
                result = {
                    editor: editor,
                    uri: uri,
                    modelRef: modelRef
                };
                return [2 /*return*/, Promise.resolve(result)];
        }
    });
}); };
exports.createJsonEditor = createJsonEditor;
