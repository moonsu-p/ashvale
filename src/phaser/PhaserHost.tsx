/**
 * PhaserHost — Phaser 캔버스를 배경에 두고 React UI 를 위에 얹는 브리지 (§10.3 규칙 4).
 * 캔버스 크기는 ResizeObserver 로 컨테이너에 맞춘다. 상태는 props 로 내려와 씬에 반영된다(단방향).
 */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SettlementScene } from './SettlementScene';
import { PALETTE } from '@/data/palette';

import type { Season } from '@/types/game';

interface Props {
  gridSize: number;
  seed: number;
  season: Season;
}

export function PhaserHost({ gridSize, seed, season }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const initial = useRef({ gridSize, seed, season });
  initial.current = { gridSize, seed, season };

  // 게임 생성/파괴 (마운트 1회)
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const w = parent.clientWidth || 300;
    const h = parent.clientHeight || 300;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: w,
      height: h,
      backgroundColor: PALETTE.slate,
      pixelArt: true, // NEAREST 필터 + 픽셀 정렬 → 확대해도 흐려지지 않음 (§10.1)
      roundPixels: true,
      scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
      input: { activePointers: 3 }, // 핀치(2점) + 여유
      banner: false,
      callbacks: {
        postBoot: (g) => {
          g.scene.add(SettlementScene.KEY, SettlementScene, true, {
            gridSize: initial.current.gridSize,
            seed: initial.current.seed,
            season: initial.current.season,
          });
        },
      },
    });
    gameRef.current = game;

    // 개발 전용 디버그 훅 (프로덕션 번들에는 포함되지 않는다)
    if (import.meta.env.DEV) {
      (window as unknown as { __ashvaleGame?: Phaser.Game }).__ashvaleGame = game;
    }

    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      const cw = Math.max(1, Math.floor(box.width));
      const ch = Math.max(1, Math.floor(box.height));
      game.scale.resize(cw, ch);
    });
    ro.observe(parent);

    return () => {
      ro.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // 격자 크기·시드 변화 → 씬 재구성 (단방향 동기화)
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene(SettlementScene.KEY) as SettlementScene | null;
    if (scene && scene.scene.isActive()) {
      scene.syncGrid(gridSize, seed);
      scene.syncSeason(season);
    }
  }, [gridSize, seed, season]);

  return <div ref={parentRef} className="h-full w-full touch-none" style={{ overflow: 'hidden' }} />;
}
