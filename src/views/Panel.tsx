import React from 'react';
import PanelShapes from './PanelShapes';
import PanelShapeEditor from './PanelShapeEditor';


function Panel() {
    return (
        <div className="panel" onPointerDown={ (e) => e.stopPropagation() }>
            <PanelShapes />
            <PanelShapeEditor />
        </div>
    );
}

export default Panel;
