import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerSW } from './pwa/registerSW';
import './index.css';

const host = document.getElementById('root');
if (host === null) throw new Error('#root 를 찾지 못했다.');

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW();
