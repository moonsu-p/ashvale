/**
 * 하단 UI 시트 (M0 골격) — 상태가 저장·복원됨을 눈으로 확인할 수 있게 요약을 보여준다.
 * 턴 진행·건설 등 실제 조작은 이후 마일스톤에서 추가한다.
 */

import { PALETTE } from '@/data/palette';
import { AssetPlaceholder } from './AssetPlaceholder';
import { ChronicleView } from './ChronicleView';
import { BuildPanel } from './BuildPanel';
import { useGameStore } from '@/store/useGameStore';
import { weeklyBalance } from '@/systems/turn';
import { population } from '@/systems/economy';
import { eraName } from '@/systems/progression';
import { generationOf } from '@/systems/collapse';
import { tierRoman } from '@/data/eras';
import type { GameState, ResourceId, StatId } from '@/types/game';

const RESOURCE_ICON: Record<ResourceId, string> = {
  wood: 'ui.wood',
  stone: 'ui.stone',
  food: 'ui.food',
  gold: 'ui.gold',
};
const STAT_ICON: Record<StatId, string> = {
  might: 'ui.might',
  agility: 'ui.agility',
  insight: 'ui.insight',
  will: 'ui.will',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ color: PALETTE.inkSoft }}>{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function BottomSheet({ state }: { state: GameState }) {
  const newChronicle = useGameStore((s) => s.newChronicle);
  const takeTurn = useGameStore((s) => s.takeTurn);
  const persist = useGameStore((s) => s.persist);
  const ledger = useGameStore((s) => s.ledger);

  const balance = weeklyBalance(state);
  const pop = population(state);

  const onNew = () => {
    // 2단 확인 (§12). 정식 확인 UI 는 이후 마일스톤에서.
    if (!window.confirm('지금까지의 연대기를 백업하고 새로 시작합니다. 계속할까요?')) return;
    if (!window.confirm('되돌릴 수 없습니다. 정말 새 연대기를 시작할까요?')) return;
    void newChronicle();
  };

  const persistText =
    persist == null ? '확인 중' : !persist.supported ? '미지원' : persist.persisted ? '지속 저장 승인됨' : '최선 노력 모드';

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <section>
        <Row label="거점">
          제{generationOf(state)}대 {state.settlement.name} · 인구 {pop}
        </Row>
        <Row label="시대">
          {eraName(state.world.eraIndex)}
          {state.world.eraTier > 0 ? ` ${tierRoman(state.world.eraTier)}` : ''}
        </Row>
        <Row label="시간">
          {state.world.year}년 {state.world.week}주 · 총 {state.world.turn}턴
        </Row>
        <Row label="영웅">
          Lv.{state.hero.level} · HP {state.hero.hp}/{state.hero.maxHp}
        </Row>
      </section>

      <button
        onClick={() => void takeTurn({ kind: 'rest' })}
        className="w-full rounded py-2.5 text-sm font-medium"
        style={{ background: PALETTE.grass, color: PALETTE.paper }}
      >
        휴식 — 다음 주로
      </button>

      <section>
        <h2 className="mb-1 font-medium">자원 <span className="text-xs" style={{ color: PALETTE.inkSoft }}>(주간 수지)</span></h2>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(RESOURCE_ICON) as ResourceId[]).map((r) => {
            const net = balance[r];
            const netColor = net > 0 ? PALETTE.grass : net < 0 ? PALETTE.blood : PALETTE.inkSoft;
            return (
              <div key={r} className="flex flex-col items-center gap-1">
                <AssetPlaceholder id={RESOURCE_ICON[r]} size={32} />
                <span className="text-xs tabular-nums">{state.resources[r]}</span>
                <span className="text-[10px] tabular-nums" style={{ color: netColor }}>
                  {signed(net)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-medium">능력치</h2>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(STAT_ICON) as StatId[]).map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <AssetPlaceholder id={STAT_ICON[s]} size={32} />
              <span className="text-xs">{state.hero.stats[s]}</span>
            </div>
          ))}
        </div>
      </section>

      <BuildPanel state={state} />

      <ChronicleView entries={state.chronicle} />

      <section className="text-xs" style={{ color: PALETTE.inkSoft }}>
        <Row label="저장소">{persistText}</Row>
        <Row label="원장 최대 도달 턴">{ledger?.maxTurnReached ?? 0}</Row>
        <Row label="세이브 식별(createdAt)">{state.createdAt}</Row>
      </section>

      <button
        onClick={onNew}
        className="mt-1 w-full rounded py-2 text-sm font-medium"
        style={{ background: PALETTE.blood, color: PALETTE.paper }}
      >
        새 연대기 시작
      </button>
    </div>
  );
}
