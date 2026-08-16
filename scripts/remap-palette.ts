/**
 * 팔레트 리맵 + 아틀라스 준비 스크립트
 * 기획서 §10.2 준수. 빌드 전 1회 실행한다. 런타임 코드가 아니다.
 *
 * 실행:  npx tsx scripts/remap-palette.ts
 *
 * 하는 일:
 *  1. raw-assets/ 안의 모든 PNG를 훑는다
 *  2. 각 픽셀을 32색 공용 팔레트의 최근접 색으로 치환한다
 *  3. public/assets/ 에 같은 구조로 내보낸다
 *  4. 원본은 절대 수정하지 않는다 (raw-assets/는 읽기 전용으로 취급)
 *
 * 왜 필요한가: 서로 다른 출처의 타일셋을 섞으면 색온도가 어긋나 룩이 무너진다.
 * 팔레트를 하나로 강제하는 것이 유일한 해결책이다.
 *
 * 의존성:  npm i -D sharp tsx
 */

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative, dirname } from 'node:path';
import sharp from 'sharp';
import { WORLD_HEXES } from '../src/data/palette';

const SRC = 'raw-assets';
const OUT = 'public/assets';

/**
 * 리맵에서 제외할 경로.
 * - characters: 캐릭터 팩은 8색 고정이며 16px이라 리맵하면 뭉갠다.
 *   세계 팔레트를 캐릭터 쪽으로 맞췄으므로 원본 그대로 쓴다 (기획서 §12).
 * - illustration: 그린 느낌이 죽는다.
 */
const SKIP = ['characters', 'illustration'];

/** Kenney 타일셋은 에셋 사이에 1px 간격을 두고 배치된다. 잘라낼 때 반영해야 밀리지 않는다 */
export const KENNEY_SHEET = { tileSize: 16, spacing: 1, margin: 0 } as const;

/** 캐릭터 팩은 간격이 없다. Kenney 값과 공유하지 말 것 (기획서 §12) */
export const CHAR_SHEET_LAYOUT = { frameWidth: 16, frameHeight: 24, spacing: 0, margin: 0 } as const;

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const TARGET: RGB[] = WORLD_HEXES.map(hexToRgb);

/**
 * 최근접 색 매칭. 단순 유클리드 거리가 아니라 가중치를 준다.
 * 사람 눈은 녹색에 민감하고 청색에 둔하므로, 가중 없이 매칭하면
 * 풀색이 흙색으로 넘어가는 사고가 난다.
 */
function nearest(r: number, g: number, b: number): RGB {
  let best = TARGET[0];
  let bestD = Infinity;
  for (const [tr, tg, tb] of TARGET) {
    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (d < bestD) {
      bestD = d;
      best = [tr, tg, tb];
    }
  }
  return best;
}

/** 매칭 결과를 캐시한다. 타일셋은 색 종류가 적어서 적중률이 매우 높다 */
const cache = new Map<number, RGB>();

function nearestCached(r: number, g: number, b: number): RGB {
  const key = (r << 16) | (g << 8) | b;
  const hit = cache.get(key);
  if (hit) return hit;
  const val = nearest(r, g, b);
  cache.set(key, val);
  return val;
}

/**
 * SKIP 에 든 폴더는 통째로 건너뛴다.
 *
 * 이게 빠져 있으면 캐릭터 팩까지 리맵된다 — 16px 에 8색뿐이라 뭉개지고,
 * 15종이 통일 팔레트를 공유한다는 최대 장점이 사라진다 (§12, docs/ASSETS.md).
 */
async function* walk(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP.includes(e.name)) {
        console.log(`  건너뜀: ${join(dir, e.name)}`);
        continue;
      }
      yield* walk(join(dir, e.name));
    } else if (extname(e.name).toLowerCase() === '.png') {
      yield join(dir, e.name);
    }
  }
}

async function remapFile(src: string) {
  const buf = await readFile(src);
  const img = sharp(buf).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    // 완전 투명 픽셀은 건드리지 않는다. 건드리면 외곽에 색 테두리가 생긴다
    if (data[i + 3] === 0) continue;
    const [r, g, b] = nearestCached(data[i], data[i + 1], data[i + 2]);
    if (r !== data[i] || g !== data[i + 1] || b !== data[i + 2]) changed++;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  const rel = relative(SRC, src);
  const dest = join(OUT, rel);
  await mkdir(dirname(dest), { recursive: true });
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ palette: true, compressionLevel: 9 })
    .toFile(dest);

  return { rel, pixels: info.width * info.height, changed };
}

async function main() {
  let files = 0;
  let totalChanged = 0;

  for await (const src of walk(SRC)) {
    const r = await remapFile(src);
    files++;
    totalChanged += r.changed;
    const pct = ((r.changed / r.pixels) * 100).toFixed(1);
    console.log(`  ${r.rel}  (${pct}% 치환)`);
  }

  console.log(`\n파일 ${files}개 처리. 치환 픽셀 ${totalChanged.toLocaleString()}개.`);
  console.log(`고유 색 ${cache.size}개를 세계 팔레트 32색으로 매핑했다.`);
  console.log(`제외 경로: ${SKIP.join(', ')} — 원본 색 유지.`);

  if (cache.size > 400) {
    console.warn(
      '\n경고: 원본의 고유 색이 400개를 넘는다. 사진이나 그라디언트가 섞였을 가능성이 있다.\n' +
        '픽셀아트 타일셋만 raw-assets/ 에 두었는지 확인할 것. 일러스트는 리맵 대상이 아니다.'
    );
  }
}

main().catch((e) => {
  console.error('리맵 실패:', e);
  process.exit(1);
});
