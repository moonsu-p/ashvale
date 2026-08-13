import type { Config } from 'tailwindcss';
import { PALETTE, UI } from './src/data/palette';

// 색은 팔레트에서만 온다 (§10.2). Tailwind 기본 팔레트를 완전히 대체한다.
// 여기에 hex 를 다시 적지 않는다 — palette.ts 가 유일한 출처다.
const colors: Record<string, string> = {
  transparent: 'transparent',
  current: 'currentColor',
};
for (const [k, v] of Object.entries(PALETTE)) colors[k] = v;

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // colors 를 확장이 아니라 교체한다 → 기본 팔레트 접근 불가
    colors,
    extend: {
      colors: {
        // 역할별 시맨틱 별칭 (palette 값 재사용)
        'ui-bg': UI.bg,
        'ui-sunken': UI.bgSunken,
        'ui-text': UI.text,
        'ui-muted': UI.textMuted,
        'ui-border': UI.border,
        'ui-accent': UI.accent,
        'ui-danger': UI.danger,
        'ui-success': UI.success,
        'ui-warning': UI.warning,
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', "'Apple SD Gothic Neo'", 'sans-serif'],
        serif: ["'Noto Serif KR'", 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
