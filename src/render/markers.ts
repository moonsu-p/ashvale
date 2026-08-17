/**
 * 사건 노드 표식 (§11).
 *
 * 노드가 눈에 안 보이면 아무 데나 걷다가 갑자기 판정이 뜬다.
 * **어디로 가야 하는지 보여야** 지역을 걸어다니는 뜻이 생긴다.
 *
 * 지형과 마찬가지로 파일 없이 팔레트 색으로 그린다.
 */

import { PALETTE } from '@/data/palette';
import { TILE } from '@/data/layout';

const S = TILE.source;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w = 1, h = 1): void {
  ctx.fillRect(x, y, w, h);
}

/**
 * 바닥 고리.
 *
 * 지역은 덤불과 바위로 빽빽하다. 표식의 생김새만으로는 자연물에 묻힌다.
 * **밝은 고리를 먼저 깔아** '여기 뭔가 있다'가 형태보다 먼저 읽히게 한다.
 */
function drawRing(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  // 위아래
  px(ctx, 5, 11, 6, 1);
  px(ctx, 5, 15, 6, 1);
  // 좌우
  px(ctx, 3, 12, 1, 3);
  px(ctx, 12, 12, 1, 3);
  // 모서리
  px(ctx, 4, 11, 1, 1);
  px(ctx, 11, 11, 1, 1);
  px(ctx, 4, 15, 1, 1);
  px(ctx, 11, 15, 1, 1);
}

/**
 * 전리품 표식 — 돌무지.
 * 누가 쌓아 둔 것처럼 보여야 한다. 자연물과 헷갈리면 안 된다.
 */
export function drawLootMarker(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, S, S);
  drawRing(ctx, PALETTE.flameBright);

  // 그림자
  ctx.fillStyle = PALETTE.soilDark;
  px(ctx, 4, 13, 8, 2);

  // 쌓아 올린 돌 셋
  ctx.fillStyle = PALETTE.stoneDark;
  px(ctx, 3, 10, 10, 4);
  px(ctx, 5, 7, 6, 4);
  px(ctx, 6, 5, 4, 3);
  ctx.fillStyle = PALETTE.stone;
  px(ctx, 4, 10, 7, 2);
  px(ctx, 6, 7, 4, 2);
  ctx.fillStyle = PALETTE.stoneLight;
  px(ctx, 6, 5, 3, 1);

  // 꼭대기에 금빛. 멀리서도 눈에 걸린다
  ctx.fillStyle = PALETTE.gold;
  px(ctx, 6, 2, 4, 3);
  ctx.fillStyle = PALETTE.flameBright;
  px(ctx, 7, 1, 2, 2);
  px(ctx, 6, 3, 1, 1);
  px(ctx, 9, 3, 1, 1);
}

/**
 * 사건 표식 — 천을 맨 말뚝.
 * 전리품과 한눈에 갈려야 한다.
 */
export function drawEventMarker(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, S, S);
  drawRing(ctx, PALETTE.frost);

  ctx.fillStyle = PALETTE.soilDark;
  px(ctx, 5, 13, 6, 2);

  // 말뚝
  ctx.fillStyle = PALETTE.wood;
  px(ctx, 7, 4, 2, 10);
  ctx.fillStyle = PALETTE.woodLight;
  px(ctx, 7, 4, 1, 10);

  // 묶어 둔 천
  ctx.fillStyle = PALETTE.clothWarm;
  px(ctx, 9, 4, 5, 4);
  px(ctx, 9, 8, 3, 1);
  ctx.fillStyle = PALETTE.flame;
  px(ctx, 9, 4, 5, 1);
}

/** 밟고 지나간 표식. 남겨 두어 어디를 봤는지 알게 한다 */
export function drawSpentMarker(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = PALETTE.soilDark;
  px(ctx, 5, 12, 6, 2);
  ctx.fillStyle = PALETTE.stoneDark;
  px(ctx, 5, 10, 6, 2);
  px(ctx, 7, 8, 2, 2);
}
