import React from 'react';

function PanelShapes(props: any) {
    const types = [1,2,3];

    return (
        <div className="panel-shapes">
            { types.map(type => <div className="panel-shapes-type">{ type }</div>) }
        </div>
    );
}

export default PanelShapes;
