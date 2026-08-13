/**
 * PhaserHost — Phaser 캔버스를 배경에 두고 React UI 를 위에 얹는 브리지 (§10.3 규칙 4).
 * 캔버스 크기는 ResizeObserver 로 컨테이너에 맞춘다. 상태에서 파생된 배치가 props 로 내려와 씬에 반영된다(단방향).
 */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SettlementScene } from './SettlementScene';
import { PALETTE } from '@/data/palette';
import type { Season } from '@/types/game';
import type { DerivedLayout } from '@/systems/layout';

interface Props {
  seed: number;
  season: Season;
  layout: DerivedLayout;
  onBuildingTap?: (id: string) => void;
}

export function PhaserHost({ seed, season, layout, onBuildingTap }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const initial = useRef({ seed, season, layout });
  initial.current = { seed, season, layout };
  const tapRef = useRef(onBuildingTap);
  tapRef.current = onBuildingTap;

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
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
      input: { activePointers: 3 },
      banner: false,
      callbacks: {
        postBoot: (g) => {
          g.scene.add(SettlementScene.KEY, SettlementScene, true, {
            seed: initial.current.seed,
            season: initial.current.season,
            layout: initial.current.layout,
          });
          const scene = g.scene.getScene(SettlementScene.KEY) as SettlementScene | null;
          if (scene) scene.onBuildingTap = (id) => tapRef.current?.(id);
        },
      },
    });
    gameRef.current = game;

    if (import.meta.env.DEV) {
      (window as unknown as { __ashvaleGame?: Phaser.Game }).__ashvaleGame = game;
    }

    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      game.scale.resize(Math.max(1, Math.floor(box.width)), Math.max(1, Math.floor(box.height)));
    });
    ro.observe(parent);

    return () => {
      ro.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // 배치·계절 변화 → 씬 동기화 (단방향)
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene(SettlementScene.KEY) as SettlementScene | null;
    if (scene && scene.scene.isActive()) {
      scene.syncLayout(layout);
      scene.syncSeason(season);
    }
  }, [layout, season]);

  return <div ref={parentRef} className="h-full w-full touch-none" style={{ overflow: 'hidden' }} />;
}
