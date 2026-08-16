/**
 * 지형 타일 그리기 — 타일셋 원본이 없는 동안 쓰는 그림.
 *
 * 16×16 원본 크기로 그린다. 확대는 카메라가 한다.
 * 무늬는 좌표에서 결정한다. 난수를 쓰면 새로 그릴 때마다 흔들린다.
 */

import { PALETTE } from '@/data/palette';
import { TERRAIN_LOOK } from '@/data/terrain';
import type { Terrain } from '@/types/map';
import { TILE } from '@/data/layout';

const S = TILE.source;

/** 좌표에서 나오는 고정 무늬값 0..1 */
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export function drawTerrainTile(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  tx: number,
  ty: number,
): void {
  const look = TERRAIN_LOOK[terrain];
  const ox = tx * S;
  const oy = ty * S;

  ctx.fillStyle = PALETTE[look.base];
  ctx.fillRect(ox, oy, S, S);

  if (look.detail === look.base) return;
  ctx.fillStyle = PALETTE[look.detail];

  switch (terrain) {
    case 'grassTuft': {
      // 풀 몇 포기
      const n = noise(tx, ty);
      ctx.fillRect(ox + 3 + Math.floor(n * 3), oy + 9, 1, 3);
      ctx.fillRect(ox + 9 + Math.floor(n * 4), oy + 6, 1, 3);
      ctx.fillRect(ox + 6, oy + 12, 1, 2);
      break;
    }

    case 'path':
    case 'gateway': {
      // 잔돌
      for (let i = 0; i < 5; i++) {
        const n = noise(tx * 7 + i, ty * 3 + i);
        ctx.fillRect(ox + Math.floor(n * S), oy + Math.floor(noise(i, n) * S), 1, 1);
      }
      break;
    }

    case 'plot': {
      // 갈아 둔 고랑
      for (let y = 2; y < S; y += 4) ctx.fillRect(ox + 1, oy + y, S - 2, 1);
      break;
    }

    case 'water': {
      // 물결
      for (let y = 3; y < S; y += 5) {
        const shift = Math.floor(noise(tx, ty + y) * 4);
        ctx.fillRect(ox + 2 + shift, oy + y, 5, 1);
        ctx.fillRect(ox + 9 - shift, oy + y + 2, 4, 1);
      }
      break;
    }

    case 'tree': {
      // 잎 덩어리 하나
      ctx.fillRect(ox + 3, oy + 2, 10, 9);
      ctx.fillRect(ox + 2, oy + 4, 12, 5);
      ctx.fillStyle = PALETTE.wood;
      ctx.fillRect(ox + 7, oy + 11, 2, 4);
      break;
    }

    case 'rock': {
      ctx.fillRect(ox + 4, oy + 5, 8, 6);
      ctx.fillRect(ox + 6, oy + 3, 4, 3);
      break;
    }

    case 'wall': {
      // 벽돌 줄눈
      ctx.fillRect(ox, oy, S, 1);
      for (let y = 0; y < S; y += 5) {
        ctx.fillRect(ox, oy + y, S, 1);
        const off = (y / 5) % 2 === 0 ? 4 : 11;
        ctx.fillRect(ox + off, oy + y, 1, 5);
      }
      break;
    }

    case 'roof': {
      // 기와 줄
      for (let y = 0; y < S; y += 4) ctx.fillRect(ox, oy + y, S, 1);
      break;
    }

    case 'door': {
      ctx.fillRect(ox + 3, oy + 2, 10, 14);
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(ox + 10, oy + 9, 1, 2);
      break;
    }

    default:
      break;
  }
}

/** 맵 한 장을 통째로 그린 캔버스. 타일마다 객체를 만들지 않으려고 한 장으로 굽는다 */
export function paintMapCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ground: Terrain[],
  deco: (Terrain | null)[],
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const g = ground[i];
      if (g !== undefined) drawTerrainTile(ctx, g, x, y);
      const d = deco[i];
      if (d !== null && d !== undefined) drawTerrainTile(ctx, d, x, y);
    }
  }
}
