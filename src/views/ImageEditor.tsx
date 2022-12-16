import React from 'react';
import { inject, observer } from "mobx-react";

const ImageEditor = observer((props: any) => {
    const { editor } = props;

    const setInterpolation = (interpolation: 'linear' | 'stepwise') => {
        editor.activeInterpolation = interpolation;
    }

    const activeIsImage = editor.focusedShapes.length === 1 && editor.focusedShapes[0].type === 'image';

    return (
        <div className={ `image-editor ${ activeIsImage ? '' : 'hidden' }` }>
            <div className={ `editor-button ${ editor.activeInterpolation === 'stepwise' ? 'active' : '' }` } onClick={ setInterpolation.bind(this, 'stepwise') }>
                Stepwise interpolation
            </div>
            <div className={ `editor-button ${ editor.activeInterpolation === 'linear' ? 'active' : '' }` } onClick={ setInterpolation.bind(this, 'linear') }>
                Linear interpolation
            </div>
        </div>
    );
});

export default inject('editor')(ImageEditor);
