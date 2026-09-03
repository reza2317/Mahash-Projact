import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPersianDigitsAutoConvert } from './utils/persianDigitsHandler';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize global auto-conversion of Latin digits to Persian digits on all inputs
initPersianDigitsAutoConvert();

// Register Service Worker for offline asset caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('ServiceWorker registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
