import React, { useState } from 'react';

function App() {
    const [count, setCount] = useState(5);

    return (
        <div className="App">
            <h1 onMouseDownCapture={ setCount.bind(count, count + 1) }>{ count }</h1>
        </div>
    );
}

export default App;
