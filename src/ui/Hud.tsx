/**
 * 상단 HUD — 40dp 고정 (§2).
 * 여기서 규칙을 계산하지 않는다. 상태를 읽어 표시만 한다.
 */

import type { GameState, ResourceId } from '@/types/game';
import { SEASON_LABEL, seasonOf } from '@/data/seasons';
import { eraName } from '@/data/eras';

const RESOURCE_LABEL: Record<ResourceId, string> = {
  wood: '목재',
  stone: '석재',
  food: '식량',
  gold: '금화',
};

const ORDER: ResourceId[] = ['wood', 'stone', 'food', 'gold'];

/**
 * 기력 막대.
 *
 * 숫자만 두면 눈에 안 들어온다. 탐사에서 깎이는 유일한 값이라
 * 줄어드는 게 보여야 나갈지 말지를 고민하게 된다.
 * 색은 팔레트에서만 가져온다. HUD 바탕이 어두운 slate 라 UI.danger(blood)는
 * 너무 어두워 '빈 칸'처럼 보인다. 그래서 위험 색으로 roofRed 를 쓴다.
 */
function HpMeter({ hp, maxHp }: { hp: number; maxHp: number }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const tone = ratio <= 0.25 ? 'bg-roofRed' : ratio <= 0.5 ? 'bg-gold' : 'bg-grassLight';

  return (
    <span className="flex items-center gap-1">
      <span className="text-paperDim">기력</span>
      <span
        className="h-1.5 w-12 overflow-hidden rounded-sm bg-stoneDark"
        role="img"
        aria-label={`기력 ${hp} / ${maxHp}`}
      >
        <span
          className={`block h-full ${tone}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span className="text-paper">
        {hp}
        <span className="text-paperDim">/{maxHp}</span>
      </span>
    </span>
  );
}

export function Hud({ state, onOpenMenu }: { state: GameState; onOpenMenu: () => void }) {
  return (
    // 상단 안전 영역만큼 내려 앉힌다. 플립4는 펀치홀이 이 자리에 있다
    <header className="shrink-0 border-b border-stoneDark bg-slate px-2 pt-safe-t text-[11px] text-paper">
      {/* HUD 를 누르면 메뉴가 열린다 (§5) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-hud w-full flex-col justify-center gap-px text-left"
      >
        {/* 윗줄 — 어디에서 언제 */}
        <div className="flex items-baseline gap-2">
          <span className="font-medium">{state.town.name}</span>

          <span className="text-paperDim">
            {state.world.year}년 {state.world.week}주·{SEASON_LABEL[seasonOf(state.world.week)]}
          </span>

          <span className="ml-auto text-paperDim">
            {eraName(state.world.eraIndex, state.world.eraTier)}
          </span>
        </div>

        {/* 아랫줄 — 몸과 살림 */}
        <div className="flex items-center gap-2 text-[10px] tabular-nums">
          <HpMeter hp={state.hero.hp} maxHp={state.hero.maxHp} />

          <div className="ml-auto flex gap-2">
            {ORDER.map((id) => (
              <span key={id} className="text-paperDim">
                {RESOURCE_LABEL[id]} <span className="text-paper">{state.resources[id]}</span>
              </span>
            ))}
          </div>
        </div>
      </button>
    </header>
  );
}
