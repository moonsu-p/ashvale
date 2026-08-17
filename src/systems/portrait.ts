/**
 * 초상 슬롯 폴백 (§8.2) — 순수 함수.
 *
 * 상위 슬롯이 비어 있으면 하위로 내려가고, 슬롯 0 도 없으면 null 을 돌려준다.
 * null 이면 부르는 쪽이 원형 실루엣을 그린다.
 *
 * **조용히 내려간다.** 어디에도 "이미지가 없습니다" 를 남기지 않는다.
 */

import { SLOT_COUNT } from '@/data/images';

/** 슬롯 -> IndexedDB 키. 값이 null 이면 그 슬롯은 비어 있다 */
export type SlotImages = Record<number, string | null> | undefined;

function filled(images: SlotImages, slot: number): boolean {
  if (images === undefined) return false;
  const key = images[slot];
  return key !== null && key !== undefined && key !== '';
}

/**
 * 어느 슬롯을 쓸 것인가.
 *
 * **플레이어가 고른 슬롯이 먼저다.** 상황별로 다른 슬롯을 요청해 봐도
 * (감정 대사는 1번, 고백은 3번) 해금 사다리가 없어 늘 0으로 내려갔다 —
 * 여섯 자리를 채워도 하나만 보였다. 그래서 고른 것을 쓴다.
 *
 * 고른 자리가 비어 있으면 예전대로 요청한 슬롯부터 0까지 내려간다.
 * 아직 고르지 않은 옛 세이브도 그 길로 간다.
 */
export function resolveSlot(
  images: SlotImages,
  wantSlot: number,
  pickedSlot?: number,
): number | null {
  if (images === undefined) return null;

  if (pickedSlot !== undefined && filled(images, pickedSlot)) return pickedSlot;

  for (let slot = wantSlot; slot >= 0; slot--) {
    if (filled(images, slot)) return slot;
  }
  // 요청한 자리 아래가 다 비었어도 위쪽에 채운 게 있으면 그걸 쓴다.
  // 하나라도 넣었는데 실루엣이 나오는 쪽이 더 이상하다
  for (let slot = wantSlot + 1; slot < SLOT_COUNT; slot++) {
    if (filled(images, slot)) return slot;
  }
  return null;
}

/** 실제로 쓸 이미지의 저장 키. 없으면 null */
export function resolveImageKey(
  images: SlotImages,
  wantSlot: number,
  pickedSlot?: number,
): string | null {
  const slot = resolveSlot(images, wantSlot, pickedSlot);
  if (slot === null || images === undefined) return null;
  return images[slot] ?? null;
}
