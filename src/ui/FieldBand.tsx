/**
 * 가운데 필드 — 최소 470dp, 남는 높이를 흡수한다 (§2, src/data/layout.ts).
 *
 * Phaser 캔버스가 배경이고, React UI 가 그 위에 겹친다.
 */

import { PhaserHost } from '@/phaser/PhaserHost';
import { InteractPrompt } from './InteractPrompt';

export function FieldBand({ prompt }: { prompt: string | null }) {
  return (
    <main className="relative min-h-field flex-1 overflow-hidden bg-ink">
      <PhaserHost />
      <InteractPrompt label={prompt} />
    </main>
  );
}
