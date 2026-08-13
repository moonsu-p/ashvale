/**
 * 인물 패널 — §7. 관계 대상(교류·선물)·의뢰인(교류)·세력 평판. 말투는 호감 단계에 따라 바뀐다.
 * 대사는 content 파일에서 온다. 트랙 분기·동행·퀘스트는 M7c, 이미지는 M7b.
 */

import { PALETTE } from '@/data/palette';
import { ARCHETYPES } from '@/data/archetypes';
import { FACTION_NAME, FACTION_STAGE_NAME, factionStage } from '@/data/factions';
import { TRUST_STAGE_NAME, trustStage, PRESET_PATRONS } from '@/data/patrons';
import { GIFT_HINT_AFFINITY } from '@/data/relationships';
import { useGameStore } from '@/store/useGameStore';
import { affinityTier, canGift } from '@/systems/relationships';
import type { FactionId, GameState } from '@/types/game';

const TIER_LABEL: Record<string, string> = { stranger: '낯선 사이', ally: '아는 사이', friend: '벗', lover: '연인' };
const PATRON_NAME: Record<string, string> = Object.fromEntries(PRESET_PATRONS.map((p) => [p.id, p.name]));

function DialogueLine() {
  const d = useGameStore((s) => s.lastDialogue);
  const dismiss = useGameStore((s) => s.dismissDialogue);
  if (!d) return null;
  return (
    <div
      onClick={dismiss}
      className="mb-1 rounded px-2 py-1.5 text-xs"
      style={{ background: PALETTE.ink, color: PALETTE.linen }}
    >
      <b style={{ color: PALETTE.gold }}>{d.speaker}</b> {d.text}
    </div>
  );
}

export function PeoplePanel({ state }: { state: GameState }) {
  const talkCompanion = useGameStore((s) => s.talkCompanion);
  const talkPatron = useGameStore((s) => s.talkPatron);
  const giftCompanion = useGameStore((s) => s.giftCompanion);

  const companions = Object.values(state.companions).filter((c) => c.departedTurn === null);
  const patrons = Object.values(state.patrons).filter((p) => p.met);

  return (
    <section>
      <h2 className="mb-1 font-medium">인물</h2>
      <DialogueLine />

      {/* 세력 평판 */}
      <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        {(Object.keys(FACTION_NAME) as FactionId[]).map((f) => (
          <div key={f} className="flex justify-between">
            <span style={{ color: PALETTE.inkSoft }}>{FACTION_NAME[f]}</span>
            <span className="tabular-nums">
              {state.factions[f]} <span style={{ color: PALETTE.inkSoft }}>{FACTION_STAGE_NAME[factionStage(state.factions[f])]}</span>
            </span>
          </div>
        ))}
      </div>

      {/* 관계 대상 */}
      {companions.length === 0 && patrons.length === 0 && (
        <p className="text-xs" style={{ color: PALETTE.inkSoft }}>아직 함께하는 이가 없다.</p>
      )}
      {companions.map((c) => {
        const arch = ARCHETYPES[c.archetypeId];
        const tier = affinityTier(c.affinity, c.track);
        const hint = c.affinity >= GIFT_HINT_AFFINITY;
        const gift = canGift(state, c.id);
        const cats = [arch?.likes[0], arch?.dislikes[0], '금화'].filter(Boolean) as string[];
        return (
          <div key={c.id} className="mb-1 border-t pt-1 text-xs" style={{ borderColor: PALETTE.paperDim }}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {c.name} <span style={{ color: PALETTE.inkSoft }}>· {arch?.label}</span>
              </span>
              <span className="tabular-nums">
                호감 {c.affinity} <span style={{ color: PALETTE.inkSoft }}>{TIER_LABEL[tier]}</span>
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              <button
                onClick={() => void talkCompanion(c.id)}
                className="rounded px-2 py-0.5"
                style={{ background: PALETTE.slate, color: PALETTE.paper }}
              >
                교류
              </button>
              {cats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => void giftCompanion(c.id, cat)}
                  disabled={!gift}
                  className="rounded px-2 py-0.5"
                  style={{ background: gift ? PALETTE.wood : PALETTE.stone, color: PALETTE.paper, opacity: gift ? 1 : 0.5 }}
                >
                  {cat}
                  {hint && arch?.likes.includes(cat) ? '♥' : ''}
                </button>
              ))}
              {!gift && <span style={{ color: PALETTE.inkSoft }}>선물 쿨다운</span>}
            </div>
          </div>
        );
      })}

      {/* 의뢰인 */}
      {patrons.map((p) => (
        <div key={p.id} className="mb-1 border-t pt-1 text-xs" style={{ borderColor: PALETTE.paperDim }}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{PATRON_NAME[p.id] ?? p.id}</span>
            <span className="tabular-nums">
              신뢰 {p.trust} <span style={{ color: PALETTE.inkSoft }}>{TRUST_STAGE_NAME[trustStage(p.trust)]}</span>
            </span>
          </div>
          <button
            onClick={() => void talkPatron(p.id)}
            className="mt-0.5 rounded px-2 py-0.5"
            style={{ background: PALETTE.slate, color: PALETTE.paper }}
          >
            교류
          </button>
        </div>
      ))}
    </section>
  );
}
