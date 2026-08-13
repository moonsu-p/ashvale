/**
 * 성장 패널 — 능력치 배분 + 스킬 트리 + 유물 (§4, §9). M6.
 * 능력치·스킬 점수가 있으면 배분 버튼이 활성화된다. 선행·초월 비용을 반영한다.
 */

import { PALETTE } from '@/data/palette';
import { SKILLS, SKILL_LINE_NAME, type SkillLine } from '@/data/skills';
import { useGameStore } from '@/store/useGameStore';
import { skillRank, prereqMet, nextSkillCost, canLearn } from '@/systems/skills';
import { ownedRelics, relicStatBonus } from '@/systems/relics';
import type { GameState, StatId } from '@/types/game';

const STAT_LABEL: Record<StatId, string> = { might: '힘', agility: '민첩', insight: '통찰', will: '의지' };
const LINES: SkillLine[] = ['combat', 'explore', 'knowledge', 'command'];

export function CharacterPanel({ state }: { state: GameState }) {
  const allocateStat = useGameStore((s) => s.allocateStat);
  const learnSkill = useGameStore((s) => s.learnSkill);
  const relics = ownedRelics(state);

  return (
    <section className="flex flex-col gap-2">
      {/* 능력치 배분 */}
      <div>
        <h2 className="mb-1 font-medium">
          능력치 <span className="text-xs" style={{ color: PALETTE.inkSoft }}>· 점수 {state.hero.statPoints}</span>
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(STAT_LABEL) as StatId[]).map((st) => {
            const bonus = relicStatBonus(state, st);
            return (
              <div key={st} className="flex flex-col items-center gap-0.5">
                <span className="text-xs" style={{ color: PALETTE.inkSoft }}>{STAT_LABEL[st]}</span>
                <span className="text-sm font-medium tabular-nums">
                  {state.hero.stats[st]}
                  {bonus > 0 && <span style={{ color: PALETTE.gold }}> +{bonus}</span>}
                </span>
                <button
                  onClick={() => void allocateStat(st)}
                  disabled={state.hero.statPoints <= 0}
                  className="rounded px-2 text-xs"
                  style={{ background: state.hero.statPoints > 0 ? PALETTE.wood : PALETTE.stone, color: PALETTE.paper, opacity: state.hero.statPoints > 0 ? 1 : 0.5 }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 스킬 트리 */}
      <div>
        <h2 className="mb-1 font-medium">
          스킬 <span className="text-xs" style={{ color: PALETTE.inkSoft }}>· 점수 {state.hero.skillPoints}</span>
        </h2>
        {LINES.map((line) => (
          <div key={line} className="mb-1">
            <div className="text-xs" style={{ color: PALETTE.inkSoft }}>{SKILL_LINE_NAME[line]}</div>
            {SKILLS.filter((s) => s.line === line).map((sk) => {
              const rank = skillRank(state, sk.id);
              const cost = nextSkillCost(state, sk.id) ?? 0;
              const learn = canLearn(state, sk.id);
              const locked = !prereqMet(state, sk.id);
              const transcend = rank >= sk.max;
              return (
                <div key={sk.id} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className="w-12 shrink-0">{sk.name}</span>
                  <span className="w-16 shrink-0 tabular-nums" style={{ color: transcend ? PALETTE.gold : PALETTE.inkSoft }}>
                    {rank}/{sk.max}{transcend ? ' 초월' : ''}
                  </span>
                  <span className="shrink-0" style={{ color: PALETTE.inkSoft }}>{cost} SP</span>
                  {locked ? (
                    <span className="ml-auto text-[10px]" style={{ color: PALETTE.stone }}>선행 필요</span>
                  ) : (
                    <button
                      onClick={() => void learnSkill(sk.id)}
                      disabled={!learn}
                      className="ml-auto shrink-0 rounded px-2 py-0.5 text-[11px]"
                      style={{ background: learn ? PALETTE.slate : PALETTE.stone, color: PALETTE.paper, opacity: learn ? 1 : 0.5 }}
                    >
                      배분
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 유물 */}
      <div>
        <h2 className="mb-1 font-medium">
          유물 <span className="text-xs" style={{ color: PALETTE.inkSoft }}>· {relics.length}</span>
        </h2>
        {relics.length === 0 ? (
          <p className="text-xs" style={{ color: PALETTE.inkSoft }}>아직 찾은 유물이 없다.</p>
        ) : (
          <ul className="flex flex-col gap-0.5 text-xs">
            {relics.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <span style={{ color: PALETTE.inkSoft }}>{r.desc}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
