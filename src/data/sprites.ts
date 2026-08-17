/**
 * 원형·의뢰인 -> 스프라이트 id.
 *
 * `characters.ts` 는 수정 금지 파일이라 조회 함수를 거기 넣을 수 없다.
 * 그래서 여기에 모은다 — 같은 `CHAR_ROSTER.find(...)` 가 실내 맵·마을 맵·
 * Phaser 호스트 세 군데에 따로 적혀 있었다.
 */

import { CHAR_ROSTER } from '@/data/characters';

const FALLBACK_COMPANION = 'char.comp.1';
const FALLBACK_PATRON = 'char.patron.bartek';

export function companionSprite(archetypeId: string): string {
  return (
    CHAR_ROSTER.find((slot) => slot.role === 'companion' && slot.bind === archetypeId)?.spriteId ??
    FALLBACK_COMPANION
  );
}

export function patronSprite(patronId: string): string {
  return (
    CHAR_ROSTER.find((slot) => slot.role === 'patron' && slot.bind === patronId)?.spriteId ??
    FALLBACK_PATRON
  );
}
