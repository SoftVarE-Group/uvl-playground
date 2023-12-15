import {editor} from "monaco-editor";
import {tutorialContent} from "../assets/uvlTutorialContent.ts";

export default function initUvlTutorial(editor: editor.IStandaloneCodeEditor) {
    let tutorialToogle = false;
    const uvlTutorialButton = document.getElementById("uvl-tutorialButton");

    if (uvlTutorialButton) {
        uvlTutorialButton.addEventListener('click', function () {
            let tutorialPageCounter = 0;
            tutorialToogle = !tutorialToogle;
            let mainDiv = document.getElementById("main-div");
            let splitter = document.getElementById("splitter");
            if (tutorialToogle) {
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
    }

    function getTutorialPage(mainDiv, pageNumber) {
        const content = tutorialContent[pageNumber];
        let newDiv = document.createElement('div');
        newDiv.id = "uvl-tutorial-div";
        let headline = document.createElement('h2');
        headline.textContent = content.title;
        let text = document.createElement('div');
        text.textContent = content.text;
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
                tutorialToogle = !tutorialToogle;
            }
        }
        navigationContainer.appendChild(nextButton);

        newDiv.appendChild(headline);
        newDiv.appendChild(text);
        newDiv.appendChild(navigationContainer);
        if (content.codeListing !== undefined) {
            editor.setValue(content.codeListing);
        }
        return newDiv;
    }
}

