import type { Config } from 'tailwindcss';
import { PALETTE, CHAR } from './src/data/palette';
import { VIEWPORT, BANDS, TILE, TOUCH_MIN } from './src/data/layout';

/**
 * Tailwind 기본 팔레트를 쓰지 않는다 (CLAUDE.md).
 * theme.colors 를 extend 가 아니라 **통째로 교체**해서, 팔레트 밖의 색 이름은
 * 클래스로 아예 존재하지 않게 만든다. bg-blue-500 같은 걸 쓰면 빌드에서 사라진다.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      ...PALETTE,
      char: CHAR,
    },
    fontFamily: {
      // 본문·UI. 폰트 파일은 public/fonts/ 에 들어온다
      sans: ['Pretendard', 'system-ui', 'sans-serif'],
      // 연대기·시대 전환 (§15 문어체 구간)
      serif: ['"Noto Serif KR"', 'serif'],
    },
    extend: {
      spacing: {
        hud: `${BANDS.hudHeight}px`,
        controls: `${BANDS.controlsHeight}px`,
        field: `${BANDS.fieldMinHeight}px`,
        touch: `${TOUCH_MIN}px`,
        tile: `${TILE.render}px`,
      },
      maxWidth: {
        viewport: `${VIEWPORT.width}px`,
      },
    },
  },
  plugins: [],
} satisfies Config;
