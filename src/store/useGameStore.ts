/**
 * 단일 zustand 스토어가 GameState 를 소유한다 (§0, §10.3).
 * Phaser 는 상태를 소유하지 않고 읽기만 한다. 입력은 Phaser → 콜백 → 여기 액션으로만 흐른다.
 *
 * M0 범위: 부팅(로드/생성/복원), 새 연대기 시작, 저장 오류 배너, 지속성 요청.
 * 턴 진행·건설 등 규칙 액션은 이후 마일스톤에서 순수 함수(src/systems)를 통해 추가한다.
 */

import { create } from 'zustand';
import type { GameState, Ledger } from '@/types/game';
import { createInitialState } from '@/systems/newGame';
import { endTurn, type TurnAction } from '@/systems/turn';
import { createRng } from '@/systems/rng';
import { storage, StorageError } from '@/storage';
import { requestPersistentStorage, type PersistStatus } from '@/storage/persist';

type BootStatus = 'idle' | 'loading' | 'ready' | 'error';

interface GameStore {
  state: GameState | null;
  ledger: Ledger | null;
  status: BootStatus;
  /** 저장/불러오기 실패 배너 (조용히 넘기지 않는다, §12) */
  storageBanner: string | null;
  persist: PersistStatus | null;

  boot: () => Promise<void>;
  newChronicle: (heroName?: string) => Promise<void>;
  dismissBanner: () => void;

  /**
   * 상태를 변경하고 자동 저장한다. 모든 규칙 액션은 이 게이트를 통과한다.
   * mutator 는 새 GameState 를 반환하는 순수 변환이어야 한다.
   */
  commit: (mutator: (s: GameState) => GameState) => Promise<void>;

  /** 턴 종료(§2 8단계)를 실행하고 저장한다. RNG 는 재현 가능하게 시드한다. */
  takeTurn: (action: TurnAction) => Promise<void>;
}

/** now 주입: 규칙은 순수 함수라 시각을 밖에서 넣는다. 여기(스토어)는 경계라 Date 사용 허용. */
const now = () => Date.now();

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  ledger: null,
  status: 'idle',
  storageBanner: null,
  persist: null,

  boot: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });

    // 지속 저장 요청은 병렬로 진행 (결과는 설정 표시용)
    void requestPersistentStorage().then((p) => set({ persist: p }));

    try {
      let state = await storage.loadState();
      if (!state) {
        state = createInitialState(now());
        await storage.saveState(state);
      }
      const ledger = await storage.mergeLedger({ maxTurnReached: state.world.turn });
      set({ state, ledger, status: 'ready' });
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '저장소 초기화에 실패했습니다.';
      set({ status: 'error', storageBanner: msg });
    }
  },

  newChronicle: async (heroName = '') => {
    try {
      // 기존 세이브 백업 + 원장 초기화 (§12.7a 규칙 4)
      await storage.backupCurrentSave();
      await storage.resetLedger();
      const state = createInitialState(now(), heroName);
      await storage.saveState(state);
      const ledger = await storage.mergeLedger({ maxTurnReached: 0 });
      set({ state, ledger, status: 'ready', storageBanner: null });
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '새 연대기 시작에 실패했습니다.';
      set({ storageBanner: msg });
    }
  },

  commit: async (mutator) => {
    const cur = get().state;
    if (!cur) return;
    const next = mutator(cur);
    set({ state: next });
    try {
      await storage.saveState(next);
      const ledger = await storage.mergeLedger({ maxTurnReached: next.world.turn });
      set({ ledger });
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '자동 저장에 실패했습니다.';
      set({ storageBanner: msg });
    }
  },

  takeTurn: async (action) => {
    await get().commit((s) => {
      const rng = createRng(`${s.createdAt}:turn:${s.world.turn}`);
      return endTurn(s, action, rng).state;
    });
  },

  dismissBanner: () => set({ storageBanner: null }),
}));
