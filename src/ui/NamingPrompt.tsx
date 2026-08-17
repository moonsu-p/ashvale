/**
 * 이름 짓기 (§7.1).
 *
 * 관계 대상의 이름은 플레이어가 붙인다. **말을 걸기 전에** 먼저 묻는다 —
 * 누구와 이야기하는지 모르는 채로 대사가 흐르면 관계가 붙지 않는다.
 * 이름을 비워 두면 원형 이름표를 그대로 쓴다.
 */

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getArchetype } from '@/data/archetypes';
import { TOUCH_MIN } from '@/data/layout';

export function NamingPrompt() {
  const naming = useGameStore((s) => s.naming);
  const companions = useGameStore((s) => s.state?.companions);
  const submit = useGameStore((s) => s.nameCompanion);
  const [draft, setDraft] = useState('');

  useEffect(() => setDraft(''), [naming]);

  if (naming === null) return null;
  const companion = companions?.[naming];
  if (companion === undefined) return null;

  const archetype = getArchetype(companion.archetypeId);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/85 p-4">
      <div className="w-full rounded border border-stoneDark bg-paper p-4 text-ink">
        <h2 className="font-serif text-[15px]">처음 보는 얼굴이다</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-inkSoft">
          {archetype?.label}. {archetype?.homeRegion === '' ? '' : '고향이 멀다.'}
          <br />
          이름을 물었다.
        </p>

        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit(draft);
            // 방향키가 필드로 새지 않게 막는다
            e.stopPropagation();
          }}
          placeholder={archetype?.label ?? '이름'}
          maxLength={12}
          className="mt-3 w-full rounded border border-stoneDark bg-paperDim px-3 py-2 text-[14px] text-ink outline-none"
        />

        <button
          type="button"
          onClick={() => submit(draft)}
          style={{ minHeight: TOUCH_MIN }}
          className="mt-3 w-full rounded border border-stoneDark bg-gold text-[13px] font-medium text-ink"
        >
          {draft.trim() === '' ? '이름 없이 넘어간다' : `'${draft.trim()}' 라고 부른다`}
        </button>
      </div>
    </div>
  );
}
