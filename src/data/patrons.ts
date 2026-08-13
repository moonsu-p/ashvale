/**
 * 의뢰인 프리셋 — §7.3. 전원 남성, 이름·외형 고정. 신뢰 0–60, 3단계.
 * 대사는 content/patron-dialogue.ts. 퀘스트는 M7c.
 */

import type { FactionId } from '@/types/game';

export type TrustStage = 'acquaintance' | 'client' | 'oldFriend';

export const TRUST_STAGE_NAME: Record<TrustStage, string> = {
  acquaintance: '안면',
  client: '거래처',
  oldFriend: '오랜 벗',
};

export function trustStage(trust: number): TrustStage {
  if (trust >= 40) return 'oldFriend';
  if (trust >= 20) return 'client';
  return 'acquaintance';
}

export const TRUST_MAX = 60;

export interface PresetPatron {
  id: string;
  name: string;
  faction: FactionId | null;
  appearEra: number;
}

export const PRESET_PATRONS: PresetPatron[] = [
  { id: 'bartek', name: '바르텍', faction: 'guild', appearEra: 0 },
  { id: 'tova', name: '토바', faction: 'guild', appearEra: 1 },
  { id: 'harl', name: '하를', faction: 'oath', appearEra: 1 },
  { id: 'oren', name: '오렌', faction: 'tower', appearEra: 2 },
  { id: 'doran', name: '도란', faction: null, appearEra: 2 },
  { id: 'vell', name: '벨', faction: null, appearEra: 3 },
];
