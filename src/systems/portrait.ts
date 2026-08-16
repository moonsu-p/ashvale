/**
 * 초상 슬롯 폴백 (§8.2) — 순수 함수.
 *
 * 상위 슬롯이 비어 있으면 하위로 내려가고, 슬롯 0 도 없으면 null 을 돌려준다.
 * null 이면 부르는 쪽이 원형 실루엣을 그린다.
 *
 * **조용히 내려간다.** 어디에도 "이미지가 없습니다" 를 남기지 않는다.
 */

/** 슬롯 -> IndexedDB 키. 값이 null 이면 그 슬롯은 비어 있다 */
export type SlotImages = Record<number, string | null> | undefined;

/**
 * 쓰고 싶은 슬롯부터 0 까지 훑어 첫 번째로 채워진 슬롯을 돌려준다.
 * 하나도 없으면 null.
 */
export function resolveSlot(images: SlotImages, wantSlot: number): number | null {
  if (images === undefined) return null;
  for (let slot = wantSlot; slot >= 0; slot--) {
    const key = images[slot];
    if (key !== null && key !== undefined && key !== '') return slot;
  }
  return null;
}

/** 실제로 쓸 이미지의 저장 키. 없으면 null */
export function resolveImageKey(images: SlotImages, wantSlot: number): string | null {
  const slot = resolveSlot(images, wantSlot);
  if (slot === null || images === undefined) return null;
  return images[slot] ?? null;
}
