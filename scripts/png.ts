/**
 * 최소한의 PNG 읽기·쓰기 — 빌드 도구다. 런타임 코드가 아니다.
 * 스크립트 여러 개가 쓰므로 여기 모아 둔다.
 */

import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

export interface Bitmap {
  width: number;
  height: number;
  /** RGBA */
  data: Uint8Array;
}

function readChunks(buf: Buffer): { type: string; data: Buffer }[] {
  const out: { type: string; data: Buffer }[] = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    out.push({ type: buf.toString('ascii', p + 4, p + 8), data: buf.subarray(p + 8, p + 8 + len) });
    p += 12 + len;
  }
  return out;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function decodePng(file: string): Bitmap {
  const chunks = readChunks(readFileSync(file));
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (ihdr === undefined) throw new Error(`${file}: IHDR 없음`);

  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const depth = ihdr.data[8] ?? 8;
  const colorType = ihdr.data[9] ?? 6;
  if (depth !== 8) throw new Error(`${file}: 8비트 깊이만 읽는다 (${depth})`);

  const palette = chunks.find((c) => c.type === 'PLTE')?.data;
  const trns = chunks.find((c) => c.type === 'tRNS')?.data;
  const raw = inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const stride = width * channels;
  const lines = new Uint8Array(stride * height);

  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++] ?? 0;
    for (let x = 0; x < stride; x++) {
      const cur = raw[pos + x] ?? 0;
      const left = x >= channels ? (lines[y * stride + x - channels] ?? 0) : 0;
      const up = y > 0 ? (lines[(y - 1) * stride + x] ?? 0) : 0;
      const upLeft = y > 0 && x >= channels ? (lines[(y - 1) * stride + x - channels] ?? 0) : 0;
      let v = cur;
      if (filter === 1) v = cur + left;
      else if (filter === 2) v = cur + up;
      else if (filter === 3) v = cur + ((left + up) >> 1);
      else if (filter === 4) v = cur + paeth(left, up, upLeft);
      lines[y * stride + x] = v & 0xff;
    }
    pos += stride;
  }

  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const d = i * 4;
    if (colorType === 3) {
      const idx = lines[s] ?? 0;
      data[d] = palette?.[idx * 3] ?? 0;
      data[d + 1] = palette?.[idx * 3 + 1] ?? 0;
      data[d + 2] = palette?.[idx * 3 + 2] ?? 0;
      data[d + 3] = trns?.[idx] ?? 255;
    } else if (colorType === 6) {
      data[d] = lines[s] ?? 0;
      data[d + 1] = lines[s + 1] ?? 0;
      data[d + 2] = lines[s + 2] ?? 0;
      data[d + 3] = lines[s + 3] ?? 0;
    } else if (colorType === 2) {
      data[d] = lines[s] ?? 0;
      data[d + 1] = lines[s + 1] ?? 0;
      data[d + 2] = lines[s + 2] ?? 0;
      data[d + 3] = 255;
    } else {
      const g = lines[s] ?? 0;
      data[d] = g;
      data[d + 1] = g;
      data[d + 2] = g;
      data[d + 3] = colorType === 4 ? (lines[s + 1] ?? 255) : 255;
    }
  }

  return { width, height, data };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (const byte of b) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
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

export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
