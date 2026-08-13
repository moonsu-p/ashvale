/**
 * 텍스처 아틀라스 빌더 — §10.6. 빌드 전 실행. 런타임 코드가 아니다.
 *
 * 실행:  npx tsx scripts/build-atlas.ts   (remap-palette.ts 이후에)
 *
 * 하는 일:
 *  1. public/assets/ 의 스프라이트 PNG 들을 하나의 아틀라스로 묶는다 (일러스트·기존 atlas 제외)
 *  2. 프레임 사이에 1px 간격을 둔다 (Kenney 규약과 동일, 샘플링 번짐 방지)
 *  3. public/assets/atlas.png + atlas.json (Phaser JSONHash) 를 낸다
 *
 * 왜: 스프라이트를 텍스처 1장으로 묶으면 드로우콜이 줄어 60fps 예산을 지킨다 (§10.6).
 *
 * 의존성:  npm i -D sharp tsx
 */

import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import sharp from 'sharp';

const DIR = 'public/assets';
const OUT_PNG = join(DIR, 'atlas.png');
const OUT_JSON = join(DIR, 'atlas.json');
const SPACING = 1; // 프레임 사이 간격 (§10.6, ASSETS.md)
const MAX_WIDTH = 1024;

const EXCLUDE_DIRS = new Set(['illustration']);

interface Frame {
  name: string;
  path: string;
  w: number;
  h: number;
  x: number;
  y: number;
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      yield* walk(join(dir, e.name));
    } else if (extname(e.name).toLowerCase() === '.png' && e.name !== 'atlas.png') {
      yield join(dir, e.name);
    }
  }
}

async function main() {
  const frames: Frame[] = [];
  for await (const p of walk(DIR)) {
    const meta = await sharp(p).metadata();
    frames.push({
      name: relative(DIR, p).replace(/\\/g, '/').replace(/\.png$/, ''),
      path: p,
      w: meta.width ?? 0,
      h: meta.height ?? 0,
      x: 0,
      y: 0,
    });
  }

  if (frames.length === 0) {
    console.log('아틀라스로 묶을 스프라이트가 없다. 먼저 remap-palette 로 public/assets/ 를 채울 것.');
    return;
  }

  // 큰 것부터 셸프 패킹 (높이 순)
  frames.sort((a, b) => b.h - a.h);
  let x = 0;
  let y = 0;
  let rowH = 0;
  let sheetW = 0;
  for (const f of frames) {
    if (x + f.w > MAX_WIDTH) {
      x = 0;
      y += rowH + SPACING;
      rowH = 0;
    }
    f.x = x;
    f.y = y;
    x += f.w + SPACING;
    rowH = Math.max(rowH, f.h);
    sheetW = Math.max(sheetW, f.x + f.w);
  }
  const sheetH = y + rowH;

  const composites = await Promise.all(
    frames.map(async (f) => ({ input: await sharp(f.path).png().toBuffer(), left: f.x, top: f.y }))
  );

  await mkdir(DIR, { recursive: true });
  await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(OUT_PNG);

  const json = {
    frames: Object.fromEntries(
      frames.map((f) => [
        f.name,
        { frame: { x: f.x, y: f.y, w: f.w, h: f.h }, rotated: false, trimmed: false, sourceSize: { w: f.w, h: f.h } },
      ])
    ),
    meta: { app: 'ashvale', image: 'atlas.png', size: { w: sheetW, h: sheetH }, scale: '1', spacing: SPACING },
  };
  await writeFile(OUT_JSON, JSON.stringify(json, null, 2));

  console.log(`아틀라스 완성: ${frames.length}개 프레임 → atlas.png (${sheetW}×${sheetH}), atlas.json`);
}

main().catch((e) => {
  console.error('아틀라스 빌드 실패:', e);
  process.exit(1);
});
