import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// 정적 호스팅(서브경로 가능) + PWA 를 고려해 상대 base 를 쓴다.
// GitHub Pages 의 /repo/ 하위 배포에서도 자산 경로가 깨지지 않는다.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    // 청크 해시로 서비스 워커 런타임 캐시가 자연 갱신된다.
    assetsInlineLimit: 0,
  },
});
