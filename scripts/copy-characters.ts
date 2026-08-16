/**
 * 캐릭터 팩을 사용본 자리로 옮긴다 — 빌드 도구다. 런타임 코드가 아니다.
 *
 *   npx tsx scripts/copy-characters.ts
 *
 *   raw-assets/characters/1..15.png  ->  public/assets/characters/01..15.png
 *
 * **바이트를 그대로 복사한다.** 다시 인코딩하지 않는다.
 * 투명 픽셀이 마젠타(255,0,255)에 알파 0으로 저장돼 있어서, 알파를 평탄화하는
 * 변환을 한 번이라도 거치면 분홍이 드러난다 (docs/ASSETS.md).
 *
 * 캐릭터 팩은 팔레트 리맵 대상이 아니다. 그래서 복사가 파이프라인의 전부다.
 */

import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(HERE, '../raw-assets/characters');
const OUT_DIR = resolve(HERE, '../public/assets/characters');

/** 팩에 든 장수. 기획서 §12 배역 배정표가 이 번호를 그대로 쓴다 */
const COUNT = 15;

mkdirSync(OUT_DIR, { recursive: true });

let copied = 0;
const missing: string[] = [];

for (let n = 1; n <= COUNT; n++) {
  const src = resolve(SRC_DIR, `${n}.png`);
  if (!existsSync(src)) {
    missing.push(`${n}.png`);
    continue;
  }
  const out = resolve(OUT_DIR, `${String(n).padStart(2, '0')}.png`);
  copyFileSync(src, out);
  copied += 1;
}

console.log(`${copied}/${COUNT}장 복사 -> public/assets/characters/`);

if (missing.length > 0) {
  console.error(
    `없는 파일: ${missing.join(', ')}\n` +
      `raw-assets/characters/ 바로 아래에 1.png ~ ${COUNT}.png 를 두어라. ` +
      `zip이 pack/ 으로 한 겹 감싸 있으면 꺼내야 한다.`,
  );
  process.exitCode = 1;
}
