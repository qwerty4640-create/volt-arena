import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  // In development, unregister any existing service worker to clear cache
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('ServiceWorker unregistered');
    }
  });
}

// Register service worker with auto-update
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log('SW Registered');
      r && setInterval(() => {
        console.log('Checking for update...');
        r.update();
      }, 30 * 60 * 1000); // Check every 30 mins
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
