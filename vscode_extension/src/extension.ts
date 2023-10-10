//Credit: Much of this was stolen from zigtools
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {ExtensionContext, window} from 'vscode';
import {
    ExecuteCommandRequest, LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo, Trace,
} from 'vscode-languageclient/node';
import * as net from "net";
import {Duplex} from "stream";

let client: LanguageClient | null = null;
let outputChannel: vscode.OutputChannel | null = null;
let rangeOrOptions: Map<String, Array<Array<vscode.Range>>> = new Map();
const decorators: Array<vscode.TextEditorDecorationType> = new Array(4);

export async function activate(context: vscode.ExtensionContext) {

    vscode.commands.registerCommand('uvls.check_for_updates', async () => {
        await stopClient();
        await startClient(context);
    });
    vscode.commands.registerCommand('uvls.restart', async () => {
        await stopClient();
        await startClient(context);
    });
    vscode.commands.registerCommand('uvls.open_web', async (args) => {
        const uri = args[0].uri;
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel('uvlsConfig', // Identifies the type of the webview. Used internally
            'UVLS Configure', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true, retainContextWhenHidden: true
            } // Webview options. More on these later.
        );
        outputChannel?.appendLine(`${uri}`);
        panel.webview.html = panel.webview.html = `<!DOCTYPE html>
		<html lang="en"">
		<head>
			<meta charset="UTF-8">
			<title>Preview</title>
		</head>
		<body>
			<iframe src="${uri}" style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;"></iframe>
		</body>
		</html>`;
    });
    vscode.commands.registerCommand('uvls.generate_diagram', async () => {
        if (!client) {
            return;
        }

        const uri = window.activeTextEditor?.document.uri;
        if (uri === undefined || !uri.toString().endsWith('uvl')) {
            return;
        }

        const content = await client.sendRequest(ExecuteCommandRequest.method, {
            command: "uvls/generate_diagram", arguments: [uri.toString()]
        });

        const regex = /(.*\.)(.*)/gm;
        const subst = '$1dot';
        let doturi = vscode.Uri.file(uri.fsPath.replace(regex, subst));
        /* // open graphviz (dot) source file
        vscode.workspace.openTextDocument(doturi).then(doc => {
            vscode.window.showTextDocument(doc);
        });*/

        // Open with external extension
        const graphvizExtension = vscode.extensions.getExtension("tintinweb.graphviz-interactive-preview");
        if (graphvizExtension === undefined) {
            window.showInformationMessage("You do not have the recommended [Graphviz Preview Extension](https://marketplace.visualstudio.com/items?itemName=tintinweb.graphviz-interactive-preview) installed.\nActivate it to have the best user experience and be able to see the generated graph!");
            return;
        }
        graphvizExtension.activate();
        let options = {uri: doturi, title: "Feature Model", content};
        vscode.commands.executeCommand("graphviz-interactive-preview.preview.beside", options);

    });
    await startClient(context);
}


// This method is called when your extension is deactivated
export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

function connectToServer(): Duplex {
    const hostname = "d332ff06-00f8-42cd-9bb9-b2f6b9e7f19e.ul.bw-cloud-instance.org";
    const port = 8080;
    const socket = new net.Socket();
    socket.connect(port, hostname);
    return socket;
}

async function startClient(context: ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("UVL Language Server");
    const connection = connectToServer();
    const serverOptions: ServerOptions = () => Promise.resolve<StreamInfo>({reader: connection, writer: connection})
    // Decorator for dead features
    decorators[0] = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath("assets/deadfeature.svg"),
        gutterIconSize: "90%",
        backgroundColor: {id: 'color.deadfeature'}
    });

    // Decorator for false-optional features
    decorators[1] = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath("assets/falseoptional.svg"),
        gutterIconSize: "90%",
        backgroundColor: {id: 'color.yellow'}
    });

    //Decorator for redundant Constraints
    decorators[2] = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath("assets/redundantconstraint.svg"),
        gutterIconSize: "90%",
        backgroundColor: {id: 'color.yellow'}
    });
    //Decorator for void feature
    decorators[3] = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath("assets/voidfeature.svg"),
        gutterIconSize: "90%",
        backgroundColor: {id: 'color.voidfeature'}
    });
    rangeOrOptions = new Map();

    //If we change the textEditor, the Decoration remains intact
    window.onDidChangeActiveTextEditor((editor) => {
        if (editor !== undefined && rangeOrOptions !== null) {
            const range = rangeOrOptions.get(editor.document.fileName);
            if (range !== undefined) decorators.forEach((decorator, index) => editor.setDecorations(decorator, range[index]));
        }
    });

    let documentSelector = [{scheme: "file", language: "uvl"}, {scheme: "file", pattern: "**/*.uvl.json"}];
    const clientOptions: LanguageClientOptions = {
        documentSelector, outputChannel, // middleware implements handleDiagnostic
        middleware: {
            // method are called if server send a notification "textDocument/diagnostic"
            handleDiagnostics(uri, diagnostics, next) {
                // handle anomilies
                const textEditor = window.activeTextEditor;

                if (!rangeOrOptions.has(uri.fsPath)) {
                    rangeOrOptions.set(uri.fsPath, [[], [], [], []]);
                }
                let range = rangeOrOptions.get(uri.fsPath);
                range![0] = [];
                range![1] = [];
                range![2] = [];
                range![3] = [];
                for (const ele of diagnostics) {
                    switch (ele.message) {
                        case "dead feature": {
                            range![0].push(ele.range);
                            break;
                        }
                        case "false-optional feature": {
                            range![1].push(ele.range);
                            break;
                        }
                        case "redundant constraint": {
                            range![2].push(ele.range);
                            break;
                        }
                        case "void feature model": {
                            range![3].push(ele.range);
                            break;
                        }

                    }
                }
                if (textEditor !== undefined && textEditor.document.fileName === uri.fsPath) {
                    decorators.forEach((decorator, index) => textEditor.setDecorations(decorator, range![index]));
                }

                next(uri, diagnostics);
            },
        }

    };
    outputChannel.appendLine("test");
    client = new LanguageClient('uvls', serverOptions, clientOptions);
    client.onRequest("workspace/executeCommand", async (args) => {
        await vscode.commands.executeCommand(args.command, args.arguments);

    });
    client.setTrace(Trace.Verbose);
    client.start();
}

async function stopClient(): Promise<void> {
    for (const editor of window.visibleTextEditors) {
        let range = rangeOrOptions.get(editor.document.fileName);
        if (range !== undefined) {
            decorators.forEach((decorator) => editor.setDecorations(decorator, []));
        }
    }
    rangeOrOptions = new Map();
    if (client) client.stop();
    client = null;
}