import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatPage } from './components/ChatPage';

console.log('Starting React app...');

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your HTML.');
}

console.log('Root element found, rendering...');

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ChatPage />
        </React.StrictMode>,
    );
    console.log('React app rendered successfully');
} catch (error) {
    console.error('Failed to render React app:', error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h1>Error</h1><p>${error}</p></div>`;
}
