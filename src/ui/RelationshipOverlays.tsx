/**
 * 관계 오버레이 — 대화 사건(§16.3)·관계 선언(§7.5)·퀘스트 제안(§16.1)·인물 생성(§7.7).
 * 대화 사건은 주사위를 굴리지 않는다. 서술은 content 파일에서 온다.
 */

import { useState } from 'react';
import { PALETTE } from '@/data/palette';
import { ARCHETYPES } from '@/data/archetypes';
import { DEFAULT_HERO_NAME } from '@/data/onboarding';
import { useGameStore } from '@/store/useGameStore';
import { dialogueSituation } from '@/systems/dialogueEvents';
import { reqProgress } from '@/systems/quests';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4" style={{ background: `${PALETTE.ink}E0` }}>
      <div className="w-full rounded-lg p-4" style={{ background: PALETTE.paper, color: PALETTE.ink, maxWidth: 340 }}>
        {children}
      </div>
    </div>
  );
}

export function RelationshipOverlays() {
  const state = useGameStore((s) => s.state);
  const dEvent = useGameStore((s) => s.pendingDialogueEvent);
  const decl = useGameStore((s) => s.pendingDeclaration);
  const offer = useGameStore((s) => s.pendingQuestOffer);
  const recruit = useGameStore((s) => s.pendingRecruit);
  const chooseDialogueChoice = useGameStore((s) => s.chooseDialogueChoice);
  const chooseTrack = useGameStore((s) => s.chooseTrack);
  const acceptQuest = useGameStore((s) => s.acceptQuest);
  const declineQuest = useGameStore((s) => s.declineQuest);
  const chooseRecruit = useGameStore((s) => s.chooseRecruit);
  const [recruitArch, setRecruitArch] = useState<string | null>(null);
  const [recruitName, setRecruitName] = useState('');

  if (!state) return null;

  if (dEvent) {
    return (
      <Card>
        <p className="mb-3 font-serif text-sm leading-relaxed">{dialogueSituation(state, dEvent.event)}</p>
        <div className="flex flex-col gap-2">
          {dEvent.event.choices.map((ch, i) => (
            <button
              key={i}
              onClick={() => void chooseDialogueChoice(i)}
              className="rounded px-3 py-2 text-left text-sm"
              style={{ background: PALETTE.paperDim }}
            >
              {ch.text}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (decl) {
    const name = state.companions[decl.companionId]?.name ?? '';
    return (
      <Card>
        <p className="mb-3 text-sm">{name}과(와)의 관계를 정한다.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => void chooseTrack('bond')} className="rounded px-3 py-2 text-sm font-medium" style={{ background: PALETTE.woodLight, color: PALETTE.paper }}>
            우애 — 로스터를 넓힌다 (소개 연쇄)
          </button>
          <button
            onClick={() => void chooseTrack('romance')}
            disabled={!decl.romance}
            className="rounded px-3 py-2 text-sm font-medium"
            style={{ background: decl.romance ? PALETTE.clothWarm : PALETTE.stone, color: PALETTE.paper, opacity: decl.romance ? 1 : 0.5 }}
          >
            연심 — 전용 콘텐츠 {decl.romance ? '' : '(대화 사건 2회 필요)'}
          </button>
        </div>
      </Card>
    );
  }

  if (offer) {
    return (
      <Card>
        <h3 className="mb-1 font-medium">{offer.quest.title}</h3>
        <ul className="mb-3 text-xs" style={{ color: PALETTE.inkSoft }}>
          {offer.quest.requirements.map((r, i) => {
            const p = reqProgress(state, r);
            return <li key={i}>· {p.label} {p.cur}/{p.target}</li>;
          })}
        </ul>
        <div className="flex gap-2">
          <button onClick={() => void acceptQuest()} className="flex-1 rounded px-3 py-2 text-sm font-medium" style={{ background: PALETTE.gold, color: PALETTE.ink }}>
            수락
          </button>
          <button onClick={declineQuest} className="rounded px-3 py-2 text-sm" style={{ background: PALETTE.paperDim }}>
            거절
          </button>
        </div>
      </Card>
    );
  }

  if (recruit) {
    return (
      <Card>
        <h3 className="mb-2 font-medium">새 인물이 합류하려 한다</h3>
        {!recruitArch ? (
          <div className="flex flex-col gap-2">
            {recruit.candidates.map((a) => (
              <button key={a} onClick={() => setRecruitArch(a)} className="rounded px-3 py-2 text-left text-sm" style={{ background: PALETTE.paperDim }}>
                {ARCHETYPES[a]?.label ?? a}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs" style={{ color: PALETTE.inkSoft }}>{ARCHETYPES[recruitArch]?.label} · 이름</span>
            <input
              value={recruitName}
              onChange={(e) => setRecruitName(e.target.value)}
              placeholder="이름"
              maxLength={12}
              className="rounded px-3 py-2 text-sm"
              style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.stoneDark}` }}
            />
            <button
              onClick={() => {
                void chooseRecruit(recruitArch, recruitName || DEFAULT_HERO_NAME);
                setRecruitArch(null);
                setRecruitName('');
              }}
              className="rounded px-3 py-2 text-sm font-medium"
              style={{ background: PALETTE.gold, color: PALETTE.ink }}
            >
              맞이한다 (이미지는 나중에 추가)
            </button>
          </div>
        )}
      </Card>
    );
  }

  return null;
}
