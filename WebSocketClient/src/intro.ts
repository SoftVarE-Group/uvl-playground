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
        intro.setOption("highlightClass", "tmpClass");
        intro.start();

        var helperLayer = document.getElementsByClassName("tmpClass");
        setTimeout(() => {
            if(helperLayer[0] instanceof HTMLElement){
                helperLayer[0].style["box-shadow"] = "rgb(255, 255, 255) 0px 0px 1px 2px, rgba(230, 230, 230, 0.44) 0px 0px 0px 5000px";
            }
        }, 100);
            
        
    });

}