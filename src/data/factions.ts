/**
 * 세력 평판 — §7 세력 4개. 범위 −100~+100, 4단계, 상충 규칙 확정.
 */

import type { FactionId } from '@/types/game';

export const FACTION_NAME: Record<FactionId, string> = {
  guild: '상인 길드',
  oath: '은빛 서약',
  grove: '숲의 부족',
  tower: '마탑',
};

export type FactionStage = 'hostile' | 'cold' | 'friendly' | 'allied';

export const FACTION_STAGE_NAME: Record<FactionStage, string> = {
  hostile: '적대',
  cold: '냉담',
  friendly: '우호',
  allied: '동맹',
};

export function factionStage(value: number): FactionStage {
  if (value <= -40) return 'hostile';
  if (value < 20) return 'cold';
  if (value < 60) return 'friendly';
  return 'allied';
}

/**
 * 상충 규칙(확정): 마탑 +5 오를 때 숲의 부족 −2 (반대도 같다). 길드-서약 상충 없음.
 * 비율로 표현: 한 세력이 +v 오르면 상충 상대가 −v×ratio.
 */
export const FACTION_CONFLICT: Array<{ a: FactionId; b: FactionId; ratio: number }> = [
  { a: 'tower', b: 'grove', ratio: 0.4 }, // 마탑 +5 → 숲 −2
];

export const FACTION_MIN = -100;
export const FACTION_MAX = 100;
