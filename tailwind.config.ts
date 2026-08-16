import type { Config } from 'tailwindcss';
import { PALETTE, CHAR } from './src/data/palette';
import { BANDS, CONTROLS_HEIGHT_CSS, FRAME_MAX_WIDTH, TILE, TOUCH_MIN } from './src/data/layout';

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
        field: `${BANDS.fieldMinHeight}px`,
        touch: `${TOUCH_MIN}px`,
        tile: `${TILE.render}px`,
        // 노치·펀치홀·제스처 바를 피한다. 지원하지 않는 기기에서는 0 이 된다
        'safe-t': 'env(safe-area-inset-top, 0px)',
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-l': 'env(safe-area-inset-left, 0px)',
        'safe-r': 'env(safe-area-inset-right, 0px)',
      },
      height: {
        // 화면이 길수록 조금 자란다
        controls: CONTROLS_HEIGHT_CSS,
      },
      maxWidth: {
        viewport: `${FRAME_MAX_WIDTH}px`,
      },
    },
  },
  plugins: [],
} satisfies Config;
