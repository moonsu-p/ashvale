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

import { readdir, mkdir, readFile, copyFile } from 'node:fs/promises';
import { join, extname, relative, dirname } from 'node:path';
import sharp from 'sharp';
import { PALETTE_HEXES } from '../src/data/palette';

const SRC = 'raw-assets';
const OUT = 'public/assets';

/** 일러스트는 팔레트 리맵 대상이 아니다 (§11.1). 이 디렉터리는 그대로 복사한다. */
const ILLUSTRATION_DIR = 'illustration';

function isIllustration(rel: string): boolean {
  return rel.split(/[\\/]/).includes(ILLUSTRATION_DIR);
}

/** Kenney 타일셋은 에셋 사이에 1px 간격을 두고 배치된다. 잘라낼 때 반영해야 밀리지 않는다 */
export const KENNEY_SHEET = { tileSize: 16, spacing: 1, margin: 0 } as const;

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const TARGET: RGB[] = PALETTE_HEXES.map(hexToRgb);

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

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // 디렉터리가 없으면(원본 미배치) 조용히 넘어간다
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else {
      const ext = extname(e.name).toLowerCase();
      if (ext === '.png' || ext === '.webp') yield p;
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
    // palette:true 는 재양자화로 팔레트 밖 색을 만든다. 정확한 팔레트 색을 보존하려면 쓰지 않는다.
    .png({ compressionLevel: 9 })
    .toFile(dest);

  return { rel, pixels: info.width * info.height, changed };
}

async function main() {
  let files = 0;
  let copied = 0;
  let totalChanged = 0;

  for await (const src of walk(SRC)) {
    const rel = relative(SRC, src);
    if (isIllustration(rel)) {
      // 일러스트: 리맵하지 않고 그대로 복사 (§11.1)
      const dest = join(OUT, rel);
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
      copied++;
      console.log(`  ${rel}  (일러스트, 복사)`);
      continue;
    }
    if (extname(src).toLowerCase() !== '.png') continue; // 리맵은 PNG 타일셋만
    const r = await remapFile(src);
    files++;
    totalChanged += r.changed;
    const pct = ((r.changed / r.pixels) * 100).toFixed(1);
    console.log(`  ${r.rel}  (${pct}% 치환)`);
  }

  console.log(`\n타일셋 ${files}개 리맵, 일러스트 ${copied}개 복사. 치환 픽셀 ${totalChanged.toLocaleString()}개.`);
  console.log(`고유 색 ${cache.size}개를 팔레트 32색으로 매핑했다.`);

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
