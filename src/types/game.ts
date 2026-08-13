/**
 * 게임 상태 데이터 모델 — 기획서 §3, §7.8 준수.
 *
 * 규칙:
 *  - 시각 상태(건물 좌표·워커 위치·맵 크기·계절 틴트)는 여기에 넣지 않는다.
 *    전부 GameState 에서 파생한다 (deriveLayout 등). §3
 *  - 이미지 바이트는 세이브에 넣지 않는다. images 는 IndexedDB 키(참조)만. §7.8
 */

export const CURRENT_SCHEMA = 1;

export type ResourceId = 'wood' | 'stone' | 'food' | 'gold';
export type StatId = 'might' | 'agility' | 'insight' | 'will';
export type FactionId = 'guild' | 'oath' | 'grove' | 'tower';

/** 계절 인덱스: 0 봄 · 1 여름 · 2 가을 · 3 겨울 */
export type Season = 0 | 1 | 2 | 3;

export interface ChronicleEntry {
  year: number;
  week: number;
  season: Season;
  kind: 'quest' | 'build' | 'bond' | 'threat' | 'era' | 'world' | 'milestone';
  text: string;
}

/** 관계 대상 (여성, 커스텀) — §7.8 */
export interface CompanionRecord {
  id: string; // 생성 시 uuid
  archetypeId: string; // §7.2 의 6종
  name: string; // 플레이어 지정
  affinity: number; // 0..100
  track: null | 'bond' | 'romance';
  consecutiveTalks: number;
  lastGiftTurn: number;
  clearedEvents: string[];
  injuredUntilTurn: number;
  images: Record<number, string | null>; // slot -> IndexedDB 키. 값이 아니라 참조만
  unlockedSlots: number[];
  origin: 'preset' | 'quest' | 'drifter' | 'referral';
  joinedTurn: number;
  departedTurn: number | null; // 떠나도 갤러리 보존용으로 레코드는 남긴다
}

/** 의뢰인 (남성, 프리셋) — §7.8 */
export interface PatronRecord {
  id: string; // §7.3 의 고정 id
  met: boolean;
  trust: number; // 0..60
  questsCleared: string[];
  activeQuestId: string | null;
}

export interface GameState {
  schemaVersion: typeof CURRENT_SCHEMA;
  createdAt: number;

  hero: {
    name: string;
    level: number;
    xp: number; // 현재 레벨 내 누적
    hp: number;
    maxHp: number;
    stats: Record<StatId, number>;
    statPoints: number; // 능력치 배분 대기
    skillPoints: number;
    skills: Record<string, number>; // skillId -> rank
    relics: string[];
    downedUntilTurn: number; // 쓰러진 채 실려 옴 → 이 턴까지 탐험 불가 (§6). 0 = 정상
  };

  settlement: {
    name: string;
    buildings: Record<string, number>; // buildingId -> level (0 = 미건설)
  };

  resources: Record<ResourceId, number>;

  world: {
    year: number; // 1부터
    week: number; // 1..48
    turn: number; // 총 경과 턴
    eraIndex: number;
    eraTier: number; // 최종 시대 이후 무한 등급 (§5)
    unlockedRegions: string[];
  };

  companions: Record<string, CompanionRecord>; // 관계 대상, §7.8
  patrons: Record<string, PatronRecord>; // 의뢰인, §7.8
  factions: Record<FactionId, number>; // -100..100

  threat: null | { id: string; power: number; weeksLeft: number; prepBonus: number };

  /** 동시 1개 퀘스트 (§16.1). 기한·실패 없음. 붕괴 시 초기화. */
  activeQuest: { questId: string; patronId: string; progress: Record<string, number>; acceptedTurn: number } | null;
  /** 이번 주 교역 사용량(금화 상당). 매 턴 0으로 초기화 (§16.4 주간 한도). */
  weeklyTradeUsed: number;

  chronicle: ChronicleEntry[]; // 최근 200개만 유지
  counters: {
    explores: number;
    threatsWon: number;
    threatsLost: number;
    buildsMade: number;
    collapses: number; // 붕괴 횟수, §15.2 재기 보정에 사용
    foodDeficitStreak: number; // 식량<0 연속 주 수 (§15.2 붕괴 조건 1)
    firsts: Record<string, boolean>; // 마일스톤 중복 기록 방지 (대성공 추적 포함)
  };
}

/**
 * 원장 (ledger) — 세이브와 별도 키. 불러오기가 이 값을 낮추지 못한다. §12.7a
 */
export interface Ledger {
  maxTurnReached: number;
  collapses: number;
  lastCollapseTurn: number;
}

/** 연대기 최대 보존 개수 (§3) */
export const CHRONICLE_MAX = 200;
