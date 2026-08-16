/**
 * 지형 그리기.
 *
 * 외부 타일셋을 쓰지 않기로 했으므로 **여기가 지형 그림의 전부다.**
 * 그래서 손으로 그린 타일셋이 주는 것들을 흉내 낸다:
 *
 *  1. **변화** — 나무·풀·바위가 자리마다 조금씩 다르다. 좌표로 결정하므로
 *     다시 그려도 같은 그림이 나온다. 난수를 쓰면 새로 그릴 때마다 흔들린다
 *  2. **경계** — 흙길과 잔디, 물과 뭍의 사이를 각지게 자르지 않고 섞는다.
 *     칼로 자른 격자가 제일 '만든 티' 나는 부분이다
 *  3. **두께** — 지붕 아래 그늘, 벽의 창, 물가의 물거품
 *
 * 16px 원본 크기로 그린다. 확대는 카메라가 한다.
 */

import { PALETTE } from '@/data/palette';
import { TERRAIN_LOOK } from '@/data/terrain';
import type { Terrain } from '@/types/map';
import { TILE } from '@/data/layout';

const S = TILE.source;

/** 좌표에서 나오는 고정 난수 0..1. 같은 자리는 언제나 같은 값 */
function noise(x: number, y: number, salt = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** 이웃 지형. 경계를 부드럽게 만들 때 쓴다 */
export interface Neighbors {
  n: Terrain | null;
  s: Terrain | null;
  e: Terrain | null;
  w: Terrain | null;
}

const EMPTY: Neighbors = { n: null, s: null, e: null, w: null };

/** 걸어다니는 바닥인가. 경계 처리에서 물·벽과 가른다 */
function isGround(t: Terrain | null): boolean {
  return t === 'grass' || t === 'grassTuft' || t === 'path' || t === 'plot' || t === 'gateway';
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w = 1, h = 1): void {
  ctx.fillRect(x, y, w, h);
}

// ── 지형별 그림 ───────────────────────────────────────────

function drawGrass(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number, tuft: boolean): void {
  ctx.fillStyle = PALETTE.grass;
  px(ctx, ox, oy, S, S);

  // 잔디 결. 자리마다 다른 곳에 몇 점
  ctx.fillStyle = PALETTE.grassDark;
  for (let i = 0; i < 3; i++) {
    const nx = Math.floor(noise(tx, ty, i) * S);
    const ny = Math.floor(noise(ty, tx, i + 9) * S);
    px(ctx, ox + nx, oy + ny);
  }

  if (!tuft) return;

  // 풀포기 — 세 가지 중 하나
  ctx.fillStyle = PALETTE.grassLight;
  const variant = Math.floor(noise(tx, ty, 3) * 3);
  if (variant === 0) {
    px(ctx, ox + 4, oy + 9, 1, 4);
    px(ctx, ox + 6, oy + 7, 1, 5);
    px(ctx, ox + 8, oy + 10, 1, 3);
  } else if (variant === 1) {
    px(ctx, ox + 10, oy + 6, 1, 4);
    px(ctx, ox + 12, oy + 8, 1, 4);
    px(ctx, ox + 3, oy + 11, 1, 3);
  } else {
    // 드물게 꽃 한 송이. 넓은 벌판에서 눈이 쉰다
    px(ctx, ox + 7, oy + 8, 1, 4);
    ctx.fillStyle = noise(tx, ty, 5) > 0.5 ? PALETTE.flameBright : PALETTE.linen;
    px(ctx, ox + 6, oy + 6, 3, 2);
    px(ctx, ox + 7, oy + 5, 1, 1);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number, near: Neighbors): void {
  ctx.fillStyle = PALETTE.dirt;
  px(ctx, ox, oy, S, S);

  // 잔돌
  ctx.fillStyle = PALETTE.dirtLight;
  for (let i = 0; i < 5; i++) {
    px(ctx, ox + Math.floor(noise(tx, ty, i) * S), oy + Math.floor(noise(ty, tx, i + 4) * S));
  }
  ctx.fillStyle = PALETTE.soilDark;
  for (let i = 0; i < 3; i++) {
    px(ctx, ox + Math.floor(noise(tx, ty, i + 20) * S), oy + Math.floor(noise(ty, tx, i + 30) * S));
  }

  // 잔디와 닿는 쪽은 흙이 풀에 먹힌다. 톱니처럼 들쭉날쭉하게
  ctx.fillStyle = PALETTE.grass;
  const bite = (i: number, salt: number) => noise(tx * 3 + i, ty * 3, salt) > 0.55;
  if (near.n === 'grass' || near.n === 'grassTuft')
    for (let i = 0; i < S; i++) if (bite(i, 1)) px(ctx, ox + i, oy, 1, 1);
  if (near.s === 'grass' || near.s === 'grassTuft')
    for (let i = 0; i < S; i++) if (bite(i, 2)) px(ctx, ox + i, oy + S - 1, 1, 1);
  if (near.w === 'grass' || near.w === 'grassTuft')
    for (let i = 0; i < S; i++) if (bite(i, 3)) px(ctx, ox, oy + i, 1, 1);
  if (near.e === 'grass' || near.e === 'grassTuft')
    for (let i = 0; i < S; i++) if (bite(i, 4)) px(ctx, ox + S - 1, oy + i, 1, 1);
}

function drawWater(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number, near: Neighbors): void {
  ctx.fillStyle = PALETTE.waterDeep;
  px(ctx, ox, oy, S, S);

  // 물결
  ctx.fillStyle = PALETTE.water;
  for (let y = 2; y < S; y += 5) {
    const shift = Math.floor(noise(tx, ty + y, 1) * 5);
    px(ctx, ox + 1 + shift, oy + y, 5, 1);
    px(ctx, ox + 9 - shift, oy + y + 2, 4, 1);
  }

  // 물가 — 뭍과 닿는 변에 하얀 거품선
  ctx.fillStyle = PALETTE.frost;
  if (isGround(near.n)) px(ctx, ox, oy, S, 1);
  if (isGround(near.s)) px(ctx, ox, oy + S - 1, S, 1);
  if (isGround(near.w)) px(ctx, ox, oy, 1, S);
  if (isGround(near.e)) px(ctx, ox + S - 1, oy, 1, S);
}

function drawTree(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number): void {
  // 바닥은 풀로 깔고 그 위에 나무를 얹는다. 나무 사이로 땅이 보여야 숲 같다
  ctx.fillStyle = PALETTE.grass;
  px(ctx, ox, oy, S, S);

  const variant = Math.floor(noise(tx, ty, 7) * 3);
  const lift = Math.floor(noise(tx, ty, 8) * 2);

  // 그늘
  ctx.fillStyle = PALETTE.grassDark;
  px(ctx, ox + 3, oy + 12 - lift, 10, 2);

  ctx.fillStyle = PALETTE.wood;
  px(ctx, ox + 7, oy + 10 - lift, 2, 4);

  if (variant === 0) {
    // 둥근 활엽수
    ctx.fillStyle = PALETTE.grassDark;
    px(ctx, ox + 2, oy + 4 - lift, 12, 6);
    px(ctx, ox + 3, oy + 2 - lift, 10, 9);
    ctx.fillStyle = PALETTE.grass;
    px(ctx, ox + 4, oy + 3 - lift, 7, 4);
  } else if (variant === 1) {
    // 뾰족한 침엽수
    ctx.fillStyle = PALETTE.grassDark;
    px(ctx, ox + 7, oy + 1 - lift, 2, 2);
    px(ctx, ox + 5, oy + 3 - lift, 6, 2);
    px(ctx, ox + 4, oy + 5 - lift, 8, 2);
    px(ctx, ox + 3, oy + 7 - lift, 10, 3);
    ctx.fillStyle = PALETTE.grass;
    px(ctx, ox + 6, oy + 4 - lift, 3, 4);
  } else {
    // 넓게 퍼진 것
    ctx.fillStyle = PALETTE.grassDark;
    px(ctx, ox + 1, oy + 5 - lift, 14, 5);
    px(ctx, ox + 3, oy + 3 - lift, 10, 8);
    ctx.fillStyle = PALETTE.grass;
    px(ctx, ox + 9, oy + 4 - lift, 4, 3);
  }
}

function drawRock(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number): void {
  ctx.fillStyle = PALETTE.grass;
  px(ctx, ox, oy, S, S);

  const big = noise(tx, ty, 11) > 0.5;
  ctx.fillStyle = PALETTE.stoneDark;
  px(ctx, ox + 3, oy + 11, big ? 10 : 7, 2);
  ctx.fillStyle = PALETTE.stone;
  if (big) {
    px(ctx, ox + 3, oy + 6, 10, 6);
    px(ctx, ox + 5, oy + 4, 6, 3);
    ctx.fillStyle = PALETTE.stoneLight;
    px(ctx, ox + 5, oy + 5, 4, 2);
  } else {
    px(ctx, ox + 4, oy + 8, 7, 4);
    ctx.fillStyle = PALETTE.stoneLight;
    px(ctx, ox + 5, oy + 9, 3, 1);
  }
}

function drawWall(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number, near: Neighbors): void {
  ctx.fillStyle = PALETTE.stoneLight;
  px(ctx, ox, oy, S, S);

  // 벽돌 줄눈
  ctx.fillStyle = PALETTE.stone;
  for (let y = 0; y < S; y += 5) {
    px(ctx, ox, oy + y, S, 1);
    const off = (y / 5) % 2 === 0 ? 4 : 11;
    px(ctx, ox + off, oy + y, 1, 5);
  }

  // 지붕 바로 아래면 처마 그늘이 진다. 이게 있어야 건물이 납작해 보이지 않는다
  if (near.n === 'roof') {
    ctx.fillStyle = PALETTE.stoneDark;
    px(ctx, ox, oy, S, 2);
  }

  // 창 — 일부 칸에만
  if (noise(tx, ty, 13) > 0.55) {
    ctx.fillStyle = PALETTE.slate;
    px(ctx, ox + 5, oy + 6, 6, 5);
    ctx.fillStyle = PALETTE.flameBright;
    px(ctx, ox + 6, oy + 7, 4, 3);
    ctx.fillStyle = PALETTE.wood;
    px(ctx, ox + 8, oy + 6, 1, 5);
  }
}

function drawRoof(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number, near: Neighbors): void {
  ctx.fillStyle = PALETTE.roofRed;
  px(ctx, ox, oy, S, S);

  // 기와 결
  ctx.fillStyle = PALETTE.roofBlue;
  for (let y = 0; y < S; y += 4) {
    px(ctx, ox, oy + y, S, 1);
    const stagger = (y / 4) % 2 === 0 ? 0 : 4;
    for (let x = stagger; x < S; x += 8) px(ctx, ox + x, oy + y, 1, 4);
  }

  // 용마루 — 지붕의 맨 윗줄만 밝게
  if (near.n !== 'roof') {
    ctx.fillStyle = PALETTE.thatch;
    px(ctx, ox, oy, S, 2);
  }
  // 처마 끝
  if (near.s !== 'roof') {
    ctx.fillStyle = PALETTE.wood;
    px(ctx, ox, oy + S - 1, S, 1);
  }
  void tx;
  void ty;
}

function drawDoor(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = PALETTE.stoneLight;
  px(ctx, ox, oy, S, S);

  // 문틀
  ctx.fillStyle = PALETTE.stoneDark;
  px(ctx, ox + 2, oy + 1, 12, 15);
  ctx.fillStyle = PALETTE.wood;
  px(ctx, ox + 3, oy + 2, 10, 14);
  ctx.fillStyle = PALETTE.woodLight;
  px(ctx, ox + 4, oy + 3, 8, 12);
  ctx.fillStyle = PALETTE.wood;
  px(ctx, ox + 8, oy + 3, 1, 12);
  // 손잡이
  ctx.fillStyle = PALETTE.gold;
  px(ctx, ox + 10, oy + 9, 1, 2);
}

/**
 * 지을 수 있는 빈 터.
 *
 * 줄을 곧게 그으면 나무 데크처럼 보인다. 고른 땅으로 읽히도록
 * 흙바닥에 자갈과 말뚝만 남긴다.
 */
function drawPlot(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number, near: Neighbors): void {
  ctx.fillStyle = PALETTE.dirt;
  px(ctx, ox, oy, S, S);

  // 고르지 않은 흙
  ctx.fillStyle = PALETTE.soilDark;
  for (let i = 0; i < 6; i++) {
    px(ctx, ox + Math.floor(noise(tx, ty, i + 40) * S), oy + Math.floor(noise(ty, tx, i + 50) * S), 2, 1);
  }
  ctx.fillStyle = PALETTE.dirtLight;
  for (let i = 0; i < 4; i++) {
    px(ctx, ox + Math.floor(noise(tx, ty, i + 55) * S), oy + Math.floor(noise(ty, tx, i + 65) * S));
  }

  // 터의 가장자리에 말뚝을 박아 둔다. 여기까지가 이 건물 자리다
  ctx.fillStyle = PALETTE.wood;
  const outside = (t: Terrain | null) => t !== 'plot';
  if (outside(near.n)) px(ctx, ox + 1, oy + 1, 2, 2);
  if (outside(near.s)) px(ctx, ox + S - 3, oy + S - 3, 2, 2);
  if (outside(near.w)) px(ctx, ox + 1, oy + S - 3, 2, 2);
  if (outside(near.e)) px(ctx, ox + S - 3, oy + 1, 2, 2);
}

function drawFence(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = PALETTE.grass;
  px(ctx, ox, oy, S, S);
  ctx.fillStyle = PALETTE.wood;
  px(ctx, ox + 1, oy + 5, S - 2, 2);
  px(ctx, ox + 1, oy + 10, S - 2, 2);
  ctx.fillStyle = PALETTE.woodLight;
  px(ctx, ox + 3, oy + 2, 2, 12);
  px(ctx, ox + 11, oy + 2, 2, 12);
}

function drawRampart(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number): void {
  ctx.fillStyle = PALETTE.stone;
  px(ctx, ox, oy, S, S);
  ctx.fillStyle = PALETTE.stoneDark;
  for (let y = 0; y < S; y += 4) {
    px(ctx, ox, oy + y, S, 1);
    px(ctx, ox + (((y / 4) % 2 === 0 ? 5 : 11)), oy + y, 1, 4);
  }
  // 성가퀴
  ctx.fillStyle = PALETTE.stoneLight;
  px(ctx, ox, oy, S, 2);
  ctx.fillStyle = PALETTE.stoneDark;
  if (noise(tx, ty, 17) > 0.5) px(ctx, ox + 6, oy, 4, 2);
}

function drawTower(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = PALETTE.stoneDark;
  px(ctx, ox, oy, S, S);
  ctx.fillStyle = PALETTE.stone;
  px(ctx, ox + 1, oy + 3, S - 2, S - 3);
  ctx.fillStyle = PALETTE.metal;
  px(ctx, ox, oy, S, 3);
  px(ctx, ox + 2, oy + 6, 3, 4);
  px(ctx, ox + 11, oy + 6, 3, 4);
  ctx.fillStyle = PALETTE.slate;
  px(ctx, ox + 6, oy + 7, 4, 6);
}

/**
 * 아직 열리지 않은 자리.
 *
 * **한눈에 못 지나간다고 읽혀야 한다.** 잔디와 색만 살짝 다르면
 * 왜 안 걸어지는지 알 수가 없다. 그래서 어둡게 깔고 덤불을 빽빽하게 얹는다.
 */
function drawOvergrown(ctx: CanvasRenderingContext2D, ox: number, oy: number, tx: number, ty: number): void {
  ctx.fillStyle = PALETTE.grassDark;
  px(ctx, ox, oy, S, S);

  // 그늘진 바닥이 군데군데 비친다
  ctx.fillStyle = PALETTE.soilDark;
  for (let i = 0; i < 4; i++) {
    const nx = Math.floor(noise(tx, ty, i + 58) * (S - 3));
    const ny = Math.floor(noise(ty, tx, i + 68) * (S - 3));
    px(ctx, ox + nx, oy + ny, 4, 3);
  }

  // 뒤엉킨 덤불 덩어리
  ctx.fillStyle = PALETTE.grass;
  for (let i = 0; i < 7; i++) {
    const nx = Math.floor(noise(tx, ty, i + 60) * (S - 4));
    const ny = Math.floor(noise(ty, tx, i + 70) * (S - 4));
    px(ctx, ox + nx, oy + ny, 4, 3);
  }
  ctx.fillStyle = PALETTE.grassLight;
  for (let i = 0; i < 3; i++) {
    const nx = Math.floor(noise(tx, ty, i + 75) * (S - 2));
    const ny = Math.floor(noise(ty, tx, i + 85) * (S - 2));
    px(ctx, ox + nx, oy + ny, 2, 1);
  }

  // 마른 가지 한 줄. 드물게만 — 자주 넣으면 진흙탕처럼 보인다
  if (noise(tx, ty, 95) > 0.78) {
    ctx.fillStyle = PALETTE.wood;
    const y0 = 3 + Math.floor(noise(tx, ty, 96) * 9);
    px(ctx, ox, oy + y0, S, 1);
  }
}

// ── 진입점 ────────────────────────────────────────────────

export function drawTerrainTile(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  tx: number,
  ty: number,
  near: Neighbors = EMPTY,
): void {
  const ox = tx * S;
  const oy = ty * S;

  switch (terrain) {
    case 'grass':
      return drawGrass(ctx, ox, oy, tx, ty, false);
    case 'grassTuft':
      return drawGrass(ctx, ox, oy, tx, ty, true);
    case 'path':
    case 'gateway':
      return drawPath(ctx, ox, oy, tx, ty, near);
    case 'water':
      return drawWater(ctx, ox, oy, tx, ty, near);
    case 'tree':
      return drawTree(ctx, ox, oy, tx, ty);
    case 'rock':
      return drawRock(ctx, ox, oy, tx, ty);
    case 'wall':
      return drawWall(ctx, ox, oy, tx, ty, near);
    case 'roof':
      return drawRoof(ctx, ox, oy, tx, ty, near);
    case 'door':
      return drawDoor(ctx, ox, oy);
    case 'plot':
      return drawPlot(ctx, ox, oy, tx, ty, near);
    case 'fence':
      return drawFence(ctx, ox, oy);
    case 'rampart':
      return drawRampart(ctx, ox, oy, tx, ty);
    case 'tower':
      return drawTower(ctx, ox, oy);
    case 'overgrown':
      return drawOvergrown(ctx, ox, oy, tx, ty);
    default: {
      // 지역 바닥 — 색만 다른 평평한 땅
      const look = TERRAIN_LOOK[terrain];
      ctx.fillStyle = PALETTE[look.base];
      px(ctx, ox, oy, S, S);
      ctx.fillStyle = PALETTE[look.detail];
      for (let i = 0; i < 4; i++) {
        px(ctx, ox + Math.floor(noise(tx, ty, i + 100) * S), oy + Math.floor(noise(ty, tx, i + 110) * S));
      }
      return;
    }
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
  const at = (x: number, y: number): Terrain | null =>
    x < 0 || y < 0 || x >= width || y >= height ? null : (ground[y * width + x] ?? null);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const g = ground[y * width + x];
      if (g === undefined) continue;
      drawTerrainTile(ctx, g, x, y, {
        n: at(x, y - 1),
        s: at(x, y + 1),
        e: at(x + 1, y),
        w: at(x - 1, y),
      });
    }
  }

  // 장식은 바닥을 다 깔고 나서 얹는다
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = deco[y * width + x];
      if (d === null || d === undefined) continue;
      drawTerrainTile(ctx, d, x, y);
    }
  }
}
