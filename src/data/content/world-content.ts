/**
 * 유물 12 · 위협 6 · 세계 이벤트 10
 * 기획서 §8, §9, §15.1 준수. 서술은 전부 무주어 문어체.
 */

export type ResourceId = 'wood' | 'stone' | 'food' | 'gold';
export type StatId = 'might' | 'agility' | 'insight' | 'will';
export type FactionId = 'guild' | 'oath' | 'grove' | 'tower';

// ══════════════════════════ 유물 ══════════════════════════

export interface Relic {
  id: string;
  name: string;
  eraGate: number;
  /** 연대기에 기록될 발견 서술 */
  found: string;
  /** 영구 패시브. 획득 시 relicBonus에 누적 (§6) */
  effect:
    | { kind: 'stat'; stat: StatId; value: number }
    | { kind: 'roll'; value: number }
    | { kind: 'defense'; value: number }
    | { kind: 'loot'; percent: number }
    | { kind: 'buildCost'; percent: number }
    | { kind: 'production'; resource: ResourceId; value: number }
    | { kind: 'affinityGain'; percent: number }
    | { kind: 'relicFind'; points: number };
  desc: string;
}

export const RELICS: Relic[] = [
  {
    id: 'compass',
    name: '사냥꾼의 나침반',
    eraGate: 0,
    found: '이끼에 덮인 나침반을 찾아냈다. 바늘은 북쪽이 아니라 물이 있는 쪽을 가리켰다.',
    effect: { kind: 'roll', value: 2 },
    desc: '탐험 판정 +2',
  },
  {
    id: 'seal',
    name: '이끼 낀 인장',
    eraGate: 1,
    found: '관문 아래에서 인장을 거두었다. 어느 나라의 것도 아니었으나 석공들이 알아보았다.',
    effect: { kind: 'buildCost', percent: -10 },
    desc: '건설 비용 −10%',
  },
  {
    id: 'oathring',
    name: '첫 서약의 반지',
    eraGate: 1,
    found: '무기고에서 반지 하나를 찾았다. 안쪽에 이름이 새겨져 있었으나 읽을 수 없었다.',
    effect: { kind: 'defense', value: 6 },
    desc: '방어력 +6',
  },
  {
    id: 'scale',
    name: '늪의 저울추',
    eraGate: 2,
    found: '재 아래에서 저울추를 파냈다. 무게가 표시된 것과 달랐다.',
    effect: { kind: 'loot', percent: 15 },
    desc: '전리품 +15%',
  },
  {
    id: 'seedjar',
    name: '마르지 않는 씨앗 항아리',
    eraGate: 2,
    found: '늪 가운데 마른 섬에서 항아리를 얻었다. 안의 씨앗은 젖지 않았다.',
    effect: { kind: 'production', resource: 'food', value: 4 },
    desc: '식량 +4/주',
  },
  {
    id: 'ledgerstone',
    name: '상인의 셈돌',
    eraGate: 2,
    found: '무너진 창고 바닥에서 셈돌 한 벌을 찾았다. 셈이 이미 맞춰져 있었다.',
    effect: { kind: 'production', resource: 'gold', value: 5 },
    desc: '금화 +5/주',
  },
  {
    id: 'frostlens',
    name: '서리 렌즈',
    eraGate: 3,
    found: '얼음 틈에서 렌즈를 떼어냈다. 들여다보면 먼 것이 가까이 보였다.',
    effect: { kind: 'stat', stat: 'insight', value: 1 },
    desc: '통찰 +1',
  },
  {
    id: 'bannerpole',
    name: '얼어붙은 깃대',
    eraGate: 3,
    found: '눈에 묻힌 대상의 짐에서 깃대를 뽑아냈다. 깃발은 남아 있지 않았다.',
    effect: { kind: 'stat', stat: 'might', value: 1 },
    desc: '힘 +1',
  },
  {
    id: 'echostone',
    name: '메아리 돌',
    eraGate: 4,
    found: '공동의 기둥에서 돌 하나를 떼어냈다. 말을 걸면 늦게 되돌려주었다.',
    effect: { kind: 'affinityGain', percent: 20 },
    desc: '호감 획득 +20%',
  },
  {
    id: 'deepvein',
    name: '결 고운 광석',
    eraGate: 4,
    found: '지하 강 반대편에서 광석을 얻었다. 지상의 어느 돌과도 결이 달랐다.',
    effect: { kind: 'production', resource: 'stone', value: 6 },
    desc: '석재 +6/주',
  },
  {
    id: 'starshard',
    name: '별의 조각',
    eraGate: 5,
    found: '균열 앞에서 조각 하나를 온전히 거두었다. 무게가 없었다.',
    effect: { kind: 'roll', value: 1 },
    desc: '모든 판정 +1',
  },
  {
    id: 'unspoken',
    name: '하지 않은 말',
    eraGate: 5,
    found: '균열 안쪽에서 자기 목소리가 되돌아왔다. 그 소리를 담아 왔다.',
    effect: { kind: 'relicFind', points: 8 },
    desc: '유물 발견률 +8%p',
  },
];

// ══════════════════════════ 위협 ══════════════════════════

export interface Threat {
  id: string;
  name: string;
  eraMin: number;
  eraMax: number;
  /** 등장 시 연대기 기록 */
  arrive: string;
  /** 준비 기간 2주차, 접근 연출과 함께 */
  approach: string;
  win: string;
  lose: string;
  /** 승리 시 평판이 오르는 세력 */
  faction: FactionId;
}

export const THREATS: Threat[] = [
  {
    id: 'goblins',
    name: '고블린 무리',
    eraMin: 1,
    eraMax: 2,
    arrive: '숲 경계에서 연기가 올랐다. 정찰이 무리의 수를 스물로 셈했다.',
    approach: '밤마다 울음소리가 가까워졌다. 이번 주에는 벽 아래까지 왔다.',
    win: '무리를 물리쳤다. 시신은 숲 밖으로 옮겨 태웠다.',
    lose: '벽이 뚫렸다. 창고 절반이 비었고, 세 채가 불탔다.',
    faction: 'grove',
  },
  {
    id: 'bandits',
    name: '도적단',
    eraMin: 1,
    eraMax: 3,
    arrive: '남쪽 길에서 짐마차가 털렸다. 같은 무리가 이쪽을 보고 있다.',
    approach: '길목에 표식이 세워졌다. 값을 내라는 뜻이다.',
    win: '도적을 쫓아냈다. 두목은 잡지 못했다.',
    lose: '금고가 열렸다. 값을 내는 쪽이 쌌을 것이다.',
    faction: 'guild',
  },
  {
    id: 'plague',
    name: '역병의 매개',
    eraMin: 2,
    eraMax: 4,
    arrive: '이주민 하나가 열을 안고 도착했다. 그 하나로 끝나지 않을 것이다.',
    approach: '앓는 집이 셋으로 늘었다. 우물을 나누어 쓰기로 했다.',
    win: '병이 잡혔다. 죽은 이는 둘이었고, 이름을 적어두었다.',
    lose: '병이 퍼졌다. 이번 계절의 일은 대부분 멈췄다.',
    faction: 'tower',
  },
  {
    id: 'wolves',
    name: '겨울 늑대',
    eraMin: 2,
    eraMax: 4,
    arrive: '눈이 내리기 전에 늑대가 내려왔다. 예년보다 이르다.',
    approach: '가축 우리가 두 번 열렸다. 다음은 사람 쪽이다.',
    win: '무리의 우두머리를 잡았다. 나머지는 산으로 돌아갔다.',
    lose: '우리가 비었다. 겨울을 넘길 셈이 다시 필요하다.',
    faction: 'grove',
  },
  {
    id: 'pilgrims',
    name: '이단 순례자',
    eraMin: 3,
    eraMax: 5,
    arrive: '흰 옷을 입은 무리가 벽 밖에 자리를 잡았다. 무기는 들지 않았다.',
    approach: '순례자들이 사람을 불러 모으기 시작했다. 셋이 벽을 넘어 나갔다.',
    win: '무리를 해산시켰다. 나간 셋 중 둘이 돌아왔다.',
    lose: '거점의 절반이 그들의 말을 따랐다. 평판이 크게 흔들렸다.',
    faction: 'oath',
  },
  {
    id: 'riftspawn',
    name: '균열의 파편',
    eraMin: 5,
    eraMax: 99,
    arrive: '균열에서 떨어진 것이 이쪽으로 움직인다. 무엇인지 아직 모른다.',
    approach: '그것이 지나간 자리에 풀이 자라지 않았다. 이제 하루 거리다.',
    win: '파편을 부수었다. 조각은 서고에 봉해두었다.',
    lose: '벽이 무너지고 땅이 상했다. 그 자리에는 오래 아무것도 자라지 않을 것이다.',
    faction: 'tower',
  },
];

// ══════════════════════════ 세계 이벤트 ══════════════════════════

export interface WorldEvent {
  id: string;
  name: string;
  eraMin: number;
  weight: number;
  text: string;
  effects: (
    | { kind: 'resource'; resource: ResourceId; value: number }
    | { kind: 'resourcePercent'; resource: ResourceId; percent: number }
    | { kind: 'faction'; factionId: FactionId; value: number }
    | { kind: 'hp'; value: number }
    | { kind: 'xp'; value: number }
    | { kind: 'skillPoint'; value: number }
    | { kind: 'popGrowth'; value: number }
  )[];
}

export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: 'goodharvest',
    name: '풍년',
    eraMin: 0,
    weight: 12,
    text: '가을이 길었다. 창고에 자리가 부족했다.',
    effects: [{ kind: 'resourcePercent', resource: 'food', percent: 40 }],
  },
  {
    id: 'drought',
    name: '가뭄',
    eraMin: 0,
    weight: 10,
    text: '샘이 얕아졌다. 물을 길으러 가는 길이 두 배가 되었다.',
    effects: [{ kind: 'resourcePercent', resource: 'food', percent: -30 }],
  },
  {
    id: 'peddler',
    name: '유랑 상인',
    eraMin: 0,
    weight: 12,
    text: '수레 하나가 들렀다. 값을 후하게 매기고 떠났다.',
    effects: [
      { kind: 'resource', resource: 'gold', value: 25 },
      { kind: 'faction', factionId: 'guild', value: 3 },
    ],
  },
  {
    id: 'settlers',
    name: '이주민 도착',
    eraMin: 1,
    weight: 10,
    text: '식구 넷이 도착했다. 지붕 아래 자리를 내주었다.',
    effects: [
      { kind: 'popGrowth', value: 1 },
      { kind: 'resource', resource: 'food', value: -15 },
    ],
  },
  {
    id: 'timberfall',
    name: '바람에 넘어진 숲',
    eraMin: 0,
    weight: 10,
    text: '밤새 바람이 불어 나무가 여럿 넘어갔다. 치우는 일이 곧 얻는 일이 되었다.',
    effects: [{ kind: 'resource', resource: 'wood', value: 30 }],
  },
  {
    id: 'envoyvisit',
    name: '왕실 사절',
    eraMin: 3,
    weight: 8,
    text: '왕도에서 사절이 하루 머물렀다. 무엇을 보고 갔는지는 적어두지 않았다.',
    effects: [
      { kind: 'faction', factionId: 'oath', value: 6 },
      { kind: 'resource', resource: 'gold', value: -20 },
    ],
  },
  {
    id: 'banditrumor',
    name: '도적 소문',
    eraMin: 1,
    weight: 10,
    text: '남쪽 길이 위험하다는 말이 돌았다. 상인들이 값을 올렸다.',
    effects: [
      { kind: 'resource', resource: 'gold', value: -15 },
      { kind: 'faction', factionId: 'guild', value: -3 },
    ],
  },
  {
    id: 'starfall',
    name: '별의 비',
    eraMin: 2,
    weight: 6,
    text: '밤새 별이 떨어졌다. 서고의 기록에 남길 만한 밤이었다.',
    effects: [
      { kind: 'xp', value: 30 },
      { kind: 'faction', factionId: 'tower', value: 5 },
    ],
  },
  {
    id: 'grovegift',
    name: '숲의 답례',
    eraMin: 1,
    weight: 8,
    text: '부족이 벽 앞에 짐승 가죽과 마른 고기를 두고 갔다. 사람은 보이지 않았다.',
    effects: [
      { kind: 'resource', resource: 'food', value: 25 },
      { kind: 'faction', factionId: 'grove', value: 4 },
    ],
  },
  {
    id: 'wanderingscholar',
    name: '떠도는 학자',
    eraMin: 2,
    weight: 7,
    text: '학자 하나가 사흘 머물며 아는 것을 남기고 갔다. 이름은 밝히지 않았다.',
    effects: [
      { kind: 'skillPoint', value: 1 },
      { kind: 'faction', factionId: 'tower', value: 3 },
    ],
  },
];
