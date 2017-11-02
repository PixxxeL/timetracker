import React from 'react';
import ReactDOM from 'react-dom';
import Application from './components/Application.jsx';


const container = document.getElementById('app-container');

ReactDOM.render(
    <Application {...(container.dataset)} />,
    container
);
