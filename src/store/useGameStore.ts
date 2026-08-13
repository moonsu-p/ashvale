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
import { applyBuild } from '@/systems/construction';
import { applyLearnSkill } from '@/systems/skills';
import { resolveExplore, canExplore, type ExploreOutcome } from '@/systems/explore';
import {
  applyGiftCompanion,
  canGift,
  giftReactionFor,
  companionTalkLine,
  companionGiftLine,
  companionRefuseCooldown,
  patronGreetLine,
} from '@/systems/relationships';
import type { StatId } from '@/types/game';

export interface Dialogue {
  speaker: string;
  text: string;
}
import { createRng } from '@/systems/rng';
import { applyCollapse } from '@/systems/collapse';
import {
  pendingDialogueEvent, applyDialogueChoice, shouldDeclareTrack, romanceEligible, declareTrack,
} from '@/systems/dialogueEvents';
import { offerableQuest, acceptQuest as acceptQuestSys, completeQuest, isQuestComplete } from '@/systems/quests';
import { questById } from '@/systems/quests';
import { applySell, applyBuy } from '@/systems/trade';
import { applyGiftItem } from '@/systems/gifts';
import { createCompanion, activeCompanionCount } from '@/systems/relationships';
import { ARCHETYPES, COMPANION_CAP } from '@/data/archetypes';
import type { DialogueEvent } from '@/data/content/dialogue-events';
import type { Quest } from '@/data/quests';
import type { ResourceId } from '@/types/game';
import { reencodeToWebp, ImageRejected } from '@/images/reencode';
import { imageKey, unlockedSlotsFor, SLOT_MAP } from '@/data/slots';
import { DEFAULT_HERO_NAME, DEFAULT_SETTLEMENT_NAME } from '@/data/onboarding';
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
  /** 맵에서 탭한 건물 (건설/증축 패널 강조용) */
  selectedBuilding: string | null;
  /** 온보딩 화면 표시 여부 (세이브 없고 아직 시작 전) */
  onboarding: boolean;
  /** 진행 중인 탐험 판정 결과 — 연출 오버레이용. 확인 시 턴이 종료된다. */
  pendingExplore: ExploreOutcome | null;
  /** 방금 나눈 대사 — 인물 화면 표시용 */
  lastDialogue: Dialogue | null;
  /** 직전 행동 — 재실행 버튼용 (§15.3) */
  lastAction: TurnAction | null;
  /** 대화 사건 오버레이 (§16.3) */
  pendingDialogueEvent: { companionId: string; event: DialogueEvent } | null;
  /** 관계 선언(트랙 분기, §7.5) */
  pendingDeclaration: { companionId: string; romance: boolean } | null;
  /** 퀘스트 제안 */
  pendingQuestOffer: { quest: Quest } | null;
  /** 인물 생성 흐름 (§7.7) */
  pendingRecruit: { candidates: string[]; source: 'quest' | 'referral' | 'drifter' } | null;

  boot: () => Promise<void>;
  startNewGame: (heroName: string, settlementName: string) => Promise<void>;
  newChronicle: (heroName?: string) => Promise<void>;
  dismissBanner: () => void;

  /** 탐험 판정을 계산해 연출 오버레이를 연다(무변이). 동행자 지정 가능. */
  explore: (regionId: string, escortId?: string | null) => void;
  /** 관계 변화 후 대화 사건·트랙 선언·소개 연쇄를 확인해 오버레이를 연다. */
  checkCompanionTriggers: (companionId: string) => void;
  /** 연출 확인 → 탐험 행동으로 턴을 종료한다. */
  confirmExplore: () => Promise<void>;
  cancelExplore: () => void;

  /**
   * 상태를 변경하고 자동 저장한다. 모든 규칙 액션은 이 게이트를 통과한다.
   * mutator 는 새 GameState 를 반환하는 순수 변환이어야 한다.
   */
  commit: (mutator: (s: GameState) => GameState) => Promise<void>;

  /** 턴 종료(§2 8단계)를 실행하고 저장한다. RNG 는 재현 가능하게 시드한다. */
  takeTurn: (action: TurnAction) => Promise<void>;
  /** 방비(턴 소비, §8): prepBonus 누적. */
  prep: () => Promise<void>;
  /** 직전 행동을 한 번 더 (§15.3). */
  repeatLast: () => Promise<void>;

  /** 건설/증축(§5). 건설은 턴을 소비하지 않는다. */
  build: (id: string) => Promise<void>;
  selectBuilding: (id: string | null) => void;

  /** 능력치 점수 1 배분(§4). */
  allocateStat: (statId: StatId) => Promise<void>;
  /** 스킬 1랭크 투자(§4). */
  learnSkill: (id: string) => Promise<void>;

  /** 관계 대상 교류(턴 소비, §7.4). */
  talkCompanion: (id: string) => Promise<void>;
  /** 의뢰인 교류(턴 소비, §7.3). */
  talkPatron: (id: string) => Promise<void>;
  /** 선물(턴 무소비, §7.4). category 는 선물 카테고리. */
  giftCompanion: (id: string, category: string) => Promise<void>;
  dismissDialogue: () => void;

  /** 관계 대상 슬롯에 이미지 넣기(재인코딩, §11.4). */
  setCompanionImage: (id: string, slot: number, file: File) => Promise<void>;
  deleteCompanionImage: (id: string, slot: number) => Promise<void>;
  /** 연대기 꾸러미(zip) 내보내기 — 다운로드. */
  exportBundle: () => Promise<void>;
  /** 꾸러미 불러오기. §12.7a: 붕괴 이전 시점이면 붕괴를 재적용한다. */
  importBundle: (file: File) => Promise<void>;

  // ── M7c: 대화 사건·트랙·퀘스트·인물 생성·교역·선물 품목 ──
  chooseDialogueChoice: (choiceIndex: number) => Promise<void>;
  dismissDialogueEvent: () => void;
  chooseTrack: (track: 'bond' | 'romance') => Promise<void>;
  acceptQuest: () => Promise<void>;
  declineQuest: () => void;
  chooseRecruit: (archetypeId: string, name: string) => Promise<void>;
  dismissRecruit: () => void;
  giftItem: (companionId: string, itemId: string) => Promise<void>;
  sell: (resource: ResourceId, amount: number) => Promise<void>;
  buy: (resource: ResourceId, gold: number) => Promise<void>;
}

/** now 주입: 규칙은 순수 함수라 시각을 밖에서 넣는다. 여기(스토어)는 경계라 Date 사용 허용. */
const now = () => Date.now();

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  ledger: null,
  status: 'idle',
  storageBanner: null,
  persist: null,
  selectedBuilding: null,
  onboarding: false,
  pendingExplore: null,
  lastDialogue: null,
  lastAction: null,
  pendingDialogueEvent: null,
  pendingDeclaration: null,
  pendingQuestOffer: null,
  pendingRecruit: null,

  boot: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });

    // 지속 저장 요청은 병렬로 진행 (결과는 설정 표시용)
    void requestPersistentStorage().then((p) => set({ persist: p }));

    try {
      const state = await storage.loadState();
      if (!state) {
        // 세이브 없음 → 온보딩(§16.2). 자동 생성하지 않는다.
        set({ status: 'ready', onboarding: true, state: null });
        return;
      }
      const ledger = await storage.mergeLedger({ maxTurnReached: state.world.turn });
      set({ state, ledger, status: 'ready', onboarding: false });
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '저장소 초기화에 실패했습니다.';
      set({ status: 'error', storageBanner: msg });
    }
  },

  startNewGame: async (heroName, settlementName) => {
    try {
      const state = createInitialState(
        now(),
        heroName.trim() || DEFAULT_HERO_NAME,
        settlementName.trim() || DEFAULT_SETTLEMENT_NAME
      );
      await storage.saveState(state);
      const ledger = await storage.mergeLedger({ maxTurnReached: 0 });
      set({
        state, ledger, status: 'ready', onboarding: false, storageBanner: null, lastDialogue: null, lastAction: null,
        pendingExplore: null, pendingDialogueEvent: null, pendingDeclaration: null, pendingQuestOffer: null, pendingRecruit: null,
      });
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '새 게임을 시작하지 못했습니다.';
      set({ storageBanner: msg });
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
    const cur = get().state;
    if (!cur) return;
    const rng = createRng(`${cur.createdAt}:turn:${cur.world.turn}`);
    const { state: next, collapsed } = endTurn(cur, action, rng);
    set({ state: next, lastAction: action });
    try {
      await storage.saveState(next);
      const patch: Partial<Ledger> = { maxTurnReached: next.world.turn };
      if (collapsed) {
        // 붕괴는 원장에 남는다. 불러오기가 이를 되돌리지 못한다 (§12.7a)
        patch.collapses = next.counters.collapses;
        patch.lastCollapseTurn = next.world.turn;
      }
      const ledger = await storage.mergeLedger(patch);
      set({ ledger });
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '자동 저장에 실패했습니다.';
      set({ storageBanner: msg });
    }
  },

  build: async (id) => {
    await get().commit((s) => applyBuild(s, id));
  },

  prep: async () => {
    await get().takeTurn({ kind: 'prep' });
  },

  repeatLast: async () => {
    const last = get().lastAction;
    const s = get().state;
    if (!last || !s) return;
    // 유효성만 확인하고 다시 실행 (탐험은 연출 없이 즉시 적용 — 빠른 반복, §15.3)
    if (last.kind === 'explore' && !canExplore(s, last.regionId)) return;
    await get().takeTurn(last);
    if (last.kind === 'talk' && last.target === 'companion') get().checkCompanionTriggers(last.id);
  },

  selectBuilding: (id) => set({ selectedBuilding: id }),

  allocateStat: async (statId) => {
    await get().commit((s) => {
      if (s.hero.statPoints <= 0) return s;
      const next = structuredClone(s);
      next.hero.stats[statId] += 1;
      next.hero.statPoints -= 1;
      return next;
    });
  },

  learnSkill: async (id) => {
    await get().commit((s) => applyLearnSkill(s, id));
  },

  explore: (regionId, escortId) => {
    const s = get().state;
    if (!s || !canExplore(s, regionId)) return;
    const rng = createRng(`${s.createdAt}:turn:${s.world.turn}:explore`);
    set({ pendingExplore: resolveExplore(s, regionId, rng, escortId ?? null) });
  },

  confirmExplore: async () => {
    const p = get().pendingExplore;
    if (!p) return;
    set({ pendingExplore: null });
    await get().takeTurn({ kind: 'explore', regionId: p.regionId, escortId: p.escortId });
    if (p.escortId) get().checkCompanionTriggers(p.escortId);
  },

  cancelExplore: () => set({ pendingExplore: null }),

  talkCompanion: async (id) => {
    const s = get().state;
    if (!s || !s.companions[id]) return;
    const line = companionTalkLine(s, id);
    set({ lastDialogue: { speaker: s.companions[id]!.name, text: line } });
    await get().takeTurn({ kind: 'talk', target: 'companion', id });
    get().checkCompanionTriggers(id);
  },

  talkPatron: async (id) => {
    const s = get().state;
    if (!s || !s.patrons[id]?.met) return;
    set({ lastDialogue: { speaker: id, text: patronGreetLine(s, id) } });
    await get().takeTurn({ kind: 'talk', target: 'patron', id });

    const st = get().state;
    if (!st) return;
    // 완료 보고 (§16.1): 요구를 채운 채 이 의뢰인과 교류하면 완료
    if (st.activeQuest?.patronId === id) {
      const quest = questById(st.activeQuest.questId);
      if (quest && isQuestComplete(st, quest)) {
        await get().commit((n) => {
          const c = structuredClone(n);
          completeQuest(c);
          return c;
        });
        if (quest.reward.kind === 'recruit') {
          set({ pendingRecruit: { candidates: quest.reward.candidates, source: 'quest' } });
        } else {
          set({ lastDialogue: { speaker: id, text: `[${quest.title}] 완료했다.` } });
        }
        return;
      }
    }
    // 제안 (신뢰 20+, 미수락)
    const offer = offerableQuest(st, id);
    if (offer) set({ pendingQuestOffer: { quest: offer } });
  },

  giftCompanion: async (id, category) => {
    const s = get().state;
    if (!s) return;
    const c = s.companions[id];
    if (!c) return;
    if (!canGift(s, id)) {
      set({ lastDialogue: { speaker: c.name, text: companionRefuseCooldown(s, id) } });
      return;
    }
    const reaction = giftReactionFor(c.archetypeId, category);
    const line = companionGiftLine(s, id, reaction);
    await get().commit((st) => {
      const n = structuredClone(st);
      applyGiftCompanion(n, id, category);
      return n;
    });
    set({ lastDialogue: { speaker: c.name, text: line } });
    get().checkCompanionTriggers(id);
  },

  dismissDialogue: () => set({ lastDialogue: null }),

  checkCompanionTriggers: (companionId) => {
    const s = get().state;
    if (!s) return;
    const ev = pendingDialogueEvent(s, companionId);
    if (ev) {
      set({ pendingDialogueEvent: { companionId, event: ev } });
      return;
    }
    if (shouldDeclareTrack(s, companionId)) {
      set({ pendingDeclaration: { companionId, romance: romanceEligible(s, companionId) } });
      return;
    }
    // 소개 연쇄: 우애 맹우(80) 전용 (§7.7)
    const c = s.companions[companionId];
    if (c && c.track === 'bond' && c.affinity >= 80 && !s.counters.firsts[`referred:${companionId}`] && activeCompanionCount(s) < COMPANION_CAP) {
      const arch = ARCHETYPES[c.archetypeId];
      const candidates = Object.values(ARCHETYPES).filter((a) => a.faction === arch?.faction && a.id !== 'wanderer').map((a) => a.id);
      void get().commit((st) => {
        const n = structuredClone(st);
        n.counters.firsts[`referred:${companionId}`] = true;
        return n;
      });
      set({ pendingRecruit: { candidates: candidates.length ? candidates : ['wanderer'], source: 'referral' } });
    }
  },

  chooseDialogueChoice: async (choiceIndex) => {
    const pd = get().pendingDialogueEvent;
    if (!pd) return;
    set({ pendingDialogueEvent: null });
    await get().commit((st) => {
      const n = structuredClone(st);
      applyDialogueChoice(n, pd.companionId, pd.event.id, choiceIndex);
      return n;
    });
    get().checkCompanionTriggers(pd.companionId);
  },

  dismissDialogueEvent: () => set({ pendingDialogueEvent: null }),

  chooseTrack: async (track) => {
    const pd = get().pendingDeclaration;
    if (!pd) return;
    set({ pendingDeclaration: null });
    await get().commit((st) => {
      const n = structuredClone(st);
      declareTrack(n, pd.companionId, track);
      return n;
    });
  },

  acceptQuest: async () => {
    const offer = get().pendingQuestOffer;
    if (!offer) return;
    set({ pendingQuestOffer: null });
    await get().commit((st) => {
      const n = structuredClone(st);
      acceptQuestSys(n, offer.quest.id);
      return n;
    });
  },

  declineQuest: () => set({ pendingQuestOffer: null }),

  chooseRecruit: async (archetypeId, name) => {
    const r = get().pendingRecruit;
    if (!r) return;
    set({ pendingRecruit: null });
    await get().commit((st) => {
      const n = structuredClone(st);
      createCompanion(n, archetypeId, name, r.source === 'referral' ? 'referral' : 'quest');
      return n;
    });
  },

  dismissRecruit: () => set({ pendingRecruit: null }),

  giftItem: async (companionId, itemId) => {
    await get().commit((st) => {
      const n = structuredClone(st);
      applyGiftItem(n, companionId, itemId);
      return n;
    });
    get().checkCompanionTriggers(companionId);
  },

  sell: async (resource, amount) => {
    await get().commit((st) => {
      const n = structuredClone(st);
      applySell(n, resource, amount);
      return n;
    });
  },

  buy: async (resource, gold) => {
    await get().commit((st) => {
      const n = structuredClone(st);
      applyBuy(n, resource, gold);
      return n;
    });
  },

  setCompanionImage: async (id, slot, file) => {
    const s = get().state;
    const c = s?.companions[id];
    if (!s || !c) return;
    if (!unlockedSlotsFor(c.affinity).includes(slot)) {
      set({ storageBanner: '아직 열리지 않은 자리입니다.' });
      return;
    }
    try {
      const spec = SLOT_MAP[slot];
      const blob = await reencodeToWebp(file, spec?.longEdge ?? 1200);
      const key = imageKey(id, slot);
      await storage.putImage(key, blob);
      await get().commit((st) => {
        const n = structuredClone(st);
        n.companions[id]!.images[slot] = key;
        n.companions[id]!.unlockedSlots = unlockedSlotsFor(n.companions[id]!.affinity);
        return n;
      });
    } catch (e) {
      const msg = e instanceof ImageRejected ? e.message : '이미지를 추가하지 못했습니다.';
      set({ storageBanner: msg });
    }
  },

  deleteCompanionImage: async (id, slot) => {
    try {
      await storage.deleteImage(imageKey(id, slot));
    } catch {
      /* Blob 없어도 진행 */
    }
    await get().commit((st) => {
      const n = structuredClone(st);
      if (n.companions[id]) n.companions[id]!.images[slot] = null;
      return n;
    });
  },

  exportBundle: async () => {
    try {
      const blob = await storage.exportBundle();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ashvale_${now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '내보내기에 실패했습니다.';
      set({ storageBanner: msg });
    }
  },

  importBundle: async (file) => {
    try {
      await storage.importBundle(file);
    } catch (e) {
      const msg = e instanceof StorageError ? e.message : '불러오기에 실패했습니다.';
      set({ storageBanner: msg });
      return;
    }
    const state = await storage.loadState();
    let ledger = await storage.loadLedger();
    if (state && ledger && ledger.lastCollapseTurn > state.world.turn) {
      // 붕괴 이전 시점을 불러왔다 → 붕괴 재적용(§12.7a). 되돌릴 수 없다.
      const n = structuredClone(state);
      applyCollapse(n, createRng(`${n.createdAt}:reimport:${n.world.turn}`));
      await storage.saveState(n);
      ledger = await storage.mergeLedger({ collapses: n.counters.collapses, lastCollapseTurn: n.world.turn });
      set({ state: n, ledger, onboarding: false, storageBanner: '이 기록은 몰락 이전 시점이라 몰락이 다시 적용되었습니다.' });
    } else {
      set({ state, ledger, onboarding: false });
    }
  },

  dismissBanner: () => set({ storageBanner: null }),
}));
