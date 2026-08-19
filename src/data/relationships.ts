/**
 * 관계 수치 — 기획서 §7.3, §7.4, §7.6, §15.
 *
 * **교류 버튼이 없다.** 호감은 함께 겪은 일에서만 오른다.
 * 플레이어가 인물을 찾아가 수치를 올리는 구조가 아니다.
 */

import type { AffinityTier } from './content/companion-dialogue';

/** 호감 경로 4개 (§7.3). 이 밖의 방법으로는 오르지 않는다 */
export const AFFINITY = {
  /** 동행 탐사 — 판정 등급별 */
  escort: { triumph: 12, success: 6, failure: 3, crisis: 1 },
  /** 고향 지역을 탐사하면 추가로. 동행 여부와 무관하다 */
  homeRegion: 4,
  /** 선물 */
  gift: { match: 12, mismatch: 4, dislike: -3 },
  /** 대화 사건 — 선택지가 값을 들고 있다 (dialogue-events.ts) */
  ignoredApproach: -3,
} as const;

/**
 * 나들이 놀이 (§7.6).
 *
 * 이겨야 크게 오르지만 져도 오른다 — 놀이에 벌을 붙이면 다시 안 하게 된다.
 * 선물(12)보다 낮게 둔다. 자원을 쓰는 쪽이 더 값이 나가야 한다.
 */
export const OUTING_AFFINITY = { win: 8, lose: 3 } as const;

/** 선물은 인물당 4주 쿨다운 (§7.3) */
export const GIFT_COOLDOWN_WEEKS = 4;

/** 동행은 주당 1명, 동료(40) 이상만 (§11) */
export const ESCORT_MIN_AFFINITY = 40;
/** 위기 결과면 동행자가 부상 — 4주간 동행·대화 불가, 호감 −8 (§11) */
export const ESCORT_INJURY = { weeks: 4, affinity: -8 };

/** 다가옴을 세 번 무시하면 물러난다 (§7.3) */
export const APPROACH_IGNORE_LIMIT = 3;

/**
 * 호감 단계. 말투가 여기서 갈린다 (§15).
 * 수치 대신 문체로 관계를 체감시키는 장치다.
 */
export interface AffinityStage {
  at: number;
  name: string;
  tone: AffinityTier;
}

export const AFFINITY_STAGES: AffinityStage[] = [
  { at: 0, name: '낯선 사람', tone: 'stranger' },
  { at: 20, name: '아는 사이', tone: 'stranger' },
  { at: 40, name: '동료', tone: 'ally' },
  { at: 60, name: '벗', tone: 'friend' },
  { at: 80, name: '맹우', tone: 'friend' },
];

export const AFFINITY_MIN = 0;
export const AFFINITY_MAX = 100;

/** 대화 사건이 열리는 문턱 (§8.4) */
export const EVENT_TIERS = [20, 40, 60, 80] as const;
export type EventTier = (typeof EVENT_TIERS)[number];

/** 고백은 벗(60) 도달 후 다가옴 사건으로 온다 (§7.4) */
export const CONFESS_AT = 60;

// ── 의뢰인 (§7.6) ────────────────────────────────────────

export const TRUST_MAX = 60;

export const TRUST_STAGES = [
  { at: 0, name: '안면' },
  { at: 20, name: '거래처' },
  { at: 40, name: '오랜 벗' },
];

export const TRUST = {
  questCleared: 10,
  factionRise: 2,
  /** 대화로도 오른다. 주를 쓰지 않는다 */
  talk: 3,
} as const;

// ── 세력 평판 ────────────────────────────────────────────

export const FACTION_LABEL = {
  guild: '상인 길드',
  oath: '은빛 서약',
  grove: '숲의 부족',
  tower: '마탑',
} as const;

/**
 * 세력의 태도 (§7).
 *
 * 지금까지 평판은 **오르기만 하고 아무것도 하지 않았다** — 의뢰 하나의
 * 조건으로만 쓰였다. 그러니 어느 세력을 편들든 결과가 같고, 세력이
 * 있으나 마나였다.
 *
 * 문턱을 넘으면 그 세력이 편의를 봐주고, 반대로 내려가면 불편해진다.
 * **마탑과 숲의 부족은 서로 반대다**(FACTION_OPPOSED) — 한쪽을 올리면
 * 다른 쪽이 깎이므로 넷을 다 챙길 수는 없다. 그게 갈래가 되는 자리다.
 *
 * 되돌릴 수 있게 둔다. 평판은 다시 오르내리므로 덫이 아니다.
 */
export const FACTION_STANDING = { boon: 40, grudge: -40 } as const;

export const FACTION_EFFECT = {
  guild: { boonText: '주간 거래 한도 +30', grudgeText: '주간 거래 한도 -20' },
  oath: { boonText: '위기 기력 손실 -20%', grudgeText: '위기 기력 손실 +20%' },
  grove: { boonText: '주간 식량 +3', grudgeText: '주간 식량 -2' },
  tower: { boonText: '탐사 판정 +1', grudgeText: '탐사 판정 -1' },
} as const;

export const FACTION_MIN = -100;
export const FACTION_MAX = 100;

/**
 * 세력은 서로 얽혀 있다. 한쪽에 기울면 반대쪽이 상한다.
 * 마탑에 +5 하면 숲의 부족이 −2 되는 식이다.
 */
export const FACTION_OPPOSED: Partial<Record<keyof typeof FACTION_LABEL, keyof typeof FACTION_LABEL>> =
  {
    tower: 'grove',
    grove: 'tower',
  };

/** 반대 세력이 받는 비율 */
export const FACTION_BACKLASH = 0.4;
