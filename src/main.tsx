import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';

// point d'entrée racine de l'application react
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
