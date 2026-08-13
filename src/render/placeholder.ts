/**
 * 플레이스홀더 렌더러 — 에셋 path 가 null 이면 색 사각형 + 라벨을 그린다 (§11.1).
 * 에셋이 하나도 없어도 게임은 정상 작동해야 한다. 이 모듈이 그 보장을 담당한다.
 *
 * 프레임워크 중립. 지금은 React(UI)에서, M1부터 Phaser 텍스처 생성에서 함께 쓴다.
 * 색은 assets.ts 의 placeholder.color(= palette 값)와 debug 외곽선 PALETTE.rift 만 쓴다.
 */

import { PALETTE } from '@/data/palette';
import { resolveAsset, type AssetEntry } from '@/data/assets';
import { isDebugAssets } from './debugAssets';

export interface PlaceholderVisual {
  /** 채움 색 (팔레트 값) */
  color: string;
  /** 라벨 텍스트 */
  label: string;
  /** debug 외곽선을 그릴지 (placeholder 상태 + ?debugAssets=1) */
  outline: boolean;
  /** 외곽선 색 */
  outlineColor: string;
}

/** 알 수 없는 id 도 앱을 멈추지 않는다 — rift 색 물음표 박스로 대체한다. */
const UNKNOWN: Omit<PlaceholderVisual, 'outline'> = {
  color: PALETTE.rift,
  label: '?',
  outlineColor: PALETTE.rift,
};

export function placeholderFor(id: string): PlaceholderVisual {
  const entry: AssetEntry | null = resolveAsset(id);
  const debug = isDebugAssets();
  if (!entry) {
    return { ...UNKNOWN, outline: debug };
  }
  return {
    color: entry.placeholder.color,
    label: entry.placeholder.label,
    outline: debug && entry.status === 'placeholder',
    outlineColor: PALETTE.rift,
  };
}

/**
 * 2D 캔버스에 플레이스홀더를 그린다. Phaser 텍스처 생성(M1)과 UI 데모가 공유한다.
 * 실제 스프라이트(path != null)가 생기면 호출부는 그 이미지를 대신 그린다.
 */
export function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const v = placeholderFor(id);
  ctx.fillStyle = v.color;
  ctx.fillRect(x, y, w, h);

  if (v.outline) {
    ctx.strokeStyle = v.outlineColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  // 라벨: 축소돼도 읽히도록 상자 높이에 맞춰 크기 조절
  const fontPx = Math.max(8, Math.min(14, Math.floor(h / 3)));
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `${fontPx}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(v.label, x + w / 2, y + h / 2, w - 4);
}
