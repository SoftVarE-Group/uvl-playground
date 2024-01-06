import introJs from "intro.js";
import { sendGenerateGraphCommand } from "./main";


export const initIntroJS = () => {


    var intro = introJs();

    intro.setOptions({
        steps: [{
            element: '#container', intro: 'This is the texteditor where you write and edit your UVL feature model. It will assists you with syntaxhighlighting, autocompletion and more features.',
        }, {
            element: '.codelens-decoration', intro: 'You can click on the buttons to use a variety of features.'
        }, {
            element: "[id='1']",
            intro: 'For example click here to visualize your feature model. The feature model on the right is then automatically updated when you edit the model. Click on it again to hide it.'
        }, {
            element: "#separator", intro: 'You can change the size of the editor and the visualization with your mouse.'
        }, {
            element: "#uvl-tutorialButton", intro: 'If you are not familiar with UVL or need a little refresh click here to get a quick tutorial of the language.'
        }],
    });

    const button = document.getElementById("tutorialButton");

    intro.onchange(function(targetElement) {
        if(targetElement.id === "1"){
            setTimeout(() => {
                sendGenerateGraphCommand();
            }, 100);
            
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