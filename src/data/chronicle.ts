/**
 * 연대기 문구 (§4, §15).
 *
 * 문체 규약: **무주어 문어체, 과거형(~했다).** 2인칭(`그대`·`당신`) 금지.
 * 감탄사·수사를 넣지 않는다. 일어난 일만 적는다.
 *
 * 인물 대사와 지역 서술은 src/data/content/ 에 있다. 이건 그쪽이 아니라
 * 사건 기록이라 여기서 만든다 — §15 의 예문("서벽을 세 자 높였다")이 이 층이다.
 */

import { josa } from '@/systems/korean';
import { SEASON_LABEL, type SeasonId } from './seasons';

export const CHRONICLE_TEXT = {
  /** 건물을 올렸다 */
  build(name: string, level: number): string {
    return level === 1
      ? `${josa(name, '을')} 세웠다.`
      : `${josa(name, '을')} ${level}단계로 올렸다.`;
  },

  /** 한 주가 지났다. 계절이 끝났다는 뜻이 아니라 지금이 어느 철인지를 적는다 */
  week(year: number, week: number, season: SeasonId): string {
    return `한 주가 지났다. ${year}년 ${week}주, ${SEASON_LABEL[season]}.`;
  },

  /** 거둔 것과 먹은 것 */
  harvest(food: number, consumed: number): string {
    if (food <= 0) return `식량 ${josa(String(consumed), '을')} 먹었다.`;
    return `식량 ${josa(String(food), '을')} 거두고 ${josa(String(consumed), '을')} 먹었다.`;
  },

  /** 식량이 모자랐다 */
  famine(shortfall: number): string {
    return `식량이 ${shortfall} 모자랐다. 곳간이 비었다.`;
  },

  /** 시대가 바뀌었다 */
  era(from: string, to: string): string {
    return `${josa(from, '이')} 저물고 ${josa(to, '이')} 열렸다.`;
  },

  /** 마을이 넓어졌다 */
  expand(width: number, height: number): string {
    return `막아 두었던 자리를 치웠다. 마을이 ${width}×${height}로 넓어졌다.`;
  },

  /** 회복했다 */
  heal(amount: number): string {
    return `신전에서 몸을 추슬렀다. 기력 ${josa(String(amount), '을')} 되찾았다.`;
  },
} as const;
