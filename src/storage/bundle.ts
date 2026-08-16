/**
 * 꾸러미 내보내기·불러오기 (§14).
 *
 *   save.json
 *   ledger.json
 *   images/companion_{id}_slot_{n}.webp
 *
 * 배포 주소가 바뀌면 세이브가 따라오지 않는다. 꾸러미가 유일한 이사 수단이다.
 * 압축 과정에서 공유 저장 영역에 임시 파일을 만들지 않는다 (§9.2) —
 * 전부 메모리에서 만들고 Blob 하나로 넘긴다.
 */

import type { GameState, Ledger } from '@/types/game';
import { imageFileName, imageKey } from '@/data/images';
import { makeZip, readZip, ZipError, type ZipEntry } from '@/lib/zip';
import { migrate } from './migrate';
import { loadLedger, saveGame, saveLedger } from './persist';
import { mergeLedger } from '@/systems/ledger';
import type { StorageAdapter } from './StorageAdapter';

const SAVE_NAME = 'save.json';
const LEDGER_NAME = 'ledger.json';
const IMAGE_PREFIX = 'images/';

const encoder = new TextEncoder();

export async function exportBundle(
  adapter: StorageAdapter,
  state: GameState,
  now: Date,
): Promise<Blob> {
  const ledger = await loadLedger(adapter);

  const entries: ZipEntry[] = [
    { name: SAVE_NAME, data: encoder.encode(JSON.stringify(state)) },
    { name: LEDGER_NAME, data: encoder.encode(JSON.stringify(ledger)) },
  ];

  // 인물 이미지. 참조가 아니라 바이트를 담는다
  for (const companion of Object.values(state.companions)) {
    for (const [slotText, key] of Object.entries(companion.images)) {
      if (key === null) continue;
      const blob = await adapter.getImage(key);
      if (blob === null) continue;
      entries.push({
        name: imageFileName(companion.id, Number(slotText)),
        data: new Uint8Array(await blob.arrayBuffer()),
      });
    }
  }

  return makeZip(entries, now);
}

export type ImportOutcome =
  | { kind: 'ok'; state: GameState; ledger: Ledger; images: number }
  | { kind: 'failed'; message: string };

/**
 * 꾸러미를 되돌린다.
 *
 * 원장은 **덮어쓰지 않고 합친다.** 오래된 꾸러미를 불러와도 도달한 최대치가
 * 내려가면 안 된다 (§14).
 */
export async function importBundle(adapter: StorageAdapter, file: Blob): Promise<ImportOutcome> {
  let entries: ZipEntry[];
  try {
    entries = await readZip(file);
  } catch (err) {
    return {
      kind: 'failed',
      message: err instanceof ZipError ? err.message : '꾸러미를 읽지 못했습니다.',
    };
  }

  const byName = new Map(entries.map((e) => [e.name, e]));
  const decoder = new TextDecoder();

  const saveEntry = byName.get(SAVE_NAME);
  if (saveEntry === undefined) {
    return { kind: 'failed', message: `꾸러미에 ${SAVE_NAME} 이 없습니다.` };
  }

  const migrated = migrate(decoder.decode(saveEntry.data));
  if (!migrated.ok) return { kind: 'failed', message: migrated.message };
  const state = migrated.state;

  // 원장 — 없으면 지금 것을 그대로 둔다
  const current = await loadLedger(adapter);
  let ledger = current;
  const ledgerEntry = byName.get(LEDGER_NAME);
  if (ledgerEntry !== undefined) {
    try {
      const raw = JSON.parse(decoder.decode(ledgerEntry.data)) as Partial<Ledger>;
      ledger = mergeLedger(current, {
        ledgerVersion: current.ledgerVersion,
        maxTurnReached: typeof raw.maxTurnReached === 'number' ? raw.maxTurnReached : 0,
        collapses: typeof raw.collapses === 'number' ? raw.collapses : 0,
        lastCollapseTurn: typeof raw.lastCollapseTurn === 'number' ? raw.lastCollapseTurn : null,
      });
    } catch {
      // 원장이 깨졌어도 세이브는 살린다
      ledger = current;
    }
  }

  // 이미지. 키를 다시 계산해서 세이브의 참조와 반드시 맞춘다
  let images = 0;
  for (const entry of entries) {
    if (!entry.name.startsWith(IMAGE_PREFIX) || !entry.name.endsWith('.webp')) continue;
    const stem = entry.name.slice(IMAGE_PREFIX.length, -'.webp'.length);
    const match = /^companion_(.+)_slot_(\d+)$/.exec(stem);
    if (match === null) continue;

    const [, companionId, slotText] = match;
    if (companionId === undefined || slotText === undefined) continue;

    const key = imageKey(companionId, Number(slotText));
    // subarray 는 원본 버퍼를 공유한다. Blob 으로 만들며 잘라 담는다
    await adapter.putImage(key, new Blob([entry.data.slice()], { type: 'image/webp' }));
    images += 1;
  }

  await saveGame(adapter, state);
  await saveLedger(adapter, ledger);

  return { kind: 'ok', state, ledger, images };
}
