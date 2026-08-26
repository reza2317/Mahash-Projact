import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPersianDigitsAutoConvert } from './utils/persianDigitsHandler';

// Initialize global auto-conversion of Latin digits to Persian digits on all inputs
initPersianDigitsAutoConvert();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
