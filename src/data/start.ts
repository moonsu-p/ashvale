/**
 * 새 게임 시작 상수 — M0 골격 기본값.
 * 코드에 숫자를 박지 않기 위한 단일 출처다. 밸런스 조정은 이 파일에서 한다.
 *
 * 주의: 시작 민첩 3 은 낮추지 않는다 (§6 — 첫 판정이 실패로 시작하면 안 됨).
 */

import type { ResourceId, StatId, FactionId } from '@/types/game';

export const START_HERO_STATS: Record<StatId, number> = {
  might: 3,
  agility: 3, // §6 고정
  insight: 3,
  will: 3,
};

export const START_HP = 20;

export const START_RESOURCES: Record<ResourceId, number> = {
  wood: 20,
  stone: 10,
  food: 20,
  gold: 10,
};

/** 시작 건물: 회관 1레벨만 존재 */
export const START_BUILDINGS: Record<string, number> = {
  hall: 1,
};

export const START_FACTIONS: Record<FactionId, number> = {
  guild: 0,
  oath: 0,
  grove: 0,
  tower: 0,
};

/** 시작 시 해금된 지역 (속삭이는 숲) */
export const START_REGIONS: string[] = ['whisper'];

export const START_SETTLEMENT_NAME = '아쉬베일';
