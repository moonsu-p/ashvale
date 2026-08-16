/**
 * 에셋 점검 화면 — `?debugAssets=1` 일 때만 뜬다.
 *
 * 매니페스트를 그대로 훑어서, 조달된 것은 실제 파일을, 아직 없는 것은
 * 플레이스홀더를 그린다. 배포본에 남아도 주소로 열지 않으면 보이지 않는다.
 */

import { useEffect, useRef } from 'react';
import { ASSETS, missingAssets, type AssetEntry } from '@/data/assets';
import { drawPlaceholderCard, specOf } from './placeholder';

const CARD_SCALE = 3;

export function isDebugAssets(search: string = window.location.search): boolean {
  return new URLSearchParams(search).get('debugAssets') === '1';
}

function PlaceholderCanvas({ entry }: { entry: AssetEntry }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlaceholderCard(ctx, specOf(entry), CARD_SCALE);
  }, [entry]);

  const spec = specOf(entry);
  return (
    <canvas
      ref={ref}
      width={spec.width * CARD_SCALE}
      height={spec.height * CARD_SCALE}
      className="shrink-0"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function Row({ entry }: { entry: AssetEntry }) {
  const { sheet } = entry;
  return (
    <li className="flex items-start gap-3 border-b border-stoneDark/30 py-2">
      {entry.path === null ? (
        <PlaceholderCanvas entry={entry} />
      ) : (
        <img
          src={entry.path}
          alt={entry.id}
          className="shrink-0"
          style={{ imageRendering: 'pixelated', height: 48 }}
        />
      )}

      <div className="min-w-0 flex-1 text-[11px] leading-tight">
        <div className="font-medium text-ink">{entry.id}</div>
        <div className="text-inkSoft">{entry.placeholder.label}</div>
        <div className="text-inkSoft">
          {entry.path === null ? (
            <span className="text-blood">미조달 — 플레이스홀더</span>
          ) : (
            <span className="break-all">{entry.path}</span>
          )}
        </div>
        {sheet !== undefined && (
          <div className="text-inkSoft">
            {sheet.frameWidth}×{sheet.frameHeight} · spacing {sheet.spacing} · margin{' '}
            {sheet.margin}
          </div>
        )}
      </div>
    </li>
  );
}

export function DebugAssets() {
  const missing = missingAssets();

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-paper px-3 py-2 text-ink">
      <h1 className="font-medium">에셋 점검</h1>
      <p className="mb-2 text-[11px] text-inkSoft">
        전체 {ASSETS.length}개 · 미조달 {missing.length}개.
        <br />
        Kenney 타일셋은 spacing 1, 캐릭터 팩은 spacing 0. 값이 섞이면 타일이 밀린다.
      </p>
      <ul>
        {ASSETS.map((entry) => (
          <Row key={entry.id} entry={entry} />
        ))}
      </ul>
    </div>
  );
}
