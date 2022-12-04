import React  from 'react';
import Panel from './views/Panel';

import { Provider } from "mobx-react";

function App(props: { editor: any }) {
    return (
        <Provider editor={ props.editor }>
            <Panel />
        </Provider>
    );
}

export default App;
