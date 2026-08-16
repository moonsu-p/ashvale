/**
 * 새 게임 시작값.
 *
 * 밸런스 수치는 전부 여기 모아 둔다. 시스템 코드에 숫자를 박지 않는다.
 * 여기 값은 아직 조정 전이다 — 주 엔진과 탐사 판정이 붙은 뒤 맞춘다.
 */

import type { ResourceId, StatId, FactionId } from '@/types/game';

/** 거점 이름 기본값. 이름 짓기 화면이 생기면 거기서 덮어쓴다 */
export const DEFAULT_TOWN_NAME = '아쉬베일';

/**
 * 주인공 이름 기본값은 빈 문자열이다.
 * 이름은 플레이어가 붙인다. 대신 지어 넣지 않는다.
 */
export const DEFAULT_HERO_NAME = '';

export const START_HERO = {
  level: 1,
  xp: 0,
  hp: 20,
  maxHp: 20,
  statPoints: 0,
  skillPoints: 0,
} as const;

export const START_STATS: Record<StatId, number> = {
  might: 1,
  agility: 1,
  insight: 1,
  will: 1,
};

export const START_RESOURCES: Record<ResourceId, number> = {
  wood: 0,
  stone: 0,
  food: 0,
  gold: 0,
};

/** 세력 평판은 전부 중립에서 시작한다 (-100..100) */
export const START_FACTIONS: Record<FactionId, number> = {
  guild: 0,
  oath: 0,
  grove: 0,
  tower: 0,
};

export const START_WORLD = {
  year: 1,
  week: 1,
  turn: 0,
  eraIndex: 0,
  eraTier: 0,
  currentMap: 'town',
} as const;

/**
 * 시작 시 열려 있는 지역. 속삭이는 숲 하나로 연다.
 * 해금 규칙 자체는 지역 시스템에서 다룬다.
 */
export const START_UNLOCKED_REGIONS: string[] = ['whisper'];

/**
 * 마을에서 처음 서 있는 칸. 실제 맵이 붙으면 맵의 입구 좌표로 옮긴다.
 * 어디에 서 있는지는 게임 상태다 (§4).
 */
export const START_HERO_TILE = { x: 10, y: 9, dir: 'down' } as const;
