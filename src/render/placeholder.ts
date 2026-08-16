/**
 * 플레이스홀더 렌더러.
 *
 * 에셋이 없어도 게임이 돌아야 한다 (CLAUDE.md). 파일이 없으면 여기서 그린
 * 사각형이 대신 들어간다. 빨간 X나 깨진 이미지 아이콘이 아니라, 크기와 이름이
 * 적힌 칸을 그린다 — 배치가 맞는지 눈으로 확인할 수 있어야 하기 때문이다.
 *
 * 색은 팔레트에서만 가져온다.
 */

import { PALETTE, type PaletteKey } from '@/data/palette';
import type { AssetEntry } from '@/data/assets';

export interface PlaceholderSpec {
  width: number;
  height: number;
  label: string;
  color: PaletteKey;
}

/** 매니페스트 항목에서 플레이스홀더 규격을 뽑는다 */
export function specOf(entry: AssetEntry): PlaceholderSpec {
  const width = entry.placeholder.width ?? entry.sheet?.frameWidth ?? 16;
  const height = entry.placeholder.height ?? entry.sheet?.frameHeight ?? 16;
  return { width, height, label: entry.placeholder.label, color: entry.placeholder.color };
}

/**
 * 캔버스에 한 장 그린다. 원본 크기(배율 1)로 그리고, 확대는 부르는 쪽이 한다.
 * 픽셀 아트라서 확대는 반드시 최근접 이웃이어야 한다.
 */
export function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  spec: PlaceholderSpec,
  originX = 0,
  originY = 0,
): void {
  const { width, height } = spec;

  ctx.fillStyle = PALETTE[spec.color];
  ctx.fillRect(originX, originY, width, height);

  // 테두리 — 칸 경계를 눈으로 세려면 있어야 한다
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(originX + 0.5, originY + 0.5, width - 1, height - 1);

  // 대각선 한 줄. 채워진 타일과 빈 타일을 한눈에 가른다
  ctx.beginPath();
  ctx.moveTo(originX + 1, originY + 1);
  ctx.lineTo(originX + width - 1, originY + height - 1);
  ctx.strokeStyle = PALETTE.inkSoft;
  ctx.stroke();
}

/**
 * 확대해서 그리고 이름표를 얹는다. 디버그 화면용.
 * 이름은 확대된 좌표계에 그려야 읽힌다 — 원본 16px 위에 글자를 올리면 뭉갠다.
 */
export function drawPlaceholderCard(
  ctx: CanvasRenderingContext2D,
  spec: PlaceholderSpec,
  scale: number,
): void {
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  ctx.scale(scale, scale);
  drawPlaceholder(ctx, spec);
  ctx.restore();

  const w = spec.width * scale;
  const h = spec.height * scale;

  ctx.fillStyle = PALETTE.ink;
  ctx.globalAlpha = 0.72;
  ctx.fillRect(0, h - 14, w, 14);
  ctx.globalAlpha = 1;

  ctx.fillStyle = PALETTE.paper;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${spec.width}×${spec.height}`, 3, h - 7, w - 6);
}

/**
 * data URL 한 장. Phaser에 텍스처로 먹이거나 <img src>에 바로 꽂을 때 쓴다.
 * 외부 요청이 없다 — 비통신 요구사항(§14)을 깨지 않는다.
 */
export function placeholderDataUrl(spec: PlaceholderSpec, scale = 1): string {
  const canvas = document.createElement('canvas');
  canvas.width = spec.width * scale;
  canvas.height = spec.height * scale;

  const ctx = canvas.getContext('2d');
  if (ctx === null) return '';

  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  drawPlaceholder(ctx, spec);
  return canvas.toDataURL('image/png');
}
