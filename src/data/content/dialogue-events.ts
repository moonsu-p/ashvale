/**
 * 대화 사건 — 원형 6종 × 4단계(20/40/60/80) = 24개
 * 기획서 §16.3 준수.
 *
 * 주사위를 굴리지 않는다. 선택만 한다.
 * 정답이 없다. 호감이 낮게 오르는 선택지는 대신 세력 평판이나 다른 것을 준다.
 * tier 60 사건 2회 통과가 연심 트랙 진입 조건이다 (§7.5).
 */

export type FactionId = 'guild' | 'oath' | 'grove' | 'tower';

export interface DialogueChoice {
  text: string;
  affinity: number;
  factionShift?: [FactionId, number];
}

export interface DialogueEvent {
  id: string;
  archetypeId: string;
  tier: 20 | 40 | 60 | 80;
  situation: string;
  choices: DialogueChoice[];
}

export const DIALOGUE_EVENTS: DialogueEvent[] = [
  // ─────────────── knight 기사 ───────────────
  {
    id: 'knight_20',
    archetypeId: 'knight',
    tier: 20,
    situation:
      '훈련장 뒤에서 {이름}이 혼자 검을 휘두르고 있다. 같은 동작을 백 번쯤 반복한 것 같다. 손등이 까져 있는데 멈추지 않는다.',
    choices: [
      { text: '"손 먼저 좀 봅시다."', affinity: 8 },
      { text: '조용히 물을 가져다 놓고 자리를 비킨다.', affinity: 4 },
      {
        text: '"그럴 시간에 벽을 쌓는 게 낫지 않겠습니까."',
        affinity: -2,
        factionShift: ['guild', 3],
      },
    ],
  },
  {
    id: 'knight_40',
    archetypeId: 'knight',
    tier: 40,
    situation:
      '{이름}이 서약에서 온 서신을 태우고 있다. 다 타기 전에 눈이 마주쳤다. "명령이었습니다. 따르지 않기로 했어요."',
    choices: [
      { text: '"이유는 안 물어보겠습니다."', affinity: 8 },
      { text: '"나중에라도 말해주면 좋겠군요."', affinity: 4 },
      {
        text: '"서약과 등지면 이 땅이 불리해집니다."',
        affinity: -2,
        factionShift: ['oath', 5],
      },
    ],
  },
  {
    id: 'knight_60',
    archetypeId: 'knight',
    tier: 60,
    situation:
      '위협을 물리친 밤, {이름}이 성벽 위에 앉아 있다. "사람을 베는 게 익숙해지는 게 제일 무서워." 처음 듣는 목소리다.',
    choices: [
      { text: '"익숙해지지 않았으니까 그렇게 말하는 거야."', affinity: 8 },
      { text: '아무 말 없이 옆에 앉는다.', affinity: 6 },
      { text: '"그게 네 일이야. 잘하고 있어."', affinity: -2, factionShift: ['oath', 4] },
    ],
  },
  {
    id: 'knight_80',
    archetypeId: 'knight',
    tier: 80,
    situation:
      '{이름}이 검을 벽에 걸어두고 왔다. "오늘은 안 들고 왔어. 하루쯤 무기 없이 있어보고 싶어서." 그러면서도 문 쪽을 계속 본다.',
    choices: [
      { text: '"문은 내가 볼게. 오늘은 쉬어."', affinity: 8 },
      { text: '"불안하면 가져와도 돼."', affinity: 4 },
      { text: '"경계는 늘 해야지."', affinity: -2, factionShift: ['oath', 3] },
    ],
  },

  // ─────────────── hunter 사냥꾼 ───────────────
  {
    id: 'hunter_20',
    archetypeId: 'hunter',
    tier: 20,
    situation:
      '{이름}이 덫에 걸린 짐승을 풀어주고 있다. 자기가 놓은 덫이다. "새끼가 있는 것 같아서요." 사흘째 빈손이라는 걸 안다.',
    choices: [
      { text: '"오늘 식량은 창고에서 내면 됩니다."', affinity: 8 },
      { text: '"덫 놓는 자리를 바꿔보는 건 어때요."', affinity: 4 },
      {
        text: '"사냥꾼이 그러면 곤란하죠."',
        affinity: -2,
        factionShift: ['guild', 3],
      },
    ],
  },
  {
    id: 'hunter_40',
    archetypeId: 'hunter',
    tier: 40,
    situation:
      '{이름}이 숲 경계에 표식을 새로 세웠다. 부족의 문양이다. "여기까지는 우리 땅이라고 알려두는 거예요. 싫으면 뽑아도 돼요."',
    choices: [
      { text: '"세워둬요. 경계가 있는 게 낫죠."', affinity: 8, factionShift: ['grove', 4] },
      { text: '"어느 쪽 땅인지는 나중에 정하죠."', affinity: 4 },
      {
        text: '"{거점} 안에는 하나만 세웁시다."',
        affinity: -2,
        factionShift: ['oath', 4],
      },
    ],
  },
  {
    id: 'hunter_60',
    archetypeId: 'hunter',
    tier: 60,
    situation:
      '{이름}이 지붕 밑에서 자다가 새벽에 나가 있는 걸 봤다. "천장이 있으면 잠이 안 와. 이상하지." 부끄러워하는 것 같다.',
    choices: [
      { text: '"그럼 마당에 자리를 만들자."', affinity: 8 },
      { text: '"나도 가끔 그래."', affinity: 6 },
      { text: '"익숙해져야지. 여기 사람이잖아."', affinity: -2, factionShift: ['grove', 3] },
    ],
  },
  {
    id: 'hunter_80',
    archetypeId: 'hunter',
    tier: 80,
    situation:
      '{이름}이 숲 깊은 곳으로 데려갔다. 물이 고인 자리에 하늘이 그대로 비친다. "여기 아무한테도 안 알려줬어."',
    choices: [
      { text: '"그럼 계속 둘만 알자."', affinity: 8 },
      { text: '"이런 데를 어떻게 찾았어."', affinity: 5 },
      { text: '"여기까지 길을 내면 사람들이 좋아할 텐데."', affinity: -2, factionShift: ['guild', 4] },
    ],
  },

  // ─────────────── mage 마법사 ───────────────
  {
    id: 'mage_20',
    archetypeId: 'mage',
    tier: 20,
    situation:
      '{이름}이 밤새 뭔가를 계산하다가 종이를 다 찢었다. "틀렸습니다. 사흘치가요." 그러면서 새 종이를 꺼낸다.',
    choices: [
      { text: '"틀린 사흘도 기록해두면 어때요."', affinity: 8 },
      { text: '"자고 나서 하는 게 빠를 겁니다."', affinity: 4 },
      {
        text: '"그 시간에 서고를 정리하는 게 더 도움이 될 텐데요."',
        affinity: -2,
        factionShift: ['guild', 3],
      },
    ],
  },
  {
    id: 'mage_40',
    archetypeId: 'mage',
    tier: 40,
    situation:
      '{이름}이 탑에서 왜 나왔는지 말하려 한다. "규칙을 하나 어겼습니다. 사람을 살리려고요. 탑은 그걸 오류라고 불렀습니다."',
    choices: [
      { text: '"탑이 틀렸군요."', affinity: 8 },
      { text: '"그 사람은 살았습니까?"', affinity: 6 },
      {
        text: '"규칙에는 이유가 있을 텐데요."',
        affinity: -2,
        factionShift: ['tower', 5],
      },
    ],
  },
  {
    id: 'mage_60',
    archetypeId: 'mage',
    tier: 60,
    situation:
      '{이름}이 노트를 내밀었다. 마지막 장에 이 거점의 지도가 그려져 있다. 계산이 아니라 그냥 그림이다. "이건 쓸데없는 페이지야."',
    choices: [
      { text: '"제일 좋은 페이지야."', affinity: 8 },
      { text: '"쓸데없는 것도 기록이잖아."', affinity: 6 },
      { text: '"계산은 어디까지 됐어?"', affinity: -2, factionShift: ['tower', 3] },
    ],
  },
  {
    id: 'mage_80',
    archetypeId: 'mage',
    tier: 80,
    situation:
      '{이름}이 탑으로 돌아가는 경로를 계산한 종이를 보여준다. 답이 나와 있는데, 그 아래 다시 지운 흔적이 있다. "세 번 계산했어. 세 번 다 여기가 나왔어."',
    choices: [
      { text: '"그럼 계산이 맞는 거야."', affinity: 8 },
      { text: '"돌아가고 싶으면 말해."', affinity: 5 },
      { text: '"탑에서 배울 게 더 많을 텐데."', affinity: -2, factionShift: ['tower', 4] },
    ],
  },

  // ─────────────── herbalist 약초사 ───────────────
  {
    id: 'herbalist_20',
    archetypeId: 'herbalist',
    tier: 20,
    situation:
      '{이름}이 약을 짓다가 손을 멈췄다. 재료가 하나 부족하다. "이건 남쪽 늪에만 있어요. 지금은 못 가는 데죠."',
    choices: [
      { text: '"갈 수 있게 되면 같이 갑시다."', affinity: 8 },
      { text: '"대신할 재료는 없습니까?"', affinity: 4 },
      {
        text: '"상인에게 사면 되지 않습니까."',
        affinity: -2,
        factionShift: ['guild', 4],
      },
    ],
  },
  {
    id: 'herbalist_40',
    archetypeId: 'herbalist',
    tier: 40,
    situation:
      '아이 하나가 낫지 않았다. {이름}이 약방을 정리하면서 아무 말도 하지 않는다. 손이 계속 같은 자리를 닦고 있다.',
    choices: [
      { text: '아무 말 없이 남은 정리를 함께 한다.', affinity: 8 },
      { text: '"할 수 있는 건 다 했어요."', affinity: 5 },
      {
        text: '"신전을 세우면 나아질까요."',
        affinity: -2,
        factionShift: ['tower', 3],
      },
    ],
  },
  {
    id: 'herbalist_60',
    archetypeId: 'herbalist',
    tier: 60,
    situation:
      '{이름}이 자기 손을 보여준다. 약초 물이 들어 손톱이 검다. "이거 안 빠져. 예전엔 신경 안 썼는데 요즘 신경 쓰여."',
    choices: [
      { text: '"그 손이 사람을 살렸어."', affinity: 8 },
      { text: '"나는 그게 좋아 보여."', affinity: 6 },
      { text: '"빠지는 방법을 찾아볼까."', affinity: -2, factionShift: ['grove', 3] },
    ],
  },
  {
    id: 'herbalist_80',
    archetypeId: 'herbalist',
    tier: 80,
    situation:
      '{이름}이 약방 문에 이름을 하나 더 새겼다. 자기 이름 옆에 이 거점의 이름이다. "이제 여기 약방이야. 내 약방이 아니고."',
    choices: [
      { text: '"두 이름 다 남겨두자."', affinity: 8 },
      { text: '"그동안 네 약방이어서 다행이었어."', affinity: 6 },
      { text: '"더 큰 약방을 지어줄게."', affinity: -2, factionShift: ['guild', 3] },
    ],
  },

  // ─────────────── envoy 사절 ───────────────
  {
    id: 'envoy_20',
    archetypeId: 'envoy',
    tier: 20,
    situation:
      '{이름}이 서신 두 통을 놓고 고민한다. 내용이 다르다. "하나는 사실이고 하나는 이 땅에 유리합니다. 어느 쪽을 보내야 합니까?"',
    choices: [
      { text: '"사실을 보내세요."', affinity: 8, factionShift: ['oath', 3] },
      { text: '"당신이 판단하세요."', affinity: 5 },
      {
        text: '"유리한 쪽으로."',
        affinity: -2,
        factionShift: ['guild', 5],
      },
    ],
  },
  {
    id: 'envoy_40',
    archetypeId: 'envoy',
    tier: 40,
    situation:
      '{이름}이 왕도에서 받은 명령을 보여준다. 이 땅을 평가해서 보고하라는 내용이다. "제가 뭐라고 쓰든 믿으실 겁니까?"',
    choices: [
      { text: '"믿습니다. 보여준 것만으로 충분해요."', affinity: 8 },
      { text: '"쓰기 전에 한 번 보여주세요."', affinity: 4 },
      {
        text: '"좋게 써주시면 사례하겠습니다."',
        affinity: -2,
        factionShift: ['guild', 4],
      },
    ],
  },
  {
    id: 'envoy_60',
    archetypeId: 'envoy',
    tier: 60,
    situation:
      '{이름}이 차를 두 잔 따라놓고 아무 말도 하지 않는다. 한참 뒤에 말한다. "이렇게 아무 목적 없이 앉아 있는 게 처음이야."',
    choices: [
      { text: '"그럼 자주 하자."', affinity: 8 },
      { text: '"목적이 없어도 되는 자리야."', affinity: 6 },
      { text: '"그럼 이야기나 좀 해볼까. 왕도 소식은?"', affinity: -2, factionShift: ['oath', 3] },
    ],
  },
  {
    id: 'envoy_80',
    archetypeId: 'envoy',
    tier: 80,
    situation:
      '{이름}이 왕도로 돌아오라는 명을 받았다. 답장이 이미 봉해져 있다. "뭐라고 썼는지 안 물어볼 거야?"',
    choices: [
      { text: '"안 물어볼게. 네가 정한 거니까."', affinity: 8 },
      { text: '"뭐라고 썼어?"', affinity: 5 },
      { text: '"가는 게 맞을지도 몰라."', affinity: -2, factionShift: ['oath', 5] },
    ],
  },

  // ─────────────── wanderer 방랑자 ───────────────
  {
    id: 'wanderer_20',
    archetypeId: 'wanderer',
    tier: 20,
    situation:
      '{이름}의 짐이 문 앞에 싸여 있다. 떠나려던 것 같은데 아직 있다. "습관이에요. 매달 한 번씩 싸요. 나가지는 않고."',
    choices: [
      { text: '"싸두는 것도 괜찮죠. 안 나가면 되니까."', affinity: 8 },
      { text: '"나가고 싶어지면 말해요."', affinity: 5 },
      {
        text: '"짐을 풀어두는 게 편할 텐데요."',
        affinity: -2,
        factionShift: ['grove', 3],
      },
    ],
  },
  {
    id: 'wanderer_40',
    archetypeId: 'wanderer',
    tier: 40,
    situation:
      '{이름}이 전에 있던 곳 이야기를 시작했다가 멈췄다. "불탔다고만 말했죠. 그게 다는 아니에요." 더 말할지 말지 재고 있다.',
    choices: [
      { text: '"오늘 안 해도 돼요."', affinity: 8 },
      { text: '"듣고 있어요."', affinity: 6 },
      {
        text: '"알아야 도울 수 있어요."',
        affinity: -2,
        factionShift: ['tower', 3],
      },
    ],
  },
  {
    id: 'wanderer_60',
    archetypeId: 'wanderer',
    tier: 60,
    situation:
      '{이름}이 자기 이름이 가짜라고 했다. "오래 쓴 이름이긴 해. 진짜 이름은 이제 나도 안 써." 뭔가를 기다리는 눈이다.',
    choices: [
      { text: '"오래 쓴 이름이 진짜 이름이야."', affinity: 8 },
      { text: '"진짜 이름은 안 물어볼게."', affinity: 6 },
      { text: '"진짜 이름을 알고 싶어."', affinity: -2, factionShift: ['tower', 3] },
    ],
  },
  {
    id: 'wanderer_80',
    archetypeId: 'wanderer',
    tier: 80,
    situation:
      '{이름}이 짐을 다 풀어서 방에 늘어놨다. 생각보다 물건이 많다. 오래 들고 다닌 것들이다. "이거 다 어디 둬야 하지."',
    choices: [
      { text: '"둘 자리를 같이 만들자."', affinity: 8 },
      { text: '"천천히 정하면 돼."', affinity: 6 },
      { text: '"안 쓰는 건 팔면 되지."', affinity: -2, factionShift: ['guild', 4] },
    ],
  },
];
