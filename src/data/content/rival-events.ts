/**
 * 경쟁 사건 — 범용 6개
 * 기획서 §7.5 준수.
 *
 * 연인이 2명 이상일 때 8주마다 하나. 두 인물이 동시에 등장한다.
 * **수치를 깎는 대신 상황을 만든다.** 질투 페널티는 없다 —
 * 대신 편들기가 값을 갖는다.
 *
 * 원형 조합은 28가지라 개별로 쓸 수 없다. 그래서 **이름만 바꿔 끼우는 범용 6개**를
 * 쓴다. 어느 두 사람에게 붙여도 말이 되도록 원형 고유의 소재는 넣지 않았다.
 *
 * 문체: 서술은 무주어, 대사는 현대 구어체 반말(연인 단계) — §15.
 * 치환 토큰: {이름} 먼저 말을 건 쪽, {상대} 다른 쪽.
 */

export interface RivalChoice {
  text: string;
  /** 'first' = {이름} 편, 'second' = {상대} 편, 'neutral' = 어느 쪽도 아님 */
  side: 'first' | 'second' | 'neutral';
}

export interface RivalEvent {
  id: string;
  situation: string;
  choices: RivalChoice[];
}

export const RIVAL_EVENTS: RivalEvent[] = [
  {
    id: 'rival_seat',
    situation:
      '모닥불 옆에 자리가 하나 비어 있었다. {이름}과 {상대}가 동시에 그쪽으로 걸음을 옮기다 멈췄다. 둘 다 아무 말도 하지 않고 이쪽을 봤다.',
    choices: [
      { text: '{이름} 쪽으로 몸을 돌려 자리를 내준다.', side: 'first' },
      { text: '{상대}를 먼저 앉힌다.', side: 'second' },
      { text: '가운데에 앉아 양쪽을 다 옆에 둔다.', side: 'neutral' },
    ],
  },
  {
    id: 'rival_errand',
    situation:
      '창고를 정리할 사람이 하나 필요했다. {이름}이 먼저 손을 들었고, {상대}가 "나도 시간 돼" 하고 뒤늦게 말했다. 둘 다 물러서지 않았다.',
    choices: [
      { text: '"먼저 말한 사람이 하는 게 맞지."', side: 'first' },
      { text: '"{상대}가 하는 게 낫겠어."', side: 'second' },
      { text: '"둘이 같이 해. 반씩 나눠서."', side: 'neutral' },
    ],
  },
  {
    id: 'rival_gift',
    situation:
      '{이름}이 건넨 것과 {상대}가 건넨 것이 나란히 놓여 있었다. 둘 다 그것을 봤다. "어느 쪽을 먼저 쓸 거야?" {이름}이 웃으면서 물었는데 눈은 웃지 않았다.',
    choices: [
      { text: '{이름}의 것을 집어 든다.', side: 'first' },
      { text: '{상대}의 것을 집어 든다.', side: 'second' },
      { text: '"둘 다 아껴 쓸 거야." 그대로 둔다.', side: 'neutral' },
    ],
  },
  {
    id: 'rival_wound',
    situation:
      '돌아오는 길에 손등이 까졌다. {상대}가 먼저 알아채고 천을 꺼냈는데, {이름}이 이미 손을 잡고 있었다. 셋 다 잠깐 말이 없었다.',
    choices: [
      { text: '{이름}에게 맡긴다.', side: 'first' },
      { text: '{상대}의 천을 받는다.', side: 'second' },
      { text: '"별거 아니야." 스스로 감는다.', side: 'neutral' },
    ],
  },
  {
    id: 'rival_night',
    situation:
      '밤이 늦었다. {이름}이 "바래다줄게" 하고 일어섰고, {상대}도 같이 일어섰다. 둘 다 앉을 생각이 없어 보였다.',
    choices: [
      { text: '{이름}과 함께 걷는다.', side: 'first' },
      { text: '{상대}와 함께 걷는다.', side: 'second' },
      { text: '"셋이 가자." 앞장선다.', side: 'neutral' },
    ],
  },
  {
    id: 'rival_name',
    situation:
      '{상대}가 이쪽을 부르는 말을 바꿨다. {이름}이 그것을 들었다. "언제부터 그렇게 불렀어?" 묻는 말투가 가벼웠는데 아무도 웃지 않았다.',
    choices: [
      { text: '{이름}이 부르던 대로가 좋다고 말한다.', side: 'first' },
      { text: '{상대}가 부르는 쪽이 마음에 든다고 말한다.', side: 'second' },
      { text: '"둘 다 나야." 그러고 넘긴다.', side: 'neutral' },
    ],
  },
];

/** 편든 쪽 +6, 반대쪽 −4 / 중립은 양쪽 +1 (§7.5) */
export const RIVAL_AFFINITY = {
  sided: 6,
  opposed: -4,
  neutral: 1,
} as const;

/** 연인 2명 이상, 8주마다 1회 */
export const RIVAL_INTERVAL_WEEKS = 8;
export const RIVAL_MIN_LOVERS = 2;
