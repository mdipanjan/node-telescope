import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initConfig } from './services/apiConfigService';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const renderRoot = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};
initConfig()
  .then(() => {
    renderRoot();
  })
  .catch(error => {
    console.error('Failed to initialize app:', error);
    // Render an error state or fallback UI
  });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
