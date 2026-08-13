/**
 * 의뢰인 퀘스트 — §16.1. 동시 1개, 기한·실패 없음. 완료는 의뢰인 교류 시 보고.
 * 요구를 채운 뒤 해당 의뢰인과 교류할 때 완료된다.
 */

import type { FactionId, ResourceId } from '@/types/game';

export type QuestReq =
  | { kind: 'exploreSuccess'; regionId: string; count: number }
  | { kind: 'buildingLevel'; buildingId: string; level: number }
  | { kind: 'payResource'; resource: ResourceId; amount: number }
  | { kind: 'threatsWon'; count: number }
  | { kind: 'factionRep'; factionId: FactionId; value: number }
  | { kind: 'factionCount'; value: number; count: number }
  | { kind: 'insightTriumph' };

export type QuestReward =
  | { kind: 'recruit'; candidates: string[] } // 원형 후보 (인물 생성 흐름)
  | { kind: 'wallMaterial' } // 성벽 석벽 조기 개방 (§8 M8)
  | { kind: 'unlockRegion' }; // 다음 지역 즉시 해금

export interface Quest {
  id: string;
  patronId: string;
  title: string;
  requirements: QuestReq[];
  reward: QuestReward;
}

export const QUESTS: Quest[] = [
  {
    id: 'bartek_road',
    patronId: 'bartek',
    title: '교역로 개척',
    requirements: [
      { kind: 'exploreSuccess', regionId: 'gate', count: 3 },
      { kind: 'payResource', resource: 'gold', amount: 60 },
    ],
    reward: { kind: 'recruit', candidates: ['hunter', 'mage'] },
  },
  {
    id: 'tova_quarry',
    patronId: 'tova',
    title: '채석장 증축',
    requirements: [
      { kind: 'buildingLevel', buildingId: 'quarry', level: 3 },
      { kind: 'payResource', resource: 'stone', amount: 80 },
    ],
    reward: { kind: 'wallMaterial' },
  },
  {
    id: 'harl_oath',
    patronId: 'harl',
    title: '서약의 시험',
    requirements: [
      { kind: 'threatsWon', count: 2 },
      { kind: 'buildingLevel', buildingId: 'yard', level: 2 },
    ],
    reward: { kind: 'recruit', candidates: ['knight', 'envoy'] },
  },
  {
    id: 'oren_lore',
    patronId: 'oren',
    title: '고문헌 해독',
    requirements: [
      { kind: 'buildingLevel', buildingId: 'library', level: 2 },
      { kind: 'insightTriumph' },
    ],
    reward: { kind: 'unlockRegion' },
  },
  {
    id: 'doran_settlers',
    patronId: 'doran',
    title: '이주민 유치',
    requirements: [
      { kind: 'buildingLevel', buildingId: 'farm', level: 4 },
      { kind: 'payResource', resource: 'food', amount: 120 },
    ],
    reward: { kind: 'recruit', candidates: ['herbalist', 'hunter'] },
  },
  {
    id: 'vell_letter',
    patronId: 'vell',
    title: '은밀한 서신',
    requirements: [{ kind: 'factionCount', value: 40, count: 2 }],
    reward: { kind: 'recruit', candidates: ['wanderer'] },
  },
];

export const QUEST_BY_PATRON: Record<string, Quest> = Object.fromEntries(QUESTS.map((q) => [q.patronId, q]));

/** 신뢰 20(거래처) 이상에서 퀘스트 제시 (§16.1) */
export const QUEST_OFFER_TRUST = 20;
/** 완료 시 신뢰 획득 (§7.3) */
export const QUEST_TRUST_REWARD = 10;
