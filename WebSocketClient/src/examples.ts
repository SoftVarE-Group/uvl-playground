import { editor } from "monaco-editor";
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;

let globalEditor: editor.IStandaloneCodeEditor|null;


export function initExamples(editor: editor.IStandaloneCodeEditor) {
    globalEditor = editor;
    loadDefaultExample();
}

const defaultExampleText = "features\n\tfeature1\n\t\tor\n\t\t\tfeature2\n\t\t\tfeature3\n\nconstraints\n\tfeature1";


function loadDefaultExample() {
    const button: HTMLButtonElement|null = document.querySelector("#defaultExample");
    if(button){
        button.onclick = () => {
            const opsModel = globalEditor?.getModel();
            if (opsModel) {
                const fullModelRange = opsModel.getFullModelRange();
                const operation: IIdentifiedSingleEditOperation = {text: defaultExampleText, range: fullModelRange};
                opsModel.applyEdits([operation], false);
            }
        }
    }
}