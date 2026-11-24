import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { WalletProvider } from './hooks/useWallet';
import './index.css';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

// Restore the path saved by public/404.html (GitHub Pages SPA fallback)
const saved = new URLSearchParams(window.location.search).get('p');
if (saved) {
  window.history.replaceState(null, '', basename + saved);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <WalletProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: '#FFFFFF', color: '#1E293B', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px -8px rgba(15,23,42,.18)' } }}
        />
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
