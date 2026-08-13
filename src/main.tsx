import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './pwa/registerSW';
import { useGameStore } from './store/useGameStore';
import './index.css';

// 개발 전용 디버그 훅 (프로덕션 번들 제외)
if (import.meta.env.DEV) {
  (window as unknown as { __ashvaleStore?: typeof useGameStore }).__ashvaleStore = useGameStore;
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root 를 찾을 수 없습니다.');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerServiceWorker();
