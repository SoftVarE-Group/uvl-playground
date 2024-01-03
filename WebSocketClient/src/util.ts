import {editor} from "monaco-editor";
import * as monaco from "monaco-editor";
import {globalEditor} from "./main.ts";
import lodash from 'lodash';


let currentWidget: editor.IOverlayWidget | null;

export function displayEditorError(msg: string) {
    if (!globalEditor) {
        return;
    }
    const overlayWidget: editor.IOverlayWidget = {
        getId(): string {
            return 'myCustomWidget';
        }, getPosition(): editor.IOverlayWidgetPosition | null {
            return {
                preference: monaco.editor.OverlayWidgetPositionPreference.TOP_CENTER
            }
        }, getDomNode(): HTMLElement {
            const node = document.createElement('div');
            const span = document.createElement('span');
            span.textContent = msg;
            span.className = "error";
            node.replaceChildren(span);
            return node;
        }
    }
    if (currentWidget) {
        globalEditor.removeOverlayWidget(currentWidget);
    }
    currentWidget = overlayWidget;
    globalEditor.addOverlayWidget(overlayWidget);
}

let currentContentWidget: editor.IContentWidget | null;

export function displayEditorErrorAtContent(msg: string) {
    if(!globalEditor){
        return;
    }
    const selection = globalEditor.getSelection();
    const contentWidget: editor.IContentWidget = {
        getId(): string {
            return 'myCustomWidget';
        }, getPosition(): editor.IContentWidgetPosition | null {
            if (selection) {
                return {
                    position: selection.getStartPosition(),
                    preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
                }
            }
            return {
                position: {lineNumber: 1, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
            }
        }, getDomNode(): HTMLElement {
            const node = document.createElement('div');
            const span = document.createElement('span');
            node.className = "uvl-tooltip";
            span.className = "tooltip-text";
            span.textContent = msg;
            node.replaceChildren(span);
            return node;
        }
    }
    removeWidget();
    currentContentWidget = contentWidget;
    globalEditor.addContentWidget(contentWidget);

    debounceRemoveWidget();
}

const debounceRemoveWidget = lodash.debounce(removeWidget, 2000);

function removeWidget() {
    if (currentContentWidget) {
        globalEditor?.removeContentWidget(currentContentWidget);
    }
    currentContentWidget = null;
}

export function aggregateCharacters(model: editor.ITextModel): number {
    let addReducer = (previousValue: number, currentValue: string) => {
        return previousValue + currentValue.length
    };
    return model?.getLinesContent().reduce(addReducer, 0);
}