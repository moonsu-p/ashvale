/**
 * 헌신 — 호감이 최대에 닿은 사람이 마을에 남기는 것 (§7) — 순수 함수.
 *
 * 호감은 100 에서 멈추는데 마지막 단계가 80(맹우)이라 **80 위로는 올릴 이유가
 * 없었다.** 최대에 닿으면 그 사람다운 방식으로 마을에 보탬이 된다.
 *
 * 금화만 흘려주지 않는다 — 그러면 관계가 수도꼭지가 되고, 누구와 가까워지든
 * 결과가 같아진다. 원형마다 다른 것을 주어야 **누구를 택할지**가 선택이 된다.
 *
 * 같은 원형이 여럿이어도 **중첩하지 않는다** (§7.2 와 같은 규칙).
 */

import type { GameState, ResourceId } from '@/types/game';
import { getArchetype, type DevotionBoon } from '@/data/archetypes';
import { AFFINITY_MAX } from '@/data/relationships';

/** 최대에 닿은 사람들. 떠난 사람은 빼고, 원형은 하나씩만 */
export function devotedArchetypes(state: GameState): string[] {
  const seen = new Set<string>();
  for (const who of Object.values(state.companions)) {
    if (who.departedTurn !== null) continue;
    if (who.affinity < AFFINITY_MAX) continue;
    seen.add(who.archetypeId);
  }
  return [...seen];
}

function boonsOf(state: GameState): DevotionBoon[] {
  return devotedArchetypes(state).flatMap((id) => getArchetype(id)?.devotion ?? []);
}

export interface DevotionTotals {
  /** 주마다 더해지는 자원 */
  weekly: Partial<Record<ResourceId, number>>;
  /** 주마다 더 회복하는 기력 */
  heal: number;
  /** 유물 발견 확률에 더할 값 */
  relicPoints: number;
  /** 위기 기력 손실을 줄이는 비율 */
  crisisHpPercent: number;
}

export function devotionTotals(state: GameState): DevotionTotals {
  const out: DevotionTotals = { weekly: {}, heal: 0, relicPoints: 0, crisisHpPercent: 0 };

  for (const boon of boonsOf(state)) {
    switch (boon.kind) {
      case 'weekly':
        out.weekly[boon.resource] = (out.weekly[boon.resource] ?? 0) + boon.value;
        break;
      case 'heal':
        out.heal += boon.value;
        break;
      case 'relicFind':
        out.relicPoints += boon.points;
        break;
      case 'crisisHp':
        out.crisisHpPercent += boon.percent;
        break;
    }
  }

  return out;
}

/** 화면에 적을 줄. 누가 무엇을 주는지 */
export function devotionLines(state: GameState): { name: string; text: string }[] {
  return devotedArchetypes(state).map((id) => {
    const archetype = getArchetype(id);
    return { name: archetype?.label ?? id, text: archetype?.devotionText ?? '' };
  });
}
