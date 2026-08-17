/**
 * 마을 지도를 그림 파일로 뽑는다 — 빌드 도구다.
 *
 *   npx tsx scripts/map-preview.ts [시대]
 *
 * 지형 렌더러는 캔버스의 `fillStyle` 과 `fillRect` 만 쓴다.
 * 그래서 그 둘만 흉내 내는 껍데기를 만들어 주면 브라우저 없이도 같은 그림이 나온다.
 * 지형을 손볼 때 게임을 켰다 껐다 하지 않고 바로 볼 수 있다.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng } from './png';
import { buildTownMap } from '../src/data/maps/town';
import { buildRegionMap } from '../src/data/maps/region';
import { paintMapCanvas } from '../src/render/terrain';
import { drawEventMarker, drawLootMarker } from '../src/render/markers';
import { TILE } from '../src/data/layout';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../docs/assets');

/** fillStyle 과 fillRect 만 있는 최소 캔버스 */
class TinyCtx {
  fillStyle = '#000000';
  readonly data: Uint8Array;
  /** 표식처럼 0,0 기준으로 그리는 것을 옮겨 붙일 때 쓴다 */
  ox = 0;
  oy = 0;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8Array(width * height * 4);
  }

  clearRect(): void {
    // 표식은 투명 배경을 전제로 그린다. 여기서는 지도 위에 얹으므로 아무것도 안 한다
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    const [r, g, b] = parse(this.fillStyle);
    const x0 = Math.max(0, Math.round(x + this.ox));
    const y0 = Math.max(0, Math.round(y + this.oy));
    const x1 = Math.min(this.width, Math.round(x + w + this.ox));
    const y1 = Math.min(this.height, Math.round(y + h + this.oy));
    for (let py = y0; py < y1; py++) {
      for (let pxx = x0; pxx < x1; pxx++) {
        const i = (py * this.width + pxx) * 4;
        this.data[i] = r;
        this.data[i + 1] = g;
        this.data[i + 2] = b;
        this.data[i + 3] = 255;
      }
    }
  }
}

const cache = new Map<string, [number, number, number]>();
function parse(hex: string): [number, number, number] {
  const hit = cache.get(hex);
  if (hit !== undefined) return hit;
  const s = hex.replace('#', '');
  const v: [number, number, number] = [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
  cache.set(hex, v);
  return v;
}

const arg = process.argv[2] ?? '0';
const isRegion = Number.isNaN(Number(arg));

const map = isRegion
  ? buildRegionMap(arg)
  : buildTownMap({
      eraIndex: Number(arg),
      // 성벽을 세우지 않은 상태. 테두리가 나무라 숲도 함께 보인다
      buildings: { hall: 4, lumber: 2, farm: 1, quarry: 1 },
    });

const W = map.width * TILE.source;
const H = map.height * TILE.source;
const ctx = new TinyCtx(W, H);

paintMapCanvas(
  ctx as unknown as CanvasRenderingContext2D,
  map.width,
  map.height,
  map.ground,
  map.deco,
);

// 사건 노드 표식을 지도 위에 얹는다 — 게임에서도 이 자리에 선다
for (const obj of map.objects) {
  if (obj.nodeKind === undefined) continue;
  ctx.ox = obj.x * TILE.source;
  ctx.oy = obj.y * TILE.source;
  const draw = obj.nodeKind === 'loot' ? drawLootMarker : drawEventMarker;
  draw(ctx as unknown as CanvasRenderingContext2D);
}
ctx.ox = 0;
ctx.oy = 0;

mkdirSync(OUT, { recursive: true });
const name = isRegion ? `map-region-${arg}.png` : `map-town-era${arg}.png`;
writeFileSync(resolve(OUT, name), encodePng(W, H, ctx.data));
console.log(`${resolve(OUT, name)}  ${W}×${H}  (원본 크기. 게임에서는 ×${TILE.scale})`);
