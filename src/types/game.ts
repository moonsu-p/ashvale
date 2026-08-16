/**
 * 게임 상태 모델 — 기획서 §4 그대로.
 *
 * 여기 있는 모양을 임의로 늘리지 않는다. 필드를 추가해야 할 이유가 생기면
 * 기획서를 먼저 고친다.
 *
 * 시각 상태는 저장하지 않는다 (§4 구현 지침). 맵 렌더 상태·NPC 스프라이트 위치는
 * 전부 이 상태에서 파생한다. 예외는 `world.heroTile` 하나 —
 * 어디에 서 있는지는 세이브의 일부다.
 */

export type ResourceId = 'wood' | 'stone' | 'food' | 'gold';
export type StatId = 'might' | 'agility' | 'insight' | 'will';
export type FactionId = 'guild' | 'oath' | 'grove' | 'tower';
export type Dir = 'up' | 'down' | 'left' | 'right';

/** 관계 트랙 (§7). null 이면 아직 갈리지 않았다 */
export type Track = null | 'bond' | 'romance';

/** 고백 상태 (§7.4). 고백은 인물이 한다 — 플레이어가 거는 쪽이 아니다 */
export type ConfessState = 'none' | 'pending' | 'accepted' | 'declined';

/** 인물이 명단에 들어온 경로 (§7.1) */
export type CompanionOrigin = 'preset' | 'quest' | 'drifter' | 'referral';

/**
 * 연대기 한 줄 (§4, §15).
 * 무주어 문어체 과거형으로 쓴다. 2인칭 금지.
 * M0에서는 담을 그릇만 둔다. 분류·서식은 연대기 시스템에서 확장한다.
 */
export interface ChronicleEntry {
  id: string;
  turn: number;
  text: string;
}

export interface CompanionRecord {
  id: string;
  archetypeId: string;
  name: string;
  /** 0..100 */
  affinity: number;
  track: Track;
  confessed: ConfessState;
  clearedEvents: string[];
  lastApproachTurn: number;
  injuredUntilTurn: number;
  /** slot -> IndexedDB 키. 이미지 자체가 아니라 **참조만** 넣는다 */
  images: Record<number, string | null>;
  unlockedSlots: number[];
  homeRegion: string;
  origin: CompanionOrigin;
  joinedTurn: number;
  departedTurn: number | null;
}

export interface PatronRecord {
  id: string;
  met: boolean;
  /** 0..60 */
  trust: number;
  questsCleared: string[];
  activeQuestId: string | null;
}

export interface HeroState {
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  stats: Record<StatId, number>;
  statPoints: number;
  skillPoints: number;
  skills: Record<string, number>;
  relics: string[];
}

export interface TownState {
  name: string;
  /** buildingId -> level (0 = 미건설) */
  buildings: Record<string, number>;
}

export interface WorldState {
  year: number;
  week: number;
  turn: number;
  eraIndex: number;
  eraTier: number;
  unlockedRegions: string[];
  /** 'town' | 'region:whisper' | 'indoor:hall' ... */
  currentMap: string;
  heroTile: { x: number; y: number; dir: Dir };
}

export interface Counters {
  expeditions: number;
  buildsMade: number;
  collapses: number;
  confessions: number;
  firsts: Record<string, boolean>;
  /**
   * 식량이 마이너스인 채로 이어진 주 수 (§13 붕괴 조건).
   *
   * **§4 에 없던 칸이다.** 붕괴는 "식량 0 미만 4주 연속"으로 판정하는데
   * 이걸 담을 자리가 없었다. 세션에만 두면 새로고침으로 붕괴를 피할 수 있고,
   * 그건 원장(§14)이 막으려는 바로 그 행동이다. 그래서 판을 2로 올렸다.
   */
  famineWeeks: number;
}

export interface GameState {
  schemaVersion: 2;
  createdAt: number;

  hero: HeroState;
  town: TownState;
  resources: Record<ResourceId, number>;
  world: WorldState;

  companions: Record<string, CompanionRecord>;
  patrons: Record<string, PatronRecord>;
  /** -100..100 */
  factions: Record<FactionId, number>;

  /** 동행 중인 관계 대상 id (§11 동행) */
  escort: string | null;
  /** 말을 걸어오려고 대기 중인 인물 (§7.3 다가옴 구조) */
  pendingApproach: string[];

  /** 최근 CHRONICLE_MAX개 */
  chronicle: ChronicleEntry[];
  counters: Counters;
}

/**
 * 원장 — 세이브와 **별도 키**다 (§14).
 * 불러오기가 값을 낮추지 못한다. 붕괴 이전 세이브를 불러와도 붕괴는 되돌아오지 않는다.
 */
export interface Ledger {
  ledgerVersion: 1;
  maxTurnReached: number;
  collapses: number;
  lastCollapseTurn: number | null;
}
