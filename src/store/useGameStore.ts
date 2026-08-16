/**
 * 상태 보관과 액션.
 *
 * 규칙 계산은 여기서 하지 않는다 — systems/ 의 순수 함수를 부르고 결과를 담기만 한다.
 * 입력은 Phaser -> 콜백 -> 여기 액션 순서로만 흐른다.
 */

import { create } from 'zustand';
import type { Dir, GameState, Ledger, ResourceId } from '@/types/game';
import type { DialogueScript, DialogueState } from '@/types/dialogue';
import type { SaveReason } from '@/data/save';
import { newGame, newLedger, seedOf } from '@/systems/newGame';
import { build, blockMessage } from '@/systems/construction';
import { endWeek } from '@/systems/week';
import { appendEntries, makeEntry } from '@/systems/chronicle';
import { createRng } from '@/systems/rng';
import { getBuilding } from '@/data/buildings';
import { CHRONICLE_TEXT } from '@/data/chronicle';
import { DOWNED, getRegion, regionIdFromMap, regionMapId } from '@/data/regions';
import { REGION_ENTRY } from '@/data/maps/region';
import { REGION_TEXT } from '@/data/content/region-text';
import { START_HERO_TILE } from '@/data/start';
import { resolveExplore, rollExplore, type ExploreOutcome } from '@/systems/explore';
import { gainXp, type LevelUp } from '@/systems/progression';
import { getRelic, rollRelic } from '@/systems/relics';
import { applyToken } from '@/systems/korean';
import { encodeForSlot } from '@/systems/imagePipeline';
import { imageKey } from '@/data/images';
import {
  exportBundle as buildBundle,
  importBundle as restoreBundle,
} from '@/storage/bundle';

/** 판정 연출이 보여 줄 것 */
export interface ExploreView {
  regionId: string;
  outcome: ExploreOutcome;
  narration: string;
  levelUp: LevelUp | null;
  relicName: string | null;
  relicFound: string | null;
}
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

  /** 대화 레이어. 열려 있으면 필드 입력이 멈춘다 */
  dialogue: DialogueState | null;
  openDialogue: (script: DialogueScript) => void;
  /** A 또는 대사창 탭. §8.3 의 상태 기계를 한 칸 민다 */
  advanceDialogue: () => void;
  /** 타이핑이 끝났다. 대기(▼)로만 넘긴다 — 여러 번 불려도 같은 결과여야 한다 */
  finishTyping: () => void;
  chooseDialogue: (optionId: string) => void;
  closeDialogue: () => void;

  /** 상단 HUD 를 눌러 여는 메뉴 (§5) */
  menu: 'companions' | 'chronicle' | 'bundle' | null;
  openMenu: (tab: 'companions' | 'chronicle' | 'bundle') => void;
  closeMenu: () => void;

  /** 인물 이미지 — 고른 즉시 WebP 로 다시 구워 저장한다 (§9.1) */
  putImage: (companionId: string, slot: number, file: File) => Promise<void>;
  clearImage: (companionId: string, slot: number) => Promise<void>;
  /** 꾸러미 내보내기. Blob 을 돌려주면 화면이 내려받기를 건다 */
  exportBundle: () => Promise<Blob | null>;
  importBundle: (file: Blob) => Promise<void>;

  /** 지역 선택 화면이 열려 있는가 */
  regionSelect: boolean;
  /** 판정 연출 중인 결과. 닫아야 다시 걸을 수 있다 */
  explore: ExploreView | null;
  /** 이번 탐사에서 이미 밟은 노드. 세이브에 넣지 않는다 */
  clearedNodes: string[];

  openRegionSelect: () => void;
  closeRegionSelect: () => void;
  /** 지역으로 나간다. 이때 1주가 소모된다 (§11) */
  enterRegion: (regionId: string) => void;
  /** 마을로 돌아온다. 추가 시간 소모 없음 */
  leaveRegion: () => void;
  /** 노드를 밟았다 → 판정 */
  stepNode: (nodeId: string) => void;
  closeExplore: () => void;

  /** 열려 있는 건설·증축 패널의 건물 id */
  buildPanel: string | null;
  openBuildPanel: (buildingId: string) => void;
  closeBuildPanel: () => void;
  /** 한 단계 올린다. 시간은 흐르지 않는다 (§10) */
  raiseBuilding: (buildingId: string) => void;
  /** 주 종료. §3 의 8단계를 돈다 */
  endWeek: () => void;

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
  dialogue: null,
  buildPanel: null,
  regionSelect: false,
  explore: null,
  clearedNodes: [],
  menu: null,

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

  openDialogue(script) {
    if (script.lines.length === 0) return;
    set({ dialogue: { script, lineIndex: 0, phase: 'typing', reply: null } });
  },

  /**
   * §8.3: 닫힘 → 열림(타이핑) → 대기(▼) → [다음 줄 | 선택지 | 닫힘]
   * 선택지가 떠 있을 때 A 는 아무 동작도 하지 않는다. 반드시 탭으로 고른다.
   */
  advanceDialogue() {
    const d = get().dialogue;
    if (d === null) return;

    if (d.phase === 'choosing') return;

    // 타이핑 중이면 먼저 전체를 보여 준다
    if (d.phase === 'typing') {
      set({ dialogue: { ...d, phase: 'waiting' } });
      return;
    }

    // 마무리 대사를 보고 있었으면 여기서 닫는다
    if (d.reply !== null) {
      set({ dialogue: null });
      return;
    }

    if (d.lineIndex < d.script.lines.length - 1) {
      set({ dialogue: { ...d, lineIndex: d.lineIndex + 1, phase: 'typing' } });
      return;
    }

    const choices = d.script.choices;
    if (choices !== undefined && choices.length > 0) {
      set({ dialogue: { ...d, phase: 'choosing' } });
      return;
    }

    set({ dialogue: null });
  },

  /**
   * 다 찍혔다는 신호. `advanceDialogue` 를 쓰면 안 된다 —
   * 그건 한 칸 미는 동작이라 두 번 불리면 줄을 건너뛴다.
   */
  finishTyping() {
    const d = get().dialogue;
    if (d === null || d.phase !== 'typing') return;
    set({ dialogue: { ...d, phase: 'waiting' } });
  },

  chooseDialogue(optionId) {
    const d = get().dialogue;
    if (d === null || d.phase !== 'choosing') return;

    const option = d.script.choices?.find((c) => c.id === optionId);
    // 마무리 대사가 없으면 고르는 즉시 닫힌다
    if (option === undefined || option.reply === '') {
      set({ dialogue: null });
      return;
    }
    set({ dialogue: { ...d, phase: 'typing', reply: option.reply } });
  },

  closeDialogue() {
    set({ dialogue: null });
  },

  openMenu(tab) {
    set({ menu: tab });
  },

  closeMenu() {
    set({ menu: null });
  },

  async putImage(companionId, slot, file) {
    const { state } = get();
    if (state === null) return;

    try {
      const encoded = await encodeForSlot(file, slot);
      const key = imageKey(companionId, slot);
      // 저장하는 건 다시 구운 바이트뿐이다. 원본을 가리키는 값은 남기지 않는다 (§9.1)
      await getStorage().putImage(key, encoded.blob);

      const companion = state.companions[companionId];
      if (companion === undefined) return;

      set({
        state: {
          ...state,
          companions: {
            ...state.companions,
            [companionId]: { ...companion, images: { ...companion.images, [slot]: key } },
          },
        },
        error: null,
      });
      void get().save('relationship');
    } catch (err) {
      set({ error: describe(err) });
    }
  },

  async clearImage(companionId, slot) {
    const { state } = get();
    if (state === null) return;
    const companion = state.companions[companionId];
    if (companion === undefined) return;

    try {
      await getStorage().removeImage(imageKey(companionId, slot));
    } catch {
      // 지우기가 실패해도 참조는 끊는다. 남은 바이트는 다음 저장에서 덮인다
    }

    const images = { ...companion.images };
    delete images[slot];
    set({
      state: {
        ...state,
        companions: { ...state.companions, [companionId]: { ...companion, images } },
      },
    });
    void get().save('relationship');
  },

  async exportBundle() {
    const { state } = get();
    if (state === null) return null;
    try {
      return await buildBundle(getStorage(), state, new Date());
    } catch (err) {
      set({ error: describe(err) });
      return null;
    }
  },

  async importBundle(file) {
    const outcome = await restoreBundle(getStorage(), file);
    if (outcome.kind === 'failed') {
      set({ error: outcome.message });
      return;
    }
    set({
      status: 'ready',
      state: outcome.state,
      ledger: outcome.ledger,
      error: null,
      menu: null,
      clearedNodes: [],
      explore: null,
      dialogue: null,
    });
  },

  openRegionSelect() {
    set({ regionSelect: true });
  },

  closeRegionSelect() {
    set({ regionSelect: false });
  },

  enterRegion(regionId) {
    const { state } = get();
    if (state === null) return;

    // 1. 1주 소모 (§11). 마을 활동은 시간을 쓰지 않지만 나가는 것은 쓴다
    const { state: afterWeek } = endWeek(state, {}, createRng(seedOf(state) + state.world.turn));

    // 2. 지역 맵 진입
    set({
      state: {
        ...afterWeek,
        world: {
          ...afterWeek.world,
          currentMap: regionMapId(regionId),
          heroTile: { ...REGION_ENTRY },
        },
      },
      regionSelect: false,
      clearedNodes: [],
      explore: null,
    });
    void get().save('map-change');
  },

  leaveRegion() {
    const { state } = get();
    if (state === null) return;
    set({
      state: {
        ...state,
        world: { ...state.world, currentMap: 'town', heroTile: { ...START_HERO_TILE } },
      },
      clearedNodes: [],
      explore: null,
    });
    void get().save('map-change');
  },

  stepNode(nodeId) {
    const { state, clearedNodes } = get();
    if (state === null || clearedNodes.includes(nodeId)) return;

    const regionId = regionIdFromMap(state.world.currentMap);
    if (regionId === null) return;
    const region = getRegion(regionId);
    if (region === undefined) return;

    // 같은 노드를 두 번 밟아도 판정은 한 번이다
    const rng = createRng(`${seedOf(state)}:${state.world.turn}:${nodeId}`);

    const roll = rollExplore(state, region, rng);
    const outcome = resolveExplore(state, region, roll, rng, (r) => rollRelic(state, r)?.id ?? null);

    // 서술은 콘텐츠에서 가져온다. 새로 쓰지 않는다 (§11)
    const pool = REGION_TEXT[regionId]?.lines[roll.grade] ?? [];
    const narration = applyToken(rng.pick(pool) ?? '', '{거점}', state.town.name);

    // 전리품·경험치·피해
    let next: GameState = { ...state, resources: { ...state.resources } };
    for (const [key, amount] of Object.entries(outcome.loot)) {
      next.resources[key as ResourceId] += amount;
    }
    next.hero = { ...next.hero, hp: Math.max(0, next.hero.hp - outcome.hpLoss) };

    const relic = outcome.relicId === null ? null : getRelic(outcome.relicId);
    if (relic !== null && relic !== undefined) {
      next.hero = { ...next.hero, relics: [...next.hero.relics, relic.id] };
    }

    const gained = gainXp(next, outcome.xp);
    next = gained.state;
    next = {
      ...next,
      counters: { ...next.counters, expeditions: next.counters.expeditions + 1 },
    };

    // 연대기에 남는다. 서술은 콘텐츠 문장 그대로
    const lines = [narration];
    if (relic !== null && relic !== undefined) lines.push(relic.found);
    const entries = lines
      .filter((t) => t !== '')
      .map((text, i) => makeEntry(next.world.turn, next.chronicle.length + i, text));
    next = { ...next, chronicle: appendEntries(next.chronicle, entries) };

    set({
      state: next,
      clearedNodes: [...clearedNodes, nodeId],
      explore: {
        regionId,
        outcome,
        narration,
        levelUp: gained.levelUp,
        relicName: relic?.name ?? null,
        relicFound: relic?.found ?? null,
      },
    });
    void get().save('turn-end');
  },

  closeExplore() {
    const { state } = get();
    set({ explore: null });

    // HP 가 0이면 강제 복귀 (§11). 죽지는 않는다
    if (state !== null && state.hero.hp <= 0) {
      const gold = Math.round(state.resources.gold * (1 - DOWNED.goldLossPercent));
      set({
        state: {
          ...state,
          hero: { ...state.hero, hp: DOWNED.hpOnReturn },
          resources: { ...state.resources, gold },
          world: { ...state.world, currentMap: 'town', heroTile: { ...START_HERO_TILE } },
        },
        clearedNodes: [],
      });
      void get().save('map-change');
    }
  },

  openBuildPanel(buildingId) {
    set({ buildPanel: buildingId });
  },

  closeBuildPanel() {
    set({ buildPanel: null });
  },

  raiseBuilding(buildingId) {
    const { state } = get();
    if (state === null) return;

    const result = build(state, buildingId);
    if (result.level === null) {
      set({ error: blockMessage(result.blocked) });
      return;
    }

    // 건설도 연대기에 남는다 (§4). 주 종료를 기다리지 않는다
    const def = getBuilding(buildingId);
    const entry = makeEntry(
      result.state.world.turn,
      result.state.chronicle.length,
      CHRONICLE_TEXT.build(def?.name ?? buildingId, result.level),
    );

    set({
      state: { ...result.state, chronicle: appendEntries(result.state.chronicle, [entry]) },
      error: null,
    });
    void get().save('build');
  },

  endWeek() {
    const { state } = get();
    if (state === null) return;
    const { state: next } = endWeek(state, {}, createRng(seedOf(state) + state.world.turn));
    set({ state: next });
    void get().save('turn-end');
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
