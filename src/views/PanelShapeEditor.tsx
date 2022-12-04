import React from 'react';
import FillEditor from './FillEditor';
import BorderEditor from './BorderEditor';

const PanelShapeEditor = (props: any) => {
    return (
        <div className="panel-editor">
            <div className="panel-editor-inner">
                <FillEditor />
                <BorderEditor />
            </div>
        </div>
    );
};

export default PanelShapeEditor;
