/**
 * 가운데 필드 — 최소 470dp, 남는 높이를 흡수한다 (§2, src/data/layout.ts).
 *
 * M0에서는 Phaser 캔버스 대신 저장 상태를 보여 준다.
 * 새 게임을 만들고 새로고침했을 때 같은 판이 돌아왔는지 폰에서 눈으로 확인하려면
 * 판을 구별할 값이 화면에 있어야 한다. 생성 시각이 그 역할을 한다.
 */

import type { GameState, Ledger } from '@/types/game';
import { SCHEMA_VERSION } from '@/data/save';

function stamp(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-stoneDark/20 py-1">
      <span className="text-inkSoft">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

interface Props {
  state: GameState;
  ledger: Ledger;
  persisted: boolean;
  migratedFrom: number | null;
}

export function FieldBand({ state, ledger, persisted, migratedFrom }: Props) {
  return (
    <main className="min-h-field flex-1 overflow-y-auto bg-paper px-3 py-2 text-[12px] text-ink">
      <h2 className="mb-1 font-medium">저장 상태</h2>

      <Line label="생성 시각" value={stamp(state.createdAt)} />
      <Line label="스키마 판" value={String(SCHEMA_VERSION)} />
      <Line
        label="현재 위치"
        value={`${state.world.currentMap} (${state.world.heroTile.x}, ${state.world.heroTile.y}) ${state.world.heroTile.dir}`}
      />
      <Line label="주차" value={`${state.world.turn}주 경과`} />
      <Line label="원장 최대 주차" value={`${ledger.maxTurnReached}주`} />
      <Line label="붕괴 횟수" value={`${ledger.collapses}회`} />
      <Line label="지속 저장" value={persisted ? '승인됨' : '미승인'} />
      {migratedFrom !== null && migratedFrom !== SCHEMA_VERSION && (
        <Line label="올라온 판" value={`${migratedFrom} → ${SCHEMA_VERSION}`} />
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-inkSoft">
        새로고침해도 생성 시각이 그대로면 복원된 것이다.
        <br />
        걸어다닐 마을은 다음 단계에서 이 자리에 들어온다.
      </p>
    </main>
  );
}
