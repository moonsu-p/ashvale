/**
 * 에셋 플레이스홀더 갤러리 — ?debugAssets=1 일 때만 보인다 (§11.1).
 * 전체 매니페스트를 색 사각형+라벨로 훑어보고 진행률을 확인하는 개발 도구.
 */

import { ASSETS, assetProgress } from '@/data/assets';
import { AssetPlaceholder } from './AssetPlaceholder';
import { PALETTE } from '@/data/palette';

export function AssetGallery() {
  const { total, done, remaining } = assetProgress();
  const byKind = ASSETS.reduce<Record<string, typeof ASSETS>>((acc, a) => {
    (acc[a.kind] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto p-3 text-sm" style={{ background: PALETTE.paper, color: PALETTE.ink }}>
      <h1 className="mb-1 text-base font-medium">에셋 플레이스홀더 · debugAssets</h1>
      <p className="mb-3" style={{ color: PALETTE.inkSoft }}>
        전체 {total} · 완료 {done} · 남음 {remaining} · rift 외곽선 = 미완성
      </p>
      {Object.entries(byKind).map(([kind, items]) => (
        <section key={kind} className="mb-4">
          <h2 className="mb-1 font-medium">
            {kind} <span style={{ color: PALETTE.inkSoft }}>({items.length})</span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {items.map((a) => (
              <AssetPlaceholder key={a.id} id={a.id} size={44} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
