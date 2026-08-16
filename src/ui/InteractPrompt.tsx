/**
 * 상호작용 프롬프트 (§5).
 * 바라보는 칸에 대상이 있으면 필드 하단에 뜬다. 문구는 대상 종류에 따라 바뀐다.
 */

export function InteractPrompt({ label }: { label: string | null }) {
  if (label === null) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
      <div className="rounded border border-stoneDark bg-ink/85 px-3 py-1 text-[12px] text-paper">
        <span className="text-gold">A</span> — {label}
      </div>
    </div>
  );
}
