import React  from 'react';
import Panel from './views/Panel';

function App(props: any) {
    return (
        <Panel editor={ props.editor } />
    );
}

export default App;
