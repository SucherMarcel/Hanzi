import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { AppProvider } from './state';
import './styles.css';

// Offline support: caches the app; new versions install themselves in the background.
registerSW({ immediate: true });

render(
  <AppProvider>
    <App />
  </AppProvider>,
  document.getElementById('app')!,
);
