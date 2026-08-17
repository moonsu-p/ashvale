/**
 * 새 게임 시작값.
 *
 * 밸런스 수치는 전부 여기 모아 둔다. 시스템 코드에 숫자를 박지 않는다.
 * 여기 값은 아직 조정 전이다 — 주 엔진과 탐사 판정이 붙은 뒤 맞춘다.
 */

import type { ResourceId, StatId, FactionId } from '@/types/game';

/** 거점 이름 기본값. 이름 짓기 화면이 생기면 거기서 덮어쓴다 */
export const DEFAULT_TOWN_NAME = '아쉬베일';

/** 주인공 이름 */
export const DEFAULT_HERO_NAME = '문수';

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

/**
 * 개척지가 들고 온 첫 짐.
 *
 * 주 종료로만 자원이 들어오는데 주는 지역 탐사로만 넘어간다 (§3). 빈손으로 시작하면
 * 첫 건물을 세울 방법이 없다. 탐사 판정이 붙으면 다시 맞춘다.
 */
export const START_RESOURCES: Record<ResourceId, number> = {
  wood: 40,
  stone: 20,
  food: 30,
  gold: 10,
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
 * 마을에서 처음 서 있는 칸 — 회관 앞 흙길 위.
 * 맵은 36×30 한 벌이고 개척기에는 남서쪽 20×18 만 열려 있다 (§6).
 * 어디에 서 있는지는 게임 상태다 (§4).
 */
export const START_HERO_TILE = { x: 10, y: 21, dir: 'up' } as const;

/**
 * 회관은 처음부터 서 있다 (§10 — 해금 0, Lv1).
 * 이게 있어야 마을 지수가 1 이 되고 시대 계산이 돈다.
 */
export const START_BUILDINGS: Record<string, number> = { hall: 1 };

/**
 * 처음부터 마을에 있는 관계 대상 (§4 origin: 'preset').
 *
 * **이름은 비워 둔다.** 이름은 플레이어가 붙인다 (§7.1). 대신 지어 넣지 않는다 —
 * 이름이 없는 동안에는 원형 이름표로 보인다.
 * 인물이 새로 들어오는 흐름(의뢰인 소개·떠돌이)은 관계 시스템의 몫이다.
 */
export const START_COMPANIONS: { id: string; archetypeId: string }[] = [
  { id: 'c1', archetypeId: 'knight' },
  { id: 'c2', archetypeId: 'hunter' },
];

