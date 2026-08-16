/**
 * 물리 키보드 매핑 (§5) — 방향키 + Space/Enter 를 D패드·A 와 같은 동작에 건다.
 * 데스크톱에서 확인할 때 쓴다. 손맛은 폰에서 봐야 한다.
 */

import { useEffect } from 'react';
import type { Dir } from '@/types/game';
import { pressAction, pressDir, releaseAll, releaseDir } from '@/phaser/inputBus';

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const ACTION_KEYS = new Set([' ', 'Enter']);

export function useKeyboard(): void {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key];
      if (dir !== undefined) {
        e.preventDefault();
        // 키 반복은 새 입력이 아니다. 큐에 같은 방향이 계속 쌓이면 안 된다
        if (!e.repeat) pressDir(dir);
        return;
      }
      if (ACTION_KEYS.has(e.key)) {
        e.preventDefault();
        if (!e.repeat) pressAction();
      }
    };

    const up = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key];
      if (dir !== undefined) releaseDir(dir);
    };

    // 탭을 벗어나면 누른 채로 굳는다
    const blur = () => releaseAll();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
}
