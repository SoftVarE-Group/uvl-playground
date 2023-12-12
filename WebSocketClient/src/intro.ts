import introJs from "intro.js";
import { sendGenerateGraphCommand } from "./main";


export const initIntroJS = () => {


    var intro = introJs();

    intro.setOptions({
        steps: [{
            element: '#container', intro: 'This is the texteditor where you write and edit your uvl feature model.',
        }, {
            element: '.codelens-decoration', intro: 'You can use the buttons to activate and deactivate functionality.'
        }, {
            element: "[id='1']",
            intro: 'Click here to visualize your feature model und click on it again to hide it again.'
        }, {
            element: "#separator", intro: 'You can change the size of the editor and the visualization with your mouse.'
        }],
    });

    const button = document.getElementById("tutorialButton");

    intro.onchange(function(targetElement) {
        if(targetElement.id === "1"){
            sendGenerateGraphCommand();
        }
        
      });

    button?.addEventListener("click", () => {
        intro.setOption("exitOnOverlayClick", false);
        intro.setOption("overlayOpacity", 0);
        intro.setOption("disableInteraction", true);
        intro.start();
    });

}