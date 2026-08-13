/**
 * 시스템이 생성하는 연대기 문구 — 무주어 문어체, 과거형 종결 (§15.1).
 * 인물 대사·지역 서술 등 콘텐츠 텍스트는 절대 여기 두지 않는다(수정 금지 파일에서 가져온다).
 * 여기에는 사전 작성 풀이 없는 시스템 사건(기근 등)만 최소한으로 둔다.
 */

import { BUILDING_NAMES } from './buildings';

export const FAMINE_TEXT = '곳간이 비었다. 이번 주는 굶었다.';

export function famineBuildingLossText(buildingId: string): string {
  const name = BUILDING_NAMES[buildingId] ?? '집';
  return `굶주림에 ${name} 하나가 헐렸다.`;
}
