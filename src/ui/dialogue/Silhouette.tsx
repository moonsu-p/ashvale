/**
 * 원형 실루엣 — 초상 슬롯이 하나도 없을 때 대신 선다 (§8.2).
 *
 * 인물 이미지는 플레이어가 넣는 것이라, 넣기 전에도 대화가 멀쩡히 굴러가야 한다.
 * 여기서 "이미지를 넣으세요" 같은 안내를 하지 않는다. 조용히 이것으로 대신한다.
 *
 * 외형을 그리지 않는다. 플레이어가 어떤 인물을 상상할지 모르기 때문에,
 * 윤곽만 두고 비워 둔다.
 */

import { PALETTE } from '@/data/palette';

export function Silhouette({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 300 400"
      className="h-full w-full"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="300" height="400" fill={PALETTE.paperDim} />

      {/* 바닥 쪽으로 옅게 깔리는 그림자 */}
      <defs>
        <linearGradient id="sil-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PALETTE.stoneDark} stopOpacity="0.16" />
          <stop offset="100%" stopColor={PALETTE.stoneDark} stopOpacity="0.42" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#sil-fade)" />

      {/* 머리와 어깨. 이목구비는 넣지 않는다 */}
      <circle cx="150" cy="152" r="58" fill={PALETTE.inkSoft} />
      <path d="M40 400 C40 292 92 236 150 236 C208 236 260 292 260 400 Z" fill={PALETTE.inkSoft} />

      <text
        x="150"
        y="376"
        textAnchor="middle"
        fontSize="20"
        fill={PALETTE.paperDim}
        opacity="0.85"
      >
        {label}
      </text>
    </svg>
  );
}
