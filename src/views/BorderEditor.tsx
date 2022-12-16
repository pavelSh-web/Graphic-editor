import React, {useState} from 'react';
import { inject, observer } from "mobx-react";
import { openColorpicker } from "../helpers";

const BorderEditor = observer((props: any) => {
    const { editor } = props;

    const [editorActive, setEditorActive] = useState(false);

    const colorpicker = (event: any) => {
        openColorpicker(event, editor, {}, (color) => {
            editor.activeBorderColor = color;

            setEditorActive(false);
        });

        setEditorActive(true);
    };

    const setBorderWidth = (e: any) => {
        const value = e.target.value;

        editor.activeBorderWidth = +value;
    }

    return (
        <div className="border-editor">
            <div className={ `settings-editor fill-editor ${ editorActive ? 'active' : '' }` } onClick={ colorpicker }>
                <div className="settings-editor-label">Border</div>
                <div className={ `settings-editor-shape settings-editor-shape_fill ${ editor.activeBorderColor === 'transparent' ? 'transparent' : '' } ${ editor.activeType }` } style={{
                    border: `5px solid ${ editor.activeBorderColor }`
                }}/>
            </div>
            <div className="settings-editor width-editor">
                <div className="settings-editor-label">Width</div>
                <input type="range" id="volume" name="volume" min="1" max="20" value={ editor.activeBorderWidth } onInput={ setBorderWidth }/>
            </div>
        </div>
    );
});

export default inject('editor')(BorderEditor);
