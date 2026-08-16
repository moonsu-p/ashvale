import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * base: './'
 *   GitHub Pages 하위 경로(/ashvale/)에 올려도, 루트에 올려도 그대로 돈다.
 *   기획서 §14 — 배포 주소가 바뀌면 세이브가 따라오지 않으니 주소를 자주 바꾸지 않는다.
 *   그래도 빌드 산출물이 경로에 묶이지 않게 상대 경로로 둔다.
 *
 * 런타임 네트워크 호출 0 (§14 비통신) — 외부 도메인을 참조하는 플러그인을 넣지 않는다.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // tsconfig.json 의 paths 와 같은 값을 유지한다. 한쪽만 고치면 빌드에서 깨진다
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    // src/index.css 의 '../fonts/' 가 이 깊이를 전제한다. 바꾸면 거기도 고칠 것
    assetsDir: 'assets',
    assetsInlineLimit: 0, // 에셋을 data URI로 인라인하지 않는다. 매니페스트 경로가 실제 파일이어야 한다
  },
});
