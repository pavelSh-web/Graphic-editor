import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FigureEditor from './editor/FigureEditor';
import $ from 'jquery';

// @ts-ignore
window.$ = $;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// root.render(
//     <App />
// );

const editor = new FigureEditor();
