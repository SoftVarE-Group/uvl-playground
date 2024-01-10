import * as monaco from "monaco-editor";
import {tutorialContent} from "../assets/uvlTutorialContent.ts";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;
import {editor} from "monaco-editor";
import IStandaloneDiffEditorConstructionOptions = editor.IStandaloneDiffEditorConstructionOptions;

export default function initUvlTutorial(editor: editor.IStandaloneCodeEditor) {
    let tutorialToggle = false;
    const uvlTutorialButton = document.getElementById("uvl-tutorialButton");

    if (uvlTutorialButton) {
        uvlTutorialButton.addEventListener('click', function () {
            let tutorialPageCounter = 0;
            tutorialToggle = !tutorialToggle;
            let mainDiv = document.getElementById("main-div");
            let splitter = document.getElementById("splitter");
            if (tutorialToggle) {
                splitter!.style.width = "75%";
                setTutorialPage(mainDiv, tutorialPageCounter);
            } else {
                splitter!.style.width = "100%";
                let newDiv = document.getElementById("uvl-tutorial-div");
                mainDiv!.removeChild(newDiv!);
            }
        });
    }


    function setTutorialPage(mainDiv, pageNumber) {
        let tutorialDiv = document.getElementById("uvl-tutorial-div");
        if (tutorialDiv !== null) {
            mainDiv.removeChild(tutorialDiv);
        }
        tutorialDiv = getTutorialPage(mainDiv, pageNumber);
        mainDiv.appendChild(tutorialDiv);

        let modifiedCode = tutorialContent[pageNumber].codeListing;
        let originalCode = tutorialContent[pageNumber - 1].codeListing;
        if (modifiedCode && originalCode) {
            const paragraph = document.createElement("p");
            paragraph.id = "hint";
            paragraph.textContent = "Show Changes ›";
            tutorialDiv.appendChild(paragraph);

            paragraph.onclick = () => changesViewOnClick(tutorialDiv, paragraph, originalCode, modifiedCode);
        }
    }

    function getTutorialPage(mainDiv, pageNumber) {
        const content = tutorialContent[pageNumber];
        let newDiv = document.createElement('div');
        newDiv.id = "uvl-tutorial-div";
        let headline = document.createElement('h2');

        headline.textContent = content.title;
        let text = document.createElement('div');
        text.innerHTML = content.text;
        text.className = 'text';

        let navigationContainer = document.createElement('div');
        navigationContainer.className = 'navigationContainer';
        let backButton: HTMLElement = document.createElement('div');
        if (pageNumber > 0) {
            backButton = document.createElement('button');
            backButton.textContent = "Back";

            backButton.onclick = () => {
                setTutorialPage(mainDiv, pageNumber - 1);
            }
        }
        navigationContainer.appendChild(backButton);
        let nextButton = document.createElement('button');
        if (pageNumber < tutorialContent.length - 1) {
            nextButton.textContent = "Next";
            nextButton.onclick = () => {
                setTutorialPage(mainDiv, pageNumber + 1);
            }
        } else {
            nextButton.textContent = "Done";
            nextButton.onclick = () => {
                let splitter = document.getElementById("splitter");
                if(splitter){
                    splitter.style.width = "100%";
                }
                let newDiv = document.getElementById("uvl-tutorial-div");
                mainDiv.removeChild(newDiv);
                tutorialToggle = !tutorialToggle;
            }
        }
        navigationContainer.appendChild(nextButton);

        newDiv.appendChild(headline);
        newDiv.appendChild(text);
        newDiv.appendChild(navigationContainer);
        if (content.codeListing !== undefined) {
            changeEditorContent(editor, content.codeListing);
        }
        return newDiv;
    }

    function changeEditorContent(editor: IStandaloneCodeEditor, newContent: string) {
        const opsModel = editor.getModel();
        if (opsModel) {
            const fullModelRange = opsModel.getFullModelRange();
            const operation: IIdentifiedSingleEditOperation = {text: newContent, range: fullModelRange};
            opsModel.applyEdits([operation], false);
        }
    }

    function changesViewOnClick(tutorialDiv: HTMLElement | null, paragraph: HTMLParagraphElement, originalCode: string | undefined, modifiedCode: string | undefined) {
        if(paragraph.textContent === "Show Changes ›" && tutorialDiv && originalCode && modifiedCode){
            const editordiv = document.createElement("div");
            editordiv.id = "diffEditorDiv";
            tutorialDiv.appendChild(editordiv);

            if (!editordiv) return;

            const originalModel = monaco.editor.createModel(originalCode);
            const modifiedModel = monaco.editor.createModel(modifiedCode);

            let options: IStandaloneDiffEditorConstructionOptions = {
                minimap: {enabled: false},
                scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    horizontalScrollbarSize: 5,
                    verticalScrollbarSize: 5
                },
                renderOverviewRuler: false,
                lineNumbers: "off"
            };

            const diffEditor = monaco.editor.createDiffEditor(editordiv, options);

            diffEditor.setModel({
                original: originalModel, modified: modifiedModel
            });

            paragraph.textContent = "Hide Changes"
        }
        else if(paragraph.textContent === "Hide Changes" && tutorialDiv){
            const diffEditor = document.getElementById("diffEditorDiv");
            if (diffEditor){
                tutorialDiv.removeChild(diffEditor);
            }

            paragraph.textContent = "Show Changes ›"
        }
    }
}

