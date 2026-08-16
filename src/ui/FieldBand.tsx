/**
 * 가운데 필드 — 최소 470dp, 남는 높이를 흡수한다 (§2, src/data/layout.ts).
 *
 * Phaser 캔버스가 배경이고, React UI 가 그 위에 겹친다.
 */

import { PhaserHost } from '@/phaser/PhaserHost';
import { InteractPrompt } from './InteractPrompt';
import { DialogueLayer } from './dialogue/DialogueLayer';

interface Props {
  prompt: string | null;
  talking: boolean;
}

export function FieldBand({ prompt, talking }: Props) {
  return (
    <main className="relative min-h-field flex-1 overflow-hidden bg-ink">
      <PhaserHost />
      {/* 대화 중에는 상호작용 프롬프트를 감춘다. 대사창이 그 자리를 쓴다 */}
      {!talking && <InteractPrompt label={prompt} />}
      <DialogueLayer />
    </main>
  );
}
