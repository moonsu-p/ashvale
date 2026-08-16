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
import { DOWNED, getRegion, regionIdFromMap, regionMapId, regionName } from '@/data/regions';
import { REGION_ENTRY } from '@/data/maps/region';
import { REGION_TEXT } from '@/data/content/region-text';
import { START_HERO_TILE } from '@/data/start';
import { resolveExplore, rollExplore, type ExploreOutcome } from '@/systems/explore';
import { gainXp, type LevelUp } from '@/systems/progression';
import { getRelic, rollRelic } from '@/systems/relics';
import { applyToken } from '@/systems/korean';
import {
  AFFINITY,
  APPROACH_IGNORE_LIMIT,
  ESCORT_INJURY,
  ESCORT_MIN_AFFINITY,
  FACTION_LABEL,
  TRUST,
  TRUST_MAX,
} from '@/data/relationships';
import { shiftFaction } from '@/systems/factions';
import { buildConfessionScript, buildEventScript } from '@/systems/dialogue';
import { answerConfession, shouldConfess } from '@/systems/confession';
import { addCompanion } from '@/systems/roster';
import { getQuest } from '@/data/quests';
import {
  buyCost,
  getGift,
  giftAffinity,
  giftReaction,
  giftReady,
  sellValue,
  weeklyLimit,
} from '@/systems/market';
import { josa } from '@/systems/korean';
import { COLLAPSE_TEXT, RELIC_SALE_FOOD } from '@/data/collapse';

const RESOURCE_NAME: Record<ResourceId, string> = {
  wood: '목재',
  stone: '석재',
  food: '식량',
  gold: '금화',
};
import {
  displayName,
  isHomeRegion,
  nextApproach,
  pendingTier,
  withAffinity,
} from '@/systems/relationships';
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
import { getStorage, loadGame, saveAll, saveLedger, StorageError } from '@/storage';
import { mergeLedger } from '@/systems/ledger';

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
  /** 화면 위쪽에 잠깐 뜨는 결과 문구 (§8.3) — `호감 +8` */
  toast: string | null;
  clearToast: () => void;

  /** 처음 한 번만 보이는 안내. 본 것은 counters.firsts 에 적힌다 */
  hint: string | null;
  showHint: (id: string, text: string) => void;
  dismissHint: () => void;

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

  /** 지금 걸어오고 있는 인물 id (§7.3). 스프라이트가 도착하면 대화가 열린다 */
  approaching: string | null;
  /**
   * 다가옴을 몇 번 무시했는지. 세이브에 담을 자리가 §4 에 없어 세션에만 둔다 —
   * 새로고침하면 0 으로 돌아간다.
   */
  approachIgnores: Record<string, number>;
  /** 마을에 들어섰다. 대기 중인 인물이 있으면 걸어오게 한다 */
  beginApproach: () => void;
  /** 스프라이트가 앞까지 왔다 → 대화 사건을 연다 */
  approachArrived: () => void;
  /** 마을을 떠났다. 다가오던 사람을 무시한 것으로 친다 */
  abandonApproach: () => void;

  /** 동행 — 주당 1명, 동료(40) 이상만 (§11) */
  setEscort: (companionId: string | null) => void;
  /** 의뢰인과 대화하면 신뢰가 오른다. 주를 쓰지 않는다 (§7.6) */
  talkToPatron: (patronId: string) => void;

  /** 이름은 플레이어가 붙인다 (§7.1) */
  renameCompanion: (companionId: string, name: string) => void;
  /** 이번 주에 쓴 거래액. 세이브에 담을 자리가 §4 에 없어 세션에만 둔다 */
  tradedThisWeek: number;
  sellResource: (resource: ResourceId, amount: number) => void;
  buyResource: (resource: ResourceId, amount: number) => void;
  /** 선물 — 취향이 맞으면 크게 오른다. 인물당 4주 쿨다운 (§7.3) */
  giveGift: (companionId: string, giftId: string) => void;

  /** 상단 HUD 를 눌러 여는 메뉴 (§5) */
  menu: 'companions' | 'market' | 'chronicle' | 'bundle' | null;
  openMenu: (tab: 'companions' | 'market' | 'chronicle' | 'bundle') => void;
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
  /** 붕괴 직전, 유물을 넘겨 시간을 산다. 한 번뿐이다 (§13) */
  sellRelicForTime: () => void;

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
  toast: null,
  hint: null,
  dialogue: null,
  buildPanel: null,
  regionSelect: false,
  explore: null,
  clearedNodes: [],
  menu: null,
  approaching: null,
  approachIgnores: {},
  tradedThisWeek: 0,

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
    if (option === undefined) {
      set({ dialogue: null });
      return;
    }

    // 고른 것이 실제로 일어난다 (§8.4). 정답은 없다 —
    // 호감이 적게 오르는 쪽은 세력 평판 같은 다른 것을 준다
    const effect = option.effect;
    const { state } = get();
    if (effect !== undefined && state !== null) {
      let next = state;
      const toast: string[] = [];

      if (effect.companionId !== undefined) {
        const companion = next.companions[effect.companionId];
        if (companion !== undefined && effect.confess !== undefined) {
          // 고백에 답한다 (§7.4). 보류가 이 장르의 핵심이다
          const answered = answerConfession(companion, effect.confess, next.world.turn);
          next = {
            ...next,
            companions: { ...next.companions, [answered.id]: answered },
            counters: {
              ...next.counters,
              confessions:
                effect.confess === 'accept'
                  ? next.counters.confessions + 1
                  : next.counters.confessions,
            },
          };
          toast.push(
            effect.confess === 'accept'
              ? '연심'
              : effect.confess === 'hold'
                ? '보류'
                : '우애로 굳음 · 호감 -10',
          );
        } else if (companion !== undefined) {
          let moved = companion;
          if (effect.affinity !== undefined && effect.affinity !== 0) {
            moved = withAffinity(moved, effect.affinity);
            toast.push(`호감 ${effect.affinity > 0 ? '+' : ''}${effect.affinity}`);
          }
          if (effect.clearedEvent !== undefined && !moved.clearedEvents.includes(effect.clearedEvent)) {
            moved = { ...moved, clearedEvents: [...moved.clearedEvents, effect.clearedEvent] };
          }
          moved = { ...moved, lastApproachTurn: next.world.turn };
          next = { ...next, companions: { ...next.companions, [moved.id]: moved } };
        }
      }

      // 의뢰를 맡는다 (§7.6) — 동시에 하나뿐이다
      if (effect.questAccept !== undefined && effect.patronId !== undefined) {
        const p = next.patrons[effect.patronId];
        next = {
          ...next,
          patrons: {
            ...next.patrons,
            [effect.patronId]: {
              id: effect.patronId,
              met: true,
              trust: p?.trust ?? 0,
              questsCleared: p?.questsCleared ?? [],
              activeQuestId: effect.questAccept,
            },
          },
        };
        toast.push('의뢰를 맡았다');
      }

      // 완료 보고 — 실패가 없으므로 여기까지 오면 반드시 성공이다
      if (effect.questReport !== undefined) {
        const quest = getQuest(effect.questReport);
        const holder = Object.values(next.patrons).find(
          (p) => p.activeQuestId === effect.questReport,
        );
        if (quest !== undefined && holder !== undefined) {
          next = {
            ...next,
            patrons: {
              ...next.patrons,
              [holder.id]: {
                ...holder,
                trust: Math.min(TRUST_MAX, holder.trust + TRUST.questCleared),
                questsCleared: [...holder.questsCleared, quest.id],
                activeQuestId: null,
              },
            },
          };
          toast.push(`신뢰 +${TRUST.questCleared}`);

          const reward = quest.reward;
          if (reward.kind === 'resources') {
            next = {
              ...next,
              resources: {
                ...next.resources,
                wood: next.resources.wood + (reward.wood ?? 0),
                stone: next.resources.stone + (reward.stone ?? 0),
                gold: next.resources.gold + (reward.gold ?? 0),
              },
            };
          } else if (reward.kind === 'region') {
            if (!next.world.unlockedRegions.includes(reward.regionId)) {
              next = {
                ...next,
                world: {
                  ...next.world,
                  unlockedRegions: [...next.world.unlockedRegions, reward.regionId],
                },
              };
              toast.push(`${regionName(reward.regionId)} 개방`);
            }
          } else {
            const grown = addCompanion(next, 'quest');
            if (grown !== null) {
              next = grown.state;
              toast.push(`${displayName(grown.companion)} 합류`);
            }
          }
        }
      }

      if (effect.factionShift !== undefined) {
        const [faction, delta] = effect.factionShift;
        next = { ...next, factions: shiftFaction(next.factions, faction, delta) };
        toast.push(`${FACTION_LABEL[faction]} ${delta > 0 ? '+' : ''}${delta}`);
      }

      // 소화한 사건은 대기열에서 빠진다
      next = {
        ...next,
        pendingApproach: next.pendingApproach.filter((id) => id !== effect.companionId),
      };

      set({ state: next, toast: toast.length > 0 ? toast.join(' · ') : null });
      void get().save('relationship');
    }

    // 마무리 대사가 없으면 고르는 즉시 닫힌다
    if (option.reply === '') {
      set({ dialogue: null, approaching: null });
      return;
    }
    set({ dialogue: { ...d, phase: 'typing', reply: option.reply } });
  },

  closeDialogue() {
    set({ dialogue: null });
  },

  beginApproach() {
    const { state, approaching } = get();
    if (state === null || approaching !== null) return;
    if (state.world.currentMap !== 'town') return;

    // 대기 중인 인물이 둘 이상이면 호감이 높은 쪽부터 한 명씩 (§7.3)
    const who = nextApproach(state);
    if (who === null) return;
    set({ approaching: who.id });
  },

  approachArrived() {
    const { state, approaching } = get();
    if (state === null || approaching === null) return;
    const companion = state.companions[approaching];
    if (companion === undefined) return;

    // 고백이 먼저다 (§7.4). 벗에 닿으면 인물이 그 말을 하러 온다
    const req = { townName: state.town.name, characterName: companion.name };
    const tier = pendingTier(companion);
    const script = shouldConfess(companion, state.world.turn)
      ? buildConfessionScript(companion, req)
      : tier === null
        ? null
        : buildEventScript(companion, tier, req);
    if (script === null) {
      set({ approaching: null });
      return;
    }
    set({ dialogue: { script, lineIndex: 0, phase: 'typing', reply: null } });
  },

  /** 무시하고 걸어갔다. 세 번이면 호감 −3 과 함께 물러난다 (§7.3) */
  abandonApproach() {
    const { state, approaching, approachIgnores } = get();
    if (approaching === null) return;

    const count = (approachIgnores[approaching] ?? 0) + 1;
    const ignores = { ...approachIgnores, [approaching]: count };

    if (state !== null && count >= APPROACH_IGNORE_LIMIT) {
      const companion = state.companions[approaching];
      if (companion !== undefined) {
        set({
          state: {
            ...state,
            companions: {
              ...state.companions,
              [approaching]: withAffinity(companion, AFFINITY.ignoredApproach),
            },
            // 사건은 사라지지 않는다. 다시 대기열로 돌아간다
            pendingApproach: state.pendingApproach.filter((id) => id !== approaching),
          },
        });
      }
      ignores[approaching] = 0;
    }

    set({ approaching: null, approachIgnores: ignores });
  },

  setEscort(companionId) {
    const { state } = get();
    if (state === null) return;
    if (companionId === null) {
      set({ state: { ...state, escort: null } });
      void get().save('relationship');
      return;
    }
    const companion = state.companions[companionId];
    if (companion === undefined) return;
    // 동료(40) 이상만. 부상 중이면 못 데려간다
    if (companion.affinity < ESCORT_MIN_AFFINITY) return;
    if (companion.injuredUntilTurn > state.world.turn) return;
    set({ state: { ...state, escort: companionId } });
    void get().save('relationship');
  },

  talkToPatron(patronId) {
    const { state } = get();
    if (state === null) return;

    const existing = state.patrons[patronId];
    const trust = Math.min(TRUST_MAX, (existing?.trust ?? 0) + TRUST.talk);
    const record = {
      id: patronId,
      met: true,
      trust,
      questsCleared: existing?.questsCleared ?? [],
      activeQuestId: existing?.activeQuestId ?? null,
    };

    set({
      state: { ...state, patrons: { ...state.patrons, [patronId]: record } },
      toast: `신뢰 +${TRUST.talk}`,
    });
    void get().save('relationship');
  },

  renameCompanion(companionId, name) {
    const { state } = get();
    if (state === null) return;
    const companion = state.companions[companionId];
    if (companion === undefined) return;
    set({
      state: {
        ...state,
        companions: { ...state.companions, [companionId]: { ...companion, name: name.trim() } },
      },
    });
    void get().save('relationship');
  },

  sellResource(resource, amount) {
    const { state, tradedThisWeek } = get();
    if (state === null || amount <= 0) return;
    if (state.resources[resource] < amount) {
      set({ error: `${josa(RESOURCE_NAME[resource], '이')} 모자랍니다.` });
      return;
    }
    const gold = sellValue(state, resource, amount);
    const limit = weeklyLimit(state);
    if (tradedThisWeek + gold > limit) {
      set({ error: `이번 주 거래 한도(${limit})를 넘습니다. 시장을 올리거나 다음 주에 하세요.` });
      return;
    }
    set({
      state: {
        ...state,
        resources: {
          ...state.resources,
          [resource]: state.resources[resource] - amount,
          gold: state.resources.gold + gold,
        },
      },
      tradedThisWeek: tradedThisWeek + gold,
      error: null,
      toast: `금화 +${gold}`,
    });
    void get().save('manual');
  },

  buyResource(resource, amount) {
    const { state, tradedThisWeek } = get();
    if (state === null || amount <= 0) return;
    const gold = buyCost(state, resource, amount);
    if (state.resources.gold < gold) {
      set({ error: `금화가 ${gold - state.resources.gold} 부족합니다. 자원을 팔거나 모으세요.` });
      return;
    }
    const limit = weeklyLimit(state);
    if (tradedThisWeek + gold > limit) {
      set({ error: `이번 주 거래 한도(${limit})를 넘습니다. 시장을 올리거나 다음 주에 하세요.` });
      return;
    }
    set({
      state: {
        ...state,
        resources: {
          ...state.resources,
          [resource]: state.resources[resource] + amount,
          gold: state.resources.gold - gold,
        },
      },
      tradedThisWeek: tradedThisWeek + gold,
      error: null,
      toast: `${RESOURCE_NAME[resource]} +${amount}`,
    });
    void get().save('manual');
  },

  giveGift(companionId, giftId) {
    const { state } = get();
    if (state === null) return;
    const companion = state.companions[companionId];
    const gift = getGift(giftId);
    if (companion === undefined || gift === undefined) return;

    if (!giftReady(companion, state.world.turn)) {
      set({ error: '얼마 전에도 받았습니다. 몇 주 뒤에 다시 건네세요.' });
      return;
    }
    if (state.resources.gold < gift.gold) {
      set({ error: `금화가 ${gift.gold - state.resources.gold} 부족합니다.` });
      return;
    }

    const reaction = giftReaction(companion, gift.category);
    const delta = giftAffinity(reaction);

    set({
      state: {
        ...state,
        resources: { ...state.resources, gold: state.resources.gold - gift.gold },
        companions: {
          ...state.companions,
          [companionId]: {
            ...withAffinity(companion, delta),
            lastApproachTurn: state.world.turn,
          },
        },
      },
      error: null,
      toast: `호감 ${delta > 0 ? '+' : ''}${delta}`,
    });
    void get().save('relationship');
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
      // 주가 넘어갔으니 거래 한도도 새로 찬다
      tradedThisWeek: 0,
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

    // ── 호감 (§7.3). 교류 버튼이 아니라 함께 겪은 일에서 오른다 ──
    const companions = { ...next.companions };
    const affinityNotes: string[] = [];

    // 동행 탐사 — 판정 등급별
    const escortId = next.escort;
    const escort = escortId === null ? undefined : companions[escortId];
    if (escort !== undefined) {
      let moved = withAffinity(escort, AFFINITY.escort[roll.grade]);
      // 위기면 동행자가 다친다 — 4주간 동행·대화 불가
      if (roll.grade === 'crisis') {
        moved = withAffinity(moved, ESCORT_INJURY.affinity);
        moved = { ...moved, injuredUntilTurn: next.world.turn + ESCORT_INJURY.weeks };
        affinityNotes.push(`${displayName(moved)}이(가) 다쳤다.`);
      }
      companions[moved.id] = moved;
    }

    // 고향 지역 탐사 — 동행 여부와 무관하다
    for (const c of Object.values(companions)) {
      if (c.departedTurn !== null || !isHomeRegion(c, regionId)) continue;
      companions[c.id] = withAffinity(c, AFFINITY.homeRegion);
    }

    next = { ...next, companions };

    const gained = gainXp(next, outcome.xp);
    next = gained.state;
    next = {
      ...next,
      counters: { ...next.counters, expeditions: next.counters.expeditions + 1 },
    };

    // 연대기에 남는다. 서술은 콘텐츠 문장 그대로
    const lines = [narration, ...affinityNotes];
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
    const result = endWeek(state, {}, createRng(seedOf(state) + state.world.turn));
    set({ state: result.state, tradedThisWeek: 0 });

    if (result.collapsed) {
      // 원장에 붕괴 시점을 남긴다. 이건 불러오기로 지워지지 않는다 (§14)
      const ledger = mergeLedger(get().ledger, {
        ledgerVersion: get().ledger.ledgerVersion,
        maxTurnReached: result.state.world.turn,
        collapses: result.state.counters.collapses,
        lastCollapseTurn: result.state.world.turn,
      });
      set({ ledger, toast: '무너졌다', approaching: null });
      void saveLedger(getStorage(), ledger);
    }

    void get().save('turn-end');
  },

  sellRelicForTime() {
    const { state } = get();
    if (state === null || state.hero.relics.length === 0) return;

    // 값을 따지지 않는다. 하나 넘기고 곡식을 받는다
    const [given, ...rest] = state.hero.relics;
    const next: GameState = {
      ...state,
      hero: { ...state.hero, relics: rest },
      resources: { ...state.resources, food: state.resources.food + RELIC_SALE_FOOD },
      counters: { ...state.counters, famineWeeks: 0 },
    };

    const entry = makeEntry(next.world.turn, next.chronicle.length, COLLAPSE_TEXT.relicSold);
    set({
      state: { ...next, chronicle: appendEntries(next.chronicle, [entry]) },
      toast: `${getRelic(given ?? '')?.name ?? '유물'}을 넘겼다`,
    });
    void get().save('manual');
  },

  setPrompt(label) {
    if (get().prompt !== label) set({ prompt: label });
  },

  clearToast() {
    set({ toast: null });
  },

  showHint(id, text) {
    const { state } = get();
    // 한 번 본 것은 다시 띄우지 않는다
    if (state === null || state.counters.firsts[id] === true) return;
    set({
      state: { ...state, counters: { ...state.counters, firsts: { ...state.counters.firsts, [id]: true } } },
      hint: text,
    });
    void get().save('manual');
  },

  dismissHint() {
    set({ hint: null });
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
