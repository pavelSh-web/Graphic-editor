import React from 'react';
import ImageEditor from './ImageEditor';
import PanelShapes from './PanelShapes';
import PanelShapeEditor from './PanelShapeEditor';


function Panel() {
    return (
        <div className="panel" onPointerDown={ (e) => e.stopPropagation() }>
            <PanelShapes />
            <PanelShapeEditor />
            <ImageEditor />
        </div>
    );
}

export default Panel;
