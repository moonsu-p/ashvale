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
import { buildScript } from '@/systems/dialogue';
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
      onAction: (object) => {
        if (object === null) return;
        const store = useGameStore.getState();

        // 건물 부지 — 건설·증축 패널 (§10)
        if (object.building !== undefined) {
          store.openBuildPanel(object.building);
          return;
        }

        /**
         * 길목 — 여기서 지역으로 나가고 그때 1주가 소모된다 (§6).
         * 지역 맵과 선택 화면은 아직 없다. 지금은 주만 넘긴다.
         * **임시 연결이다.** 탐사가 붙으면 지역 선택으로 바뀐다.
         */
        if (object.type === 'gateway') {
          store.endWeek();
          return;
        }

        if (object.voice === undefined) return;
        const townName = store.state?.town.name ?? '';
        const script = buildScript(object.voice, { townName });
        if (script !== null) store.openDialogue(script);
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
    let wasTalking = false;
    const unsubscribe = useGameStore.subscribe((s) => {
      if (s.state !== null) scene.syncFromState(s.state);
      // 대화나 패널이 열려 있는 동안 필드는 입력을 받지 않는다
      const busy = s.dialogue !== null || s.buildPanel !== null;
      if (busy !== wasTalking) {
        wasTalking = busy;
        scene.setPaused(busy);
      }
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
