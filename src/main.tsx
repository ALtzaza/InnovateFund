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
          toastOptions={{ style: { background: '#0f1830', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' } }}
        />
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
