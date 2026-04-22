import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('ServiceWorker registration failed: ', error);
    });
  });
} else if ('serviceWorker' in navigator) {
  // In development, unregister any existing service worker to clear cache
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('ServiceWorker unregistered');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ToastProvider>
  </StrictMode>,
);
