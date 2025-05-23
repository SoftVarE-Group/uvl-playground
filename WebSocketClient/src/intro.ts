import introJs from "intro.js";
import { sendGenerateGraphCommand } from "./main";


export const initIntroJS = () => {
    const intro = introJs();

    intro.setOptions({
        steps: [{
            element: '#container', intro: 'This is the text editor where you write and edit your UVL feature model. It will assist you with syntax highlighting, autocompletion and more features.\n Please note: The editor limits the content length as it is not intended for larger projects.',
        }, {
            element: '.codelens-decoration', intro: 'You can click on the buttons to use a variety of features.'
        }, {
            element: "[id='1']",
            intro: 'For example, click here to visualize your feature model. The feature model on the right is then automatically updated when you edit the model. Click on it again to hide it.'
        }, {
            element: "#separator1", intro: 'You can change the size of the editor and the visualization with your mouse.'
        }, {
            element: "#uvl-tutorialButton", intro: 'If you are not familiar with UVL or need a little refresh, click here to get a quick tutorial of the language.'
        }, {
            element: ".dropdown-wrapper", intro: 'Click here to load an UVL example from a list of different examples.'
        }, {
            element: "#theme-toggle", intro: 'Click here to change between light and dark mode.'
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

        const helperLayer = document.getElementsByClassName("tmpClass");
        setTimeout(() => {
            if(helperLayer[0] instanceof HTMLElement){
                if(document.documentElement.getAttribute('data-theme') === "dark"){
                    helperLayer[0].style["box-shadow"] = "rgb(255, 255, 255) 0px 0px 1px 2px, rgba(230, 230, 230, 0.44) 0px 0px 0px 5000px";
                }else{
                    helperLayer[0].style["box-shadow"] = "rgb(0, 0, 0) 0px 0px 1px 2px, rgba(0, 0, 0, 0.8) 0px 0px 0px 5000px";
                }
            }
        }, 100);
    });
}