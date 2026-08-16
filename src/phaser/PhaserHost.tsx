/**
 * Phaser 캔버스를 필드 자리에 붙인다.
 *
 * 캔버스가 배경이고 React UI 가 그 위에 겹친다 (HUD·조작부·프롬프트).
 * 상태는 여기서 한 방향으로만 흐른다:
 *   스토어 -> scene.syncFromState  /  씬 콜백 -> 스토어 액션
 */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PALETTE } from '@/data/palette';
import { useGameStore } from '@/store/useGameStore';
import { FieldScene } from './FieldScene';

export function PhaserHost() {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = holder.current;
    if (parent === null) return;

    const store = useGameStore.getState();

    const scene = new FieldScene({
      onStep: (to, dir) => useGameStore.getState().stepHero(to, dir),
      onFace: (dir) => useGameStore.getState().faceHero(dir),
      onPrompt: (label) => useGameStore.getState().setPrompt(label),
      onAction: () => {
        // 대화는 아직 없다. 말을 거는 일은 대화 시스템이 붙을 때 이어진다
      },
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: parent.clientWidth,
      height: parent.clientHeight,
      pixelArt: true,
      backgroundColor: PALETTE.ink,
      scene,
      scale: { mode: Phaser.Scale.NONE },
      // 물리 엔진을 쓰지 않는다. 격자 이동이라 필요 없다
    });

    // 첫 상태를 밀어 넣고, 이후 변화도 이 통로로만 보낸다
    if (store.state !== null) scene.syncFromState(store.state);
    const unsubscribe = useGameStore.subscribe((s) => {
      if (s.state !== null) scene.syncFromState(s.state);
    });

    const resize = () => {
      if (holder.current === null) return;
      game.scale.resize(holder.current.clientWidth, holder.current.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    return () => {
      observer.disconnect();
      unsubscribe();
      game.destroy(true);
    };
  }, []);

  return <div ref={holder} className="h-full w-full" />;
}
