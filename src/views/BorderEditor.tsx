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
    }

    return (
        <div className={ `settings-editor fill-editor ${ editorActive ? 'active' : '' }` } onClick={ colorpicker }>
            <div className="settings-editor-label">Color</div>
            <div className={ `settings-editor-shape settings-editor-shape_fill ${ editor.activeBorderColor === 'transparent' ? 'transparent' : '' } ${ editor.activeType }` } style={{
                border: `5px solid ${ editor.activeBorderColor }`
            }}/>
        </div>
    );
});

export default inject('editor')(BorderEditor);
