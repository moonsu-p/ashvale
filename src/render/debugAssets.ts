/**
 * ?debugAssets=1 이면 플레이스홀더에 PALETTE.rift 외곽선을 그린다 (§11.1, assets.ts 규약).
 * URL 쿼리로 1회 판정하고 세션 동안 고정한다.
 */

let cached: boolean | null = null;

export function isDebugAssets(): boolean {
  if (cached !== null) return cached;
  try {
    cached = new URLSearchParams(window.location.search).get('debugAssets') === '1';
  } catch {
    cached = false;
  }
  return cached;
}
