import { editor } from "monaco-editor";
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;

let globalEditor: editor.IStandaloneCodeEditor|null;


export function initExamples(editor: editor.IStandaloneCodeEditor) {
    globalEditor = editor;
    loadDefaultExample();
    loadIceCreamExample();
    loadComputerExample();
}

const defaultExampleText = `features
    feature1
        or
            feature2
            feature3
    
constraints
feature1`;
const iceCreamExampleText = `features
    "Ice Cream" {extended__}
        mandatory
            Category
                alternative
                    Popsicle {Price 1}
                    Scoop {Price 2}
            Flavors
                or
                    Lemon
                    Chocolate cardinality [1..3]
                        alternative
                            White
                            Dark
            Container
                alternative
                    Stick
                    Cup
                    Cone

        optional
            Waffle {Price 0.7}
            String "Name of customer"

constraints
    Popsicle => Stick
    Scoop => Cup | Cone
    sum(Price) < 2.5`;

const computerExampleText = `features
    Computer {abstract}
        mandatory
            CPU {Power 100, Manufacturer 'Intel'}
            "Graphics Card"
                or
                    Dedicated {powerConsumption 300}
                    Integrated {powerConsumption 100}
            Cooling
                alternative
                    Liquid
                    Air
            PSU
                alternative
                    StrongPSU
                    WeakPSU
        optional
            "SATA-Devices"
                [0..2]
                    HDD {powerConsumption 10}
                    SSD {powerConsumption 5}
                    "DVD-Drive" {powerConsumption 5}

constraints
    Dedicated => Liquid
    sum(powerConsumption) > 300 => StrongPSU`

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

function loadIceCreamExample() {
    const button: HTMLButtonElement|null = document.querySelector("#iceCreamExample");
    if(button){
        button.onclick = () => {
            const opsModel = globalEditor?.getModel();
            if (opsModel) {
                const fullModelRange = opsModel.getFullModelRange();
                const operation: IIdentifiedSingleEditOperation = {text: iceCreamExampleText, range: fullModelRange};
                opsModel.applyEdits([operation], false);
            }
        }
    }
}

function loadComputerExample() {
    const button: HTMLButtonElement|null = document.querySelector("#computerExample");
    if(button){
        button.onclick = () => {
            const opsModel = globalEditor?.getModel();
            if (opsModel) {
                const fullModelRange = opsModel.getFullModelRange();
                const operation: IIdentifiedSingleEditOperation = {text: computerExampleText, range: fullModelRange};
                opsModel.applyEdits([operation], false);
            }
        }
    }
}