/**
 * 시스템이 생성하는 연대기 문구 — 무주어 문어체, 과거형 종결 (§15.1).
 * 인물 대사·지역 서술 등 콘텐츠 텍스트는 절대 여기 두지 않는다(수정 금지 파일에서 가져온다).
 * 여기에는 사전 작성 풀이 없는 시스템 사건(기근 등)만 최소한으로 둔다.
 */

import { BUILDING_NAMES } from './buildings';
import { ERAS, MYTHIC_ERA, tierRoman } from './eras';
import { REGION_TEXT } from './content/region-text';

export const FAMINE_TEXT = '곳간이 비었다. 이번 주는 굶었다.';

export function famineBuildingLossText(buildingId: string): string {
  const name = BUILDING_NAMES[buildingId] ?? '집';
  return `굶주림에 ${name} 하나가 헐렸다.`;
}

/** 건설·증축 연대기 (무주어 문어체, 과거형). */
export function buildText(buildingId: string, newLevel: number): string {
  const name = BUILDING_NAMES[buildingId] ?? '건물';
  return newLevel <= 1 ? `${name}을 세웠다.` : `${name}을 넓혔다.`;
}

/** 시대 전환 문장 (§5 표). 신화기 이후 티어는 등급 표기를 붙인다. */
export function eraTransitionText(eraIndex: number, tier: number): string {
  const era = ERAS[Math.min(eraIndex, ERAS.length - 1)];
  if (!era) return '';
  if (eraIndex >= MYTHIC_ERA && tier > 0) {
    return `${era.name} ${tierRoman(tier)}에 들어섰다. ${era.transition}`;
  }
  return era.transition;
}

/** 지역 최초 해금 (§9 마일스톤). */
export function regionUnlockText(regionId: string): string {
  const label = REGION_TEXT[regionId]?.label ?? '새 지역';
  return `${label}으로 가는 길이 열렸다.`;
}

/** 붕괴 기록 (§15.2). 세대 교체로 표현한다. */
export function collapseText(fallenGeneration: number): string {
  return `제${fallenGeneration}대 아쉬베일이 무너졌다. 폐허 위에서 다시 시작한다.`;
}

/** 붕괴 임박 경고 (§15.2 예시 문장, 문어체). 연대기·화면 공용. */
export const COLLAPSE_WARNING_TEXT = '이 거점은 겨울을 넘기지 못할 것이다.';

/** 식량 부족 안내 (평서체, 무엇을 하면 되는지 명시 — §15.1). */
export const FOOD_SHORTAGE_TEXT = '식량이 부족합니다. 농장을 올리거나 교역하세요.';
