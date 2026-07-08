import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import './index.css';

// Initialize Dark Mode setting on first load
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
  document.documentElement.classList.add('dark');
} else if (savedDarkMode === 'false') {
  document.documentElement.classList.add('light');
} else {
  // If not explicitly set, default to light theme
  document.documentElement.classList.add('light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
