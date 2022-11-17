import React from 'react';
import PanelShapes from './PanelShapes';
import PanelShapeEditor from './PanelShapeEditor';

function Panel(props: any) {
    return (
        <div className="panel" onPointerDown={ (e) => e.stopPropagation() }>
            <PanelShapes editor={ props.editor }/>
            <PanelShapeEditor editor={ props.editor }/>
        </div>
    );
}

export default Panel;
