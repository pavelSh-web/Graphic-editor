import React from 'react';
import { inject, observer } from "mobx-react";

const PanelShapes = observer((props: any) => {
    const activeType = props.editor.activeType;

    const setActiveType = (type: string) => {
        props.editor.activeType = type;
    }

    return (
        <div className="panel-shapes">
            <div className={ `panel-shapes-type ${ activeType === 'rectangle' ? 'active' : '' }` } onPointerDown={ setActiveType.bind({}, 'rectangle') }>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="1.5" y="1.5" width="21" height="21" stroke="white" strokeWidth="3"/>
                </svg>
            </div>
            <div className={ `panel-shapes-type ${ activeType === 'ellipse' ? 'active' : '' }` } onPointerDown={ setActiveType.bind({}, 'ellipse') }>
                <svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <rect x="1.5" y="1.5" width="26" height="26" rx="13" stroke="white" strokeWidth="3"/>
                </svg>
            </div>
            <div className={ `panel-shapes-type ${ activeType === 'path' ? 'active' : '' }` } onPointerDown={ setActiveType.bind({}, 'path') }>
                <svg width="31" height="22" viewBox="0 0 31 22" fill="none">
                    <path d="M2 21L18 3L24.5 18L29.5 6.5" stroke="white" strokeWidth="3"/>
                </svg>
            </div>
        </div>
    );
});

export default inject('editor')(PanelShapes);
