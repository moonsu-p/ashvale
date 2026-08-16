/**
 * 앱 아이콘 생성 — 빌드 도구다. 런타임 코드가 아니다.
 *
 *   npx tsx scripts/make-icons.ts
 *
 * 홈 화면 설치 조건을 채우려면 192·512 PNG가 실제로 있어야 한다.
 * 외부 이미지 라이브러리를 쓰지 않는다. zlib 만으로 PNG를 직접 써넣는다.
 * 색은 팔레트에서만 가져온다.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE } from '../src/data/palette';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../public/icons');

type Rgba = [number, number, number, number];

function hexToRgba(hex: string): Rgba {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    255,
  ];
}

// ── PNG 인코딩 ────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const stride = width * 4;
  // 스캔라인마다 필터 바이트 0을 앞에 붙인다
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 그림 ──────────────────────────────────────────────────

/**
 * 관문 하나. 기둥 둘과 아치, 그 아래 바닥선.
 * 픽셀 게임 아이콘이라 안티에일리어싱을 넣지 않는다 — 가장자리를 딱 끊는다.
 */
function drawIcon(size: number, inset: number): Uint8Array {
  const px = new Uint8Array(size * size * 4);
  const bg = hexToRgba(PALETTE.ink);
  const gate = hexToRgba(PALETTE.gold);
  const ground = hexToRgba(PALETTE.stone);

  const set = (x: number, y: number, c: Rgba) => {
    const i = (y * size + x) * 4;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
    px[i + 3] = c[3];
  };

  // 그림이 놓일 안쪽 사각형. maskable 은 여백을 더 준다
  const pad = Math.round(size * inset);
  const box = size - pad * 2;
  const u = box / 16; // 16칸 격자로 재서 크기마다 같은 비율이 나오게

  const cx = size / 2;
  const archCy = pad + u * 8;
  const rOuter = u * 5;
  const rInner = u * 3;
  const pillarTop = archCy;
  const pillarBottom = pad + u * 13;
  const groundTop = pillarBottom;
  const groundBottom = groundTop + u * 1.2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      set(x, y, bg);

      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - archCy;
      const dist = Math.hypot(dx, dy);

      const inArch = dy <= 0 && dist <= rOuter && dist >= rInner;
      const inPillar =
        y + 0.5 >= pillarTop &&
        y + 0.5 <= pillarBottom &&
        Math.abs(dx) <= rOuter &&
        Math.abs(dx) >= rInner;
      const inGround = y + 0.5 >= groundTop && y + 0.5 <= groundBottom && Math.abs(dx) <= rOuter + u;

      if (inGround) set(x, y, ground);
      if (inArch || inPillar) set(x, y, gate);
    }
  }

  return px;
}

// ── 출력 ──────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, inset: 0.06 },
  { name: 'icon-512.png', size: 512, inset: 0.06 },
  // maskable 은 바깥 20%가 잘려나갈 수 있다. 안전 영역 안에 그림을 넣는다
  { name: 'icon-512-maskable.png', size: 512, inset: 0.2 },
];

for (const t of targets) {
  const png = encodePng(t.size, t.size, drawIcon(t.size, t.inset));
  writeFileSync(resolve(OUT_DIR, t.name), png);
  console.log(`${t.name}  ${t.size}×${t.size}  ${png.length} bytes`);
}
