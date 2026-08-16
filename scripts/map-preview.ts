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
import { TILE } from '../src/data/layout';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../docs/assets');

/** fillStyle 과 fillRect 만 있는 최소 캔버스 */
class TinyCtx {
  fillStyle = '#000000';
  readonly data: Uint8Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8Array(width * height * 4);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    const [r, g, b] = parse(this.fillStyle);
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.width, Math.round(x + w));
    const y1 = Math.min(this.height, Math.round(y + h));
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

mkdirSync(OUT, { recursive: true });
const name = isRegion ? `map-region-${arg}.png` : `map-town-era${arg}.png`;
writeFileSync(resolve(OUT, name), encodePng(W, H, ctx.data));
console.log(`${resolve(OUT, name)}  ${W}×${H}  (원본 크기. 게임에서는 ×${TILE.scale})`);
