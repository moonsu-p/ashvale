/**
 * 탐험 패널 — 해금된 지역을 골라 판정을 시작한다 (§6). 능력치·난이도를 숫자로 보여준다.
 * 강제 휴식(쓰러진 채 실려 옴) 중에는 탐험이 막히고 이유를 안내한다.
 */

import { PALETTE } from '@/data/palette';
import { REGIONS } from '@/data/explore';
import { REGION_TEXT } from '@/data/content/region-text';
import { useGameStore } from '@/store/useGameStore';
import { isDowned } from '@/systems/explore';
import { currentTask, inRecommendWindow } from '@/systems/onboarding';
import type { GameState, StatId } from '@/types/game';

const STAT_NAME: Record<StatId, string> = { might: '힘', agility: '민첩', insight: '통찰', will: '의지' };

export function ExplorePanel({ state }: { state: GameState }) {
  const explore = useGameStore((s) => s.explore);
  const downed = isDowned(state);
  const recommendExplore = inRecommendWindow(state) && currentTask(state)?.id === 'explore';

  const regions = state.world.unlockedRegions.filter((id) => id in REGIONS);

  return (
    <section>
      <h2 className="mb-1 font-medium">탐험</h2>
      {downed && (
        <p className="mb-1 text-xs" style={{ color: PALETTE.blood }}>
          쓰러진 채 실려 왔습니다. {state.hero.downedUntilTurn - state.world.turn}주간 탐험할 수 없습니다.
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {regions.map((id) => {
          const r = REGIONS[id]!;
          const label = REGION_TEXT[id]?.label ?? id;
          const highlight = recommendExplore && id === 'whisper';
          return (
            <li
              key={id}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
              style={{ outline: highlight ? `1px solid ${PALETTE.gold}` : undefined }}
            >
              <span className="w-20 shrink-0 font-medium">{label}</span>
              <span className="shrink-0" style={{ color: PALETTE.inkSoft }}>
                {STAT_NAME[r.stat]} · 난이도 {r.difficulty}
              </span>
              <button
                onClick={() => explore(id)}
                disabled={downed}
                className="ml-auto shrink-0 rounded px-3 py-1 text-xs font-medium"
                style={{ background: downed ? PALETTE.stone : PALETTE.slate, color: PALETTE.paper, opacity: downed ? 0.6 : 1 }}
              >
                탐험
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
