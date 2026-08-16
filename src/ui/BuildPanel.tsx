/**
 * 건설·증축 패널 (§10).
 *
 * 건물 부지에 서서 A 를 누르면 열린다. **시간을 쓰지 않는다** — 자원만 든다.
 * 최대 레벨이 없으므로 "완료" 상태는 없다. 비용만 계속 무거워진다.
 */

import { useGameStore } from '@/store/useGameStore';
import { getBuilding, visualStage } from '@/data/buildings';
import { TOUCH_MIN } from '@/data/layout';
import { blockMessage, canBuild, costText, nextCost } from '@/systems/construction';

export function BuildPanel() {
  const buildingId = useGameStore((s) => s.buildPanel);
  const state = useGameStore((s) => s.state);
  const close = useGameStore((s) => s.closeBuildPanel);
  const raise = useGameStore((s) => s.raiseBuilding);

  if (buildingId === null || state === null) return null;

  const def = getBuilding(buildingId);
  if (def === undefined) return null;

  const level = state.town.buildings[buildingId] ?? 0;
  const cost = nextCost(buildingId, level);
  const block = canBuild(state, buildingId);
  const problem = blockMessage(block);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/70 p-3">
      <div className="w-full rounded border border-stoneDark bg-paper p-3 text-ink">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium">{def.name}</h2>
          <span className="text-[12px] text-inkSoft">
            {level === 0 ? '미건설' : `${level}단계`}
          </span>
        </div>

        <p className="mt-1 text-[12px] text-inkSoft">{def.effectText}</p>

        <dl className="mt-2 space-y-1 text-[12px]">
          <div className="flex justify-between border-t border-stoneDark/25 pt-1">
            <dt className="text-inkSoft">다음 단계</dt>
            <dd>{level + 1}단계</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-inkSoft">비용</dt>
            <dd className="tabular-nums">{cost === null ? '—' : costText(cost)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-inkSoft">겉모습</dt>
            <dd>
              {visualStage(level)}단계 → {visualStage(level + 1)}단계
              {visualStage(level) !== visualStage(level + 1) ? ' (바뀜)' : ''}
            </dd>
          </div>
        </dl>

        {problem !== null && <p className="mt-2 text-[12px] text-blood">{problem}</p>}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={block.kind !== 'ok'}
            onClick={() => raise(buildingId)}
            style={{ minHeight: TOUCH_MIN }}
            className="flex-1 rounded border border-stoneDark bg-gold px-3 text-[13px] font-medium text-ink disabled:bg-paperDim disabled:text-inkSoft"
          >
            {level === 0 ? '건설' : '증축'}
          </button>
          <button
            type="button"
            onClick={close}
            style={{ minHeight: TOUCH_MIN }}
            className="rounded border border-stoneDark bg-paperDim px-4 text-[13px] text-ink"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
