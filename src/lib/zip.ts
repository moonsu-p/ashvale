/**
 * 최소한의 zip 읽기·쓰기.
 *
 * 압축하지 않고 담기만 한다(STORE). 꾸러미에 들어가는 건 WebP 와 JSON 인데
 * WebP 는 이미 압축돼 있고 JSON 은 작다. 라이브러리를 하나 더 넣는 것보다
 * 이쪽이 번들에 이롭다 — §12 성능 목표를 이미 넘고 있다.
 *
 * 파일 이름은 UTF-8 로 쓰고 플래그 비트 11 을 세운다.
 */

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const UTF8_FLAG = 0x0800;

/** Blob 에 그대로 넘길 수 있어야 해서 버퍼 종류를 ArrayBuffer 로 못박는다 */
export type Bytes = Uint8Array<ArrayBuffer>;

export interface ZipEntry {
  name: string;
  data: Bytes;
}

// ── CRC-32 ────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Bytes): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── 쓰기 ──────────────────────────────────────────────────

/** DOS 시각. 부르는 쪽이 시각을 넘긴다 — 여기서 시계를 읽지 않는다 */
function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: day };
}

export function makeZip(entries: ZipEntry[], now: Date): Blob {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(now);

  const locals: Bytes[] = [];
  const centrals: Bytes[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, LOCAL_SIG, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, UTF8_FLAG, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    locals.push(local, entry.data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, CENTRAL_SIG, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, UTF8_FLAG, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);

    offset += local.length + size;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, EOCD_SIG, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...locals, ...centrals, eocd], { type: 'application/zip' });
}

// ── 읽기 ──────────────────────────────────────────────────

export class ZipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZipError';
  }
}

export async function readZip(blob: Blob): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const decoder = new TextDecoder();

  // 끝에서부터 EOCD 를 찾는다. 주석이 붙어 있을 수 있다
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i >= bytes.length - 22 - 0xffff; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError('꾸러미 파일이 아닙니다. 내보내기로 만든 zip 을 골라 주세요.');

  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);

  const out: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(cursor, true) !== CENTRAL_SIG) {
      throw new ZipError('꾸러미가 손상됐습니다. 다른 파일로 다시 시도해 주세요.');
    }
    const compression = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));

    if (compression !== 0) {
      throw new ZipError(`'${name}' 이(가) 압축돼 있습니다. 내보내기로 만든 꾸러미만 읽습니다.`);
    }

    // 지역 헤더에서 실제 데이터 시작점을 다시 잰다. 여분 필드 길이가 다를 수 있다
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;

    out.push({ name, data: bytes.subarray(dataStart, dataStart + size) });
    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return out;
}
