/**
 * 상태 보관과 액션.
 *
 * 규칙 계산은 여기서 하지 않는다 — systems/ 의 순수 함수를 부르고 결과를 담기만 한다.
 * 입력은 Phaser -> 콜백 -> 여기 액션 순서로만 흐른다.
 */

import { create } from 'zustand';
import type { Dir, GameState, Ledger } from '@/types/game';
import type { SaveReason } from '@/data/save';
import { newGame, newLedger } from '@/systems/newGame';
import { getStorage, loadGame, saveAll, StorageError } from '@/storage';

export type BootStatus = 'booting' | 'empty' | 'ready' | 'failed';

interface GameStore {
  status: BootStatus;
  state: GameState | null;
  ledger: Ledger;
  /** 세이브를 쓸 수 없을 때 사람이 읽을 이유. 무엇을 하면 되는지 담는다 */
  error: string | null;
  /** 마이그레이션이 실패해 원본을 옮겨 둔 자리 */
  backupKey: string | null;
  /** 이전 판에서 올라온 세이브면 그 판 번호 */
  migratedFrom: number | null;
  /** navigator.storage.persist() 승인 여부 */
  persisted: boolean;
  /** 하단 상호작용 문구. 씬이 올려 준다. 저장하지 않는다 */
  prompt: string | null;

  boot: () => Promise<void>;
  startNewGame: (opts?: { heroName?: string; townName?: string }) => Promise<void>;
  save: (reason: SaveReason) => Promise<void>;
  requestPersistence: () => Promise<void>;

  setPrompt: (label: string | null) => void;
  /** 방향만 바꾼다 */
  faceHero: (dir: Dir) => void;
  /** 한 칸 옮긴다 */
  stepHero: (to: { x: number; y: number }, dir: Dir) => void;
}

/**
 * 걸음마다 저장하면 140ms 간격으로 localStorage 를 두드리게 된다.
 * 발이 멈추고 조금 지난 뒤 한 번만 쓴다.
 */
const SETTLE_MS = 800;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

function describe(err: unknown): string {
  if (err instanceof StorageError) return err.message;
  if (err instanceof Error) return err.message;
  return '알 수 없는 문제가 생겼다. 앱을 다시 열어라.';
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'booting',
  state: null,
  ledger: newLedger(),
  error: null,
  backupKey: null,
  migratedFrom: null,
  persisted: false,
  prompt: null,

  async boot() {
    const storage = getStorage();
    try {
      const outcome = await loadGame(storage, Date.now());
      switch (outcome.kind) {
        case 'loaded':
          set({
            status: 'ready',
            state: outcome.state,
            ledger: outcome.ledger,
            error: null,
            backupKey: null,
            migratedFrom: outcome.migratedFrom,
          });
          break;
        case 'empty':
          set({ status: 'empty', state: null, ledger: outcome.ledger, error: null });
          break;
        case 'failed':
          // 덮어쓰지 않는다. 원본은 backupKey 에 있다
          set({
            status: 'failed',
            state: null,
            ledger: outcome.ledger,
            error: outcome.message,
            backupKey: outcome.backupKey,
          });
          break;
      }
    } catch (err) {
      set({ status: 'failed', error: describe(err) });
    }

    set({ persisted: await storage.isPersisted() });
  },

  async startNewGame(opts) {
    const state = newGame({
      now: Date.now(),
      ...(opts?.heroName !== undefined ? { heroName: opts.heroName } : {}),
      ...(opts?.townName !== undefined ? { townName: opts.townName } : {}),
    });
    set({ status: 'ready', state, error: null, backupKey: null, migratedFrom: null });

    // 새 게임은 사용자 조작으로 시작된다. 지속 저장을 요청하기 좋은 자리다 (§14)
    await get().requestPersistence();
    await get().save('manual');
  },

  async save(_reason) {
    const { state } = get();
    if (state === null) return;
    try {
      const ledger = await saveAll(getStorage(), state);
      set({ ledger, error: null });
    } catch (err) {
      set({ error: describe(err) });
    }
  },

  async requestPersistence() {
    const storage = getStorage();
    const granted = await storage.requestPersistence();
    set({ persisted: granted || (await storage.isPersisted()) });
  },

  setPrompt(label) {
    if (get().prompt !== label) set({ prompt: label });
  },

  faceHero(dir) {
    const { state } = get();
    if (state === null || state.world.heroTile.dir === dir) return;
    set({
      state: {
        ...state,
        world: { ...state.world, heroTile: { ...state.world.heroTile, dir } },
      },
    });
    scheduleSettleSave(get);
  },

  stepHero(to, dir) {
    const { state } = get();
    if (state === null) return;
    set({
      state: {
        ...state,
        world: { ...state.world, heroTile: { x: to.x, y: to.y, dir } },
      },
    });
    scheduleSettleSave(get);
  },
}));

/**
 * 어디에 서 있는지는 세이브의 일부다 (§4). 다만 걸음마다 쓰지는 않는다 —
 * 발이 멎고 SETTLE_MS 뒤에 한 번만 쓴다.
 */
function scheduleSettleSave(get: () => GameStore): void {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    void get().save('map-change');
  }, SETTLE_MS);
}
