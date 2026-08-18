/**
 * 지역 사건 (§11 — 사건 노드).
 *
 * **새로 쓴 파일이다.** 수정 금지 목록의 `region-text.ts` 는 판정 등급별
 * 서술(96문장 + 동행 24문장)이라 선택지가 없다. 그 파일을 건드리지 않고
 * 여기에 따로 둔다 — `rival-events.ts` 와 같은 방식이다.
 *
 * §11 은 사건 노드를 "텍스트 사건, 세력 평판이나 소량 XP" 로 정했다.
 * **전리품 판정이 아니다.** 그래서 1d20 을 굴리지 않는다 —
 * 노드 셋이 전부 같은 주사위를 굴리니 지역이 단조로웠다.
 *
 * 문체는 §15 를 따른다.
 *   - 상황과 결과는 **무주어 문어체 과거형**. 2인칭을 쓰지 않는다
 *   - 선택지는 지금 하는 행동을 적는다. 따옴표 안은 말한 그대로
 *
 * 토큰: `{거점}` 마을 이름, `{동료}` 동행자 이름.
 */

import type { FactionId, ResourceId } from '@/types/game';

export interface RegionChoice {
  text: string;
  /** 고른 뒤 남는 한 줄. 무주어 문어체 과거형 */
  result: string;
  /** 소량 XP (§11). 판정 XP 보다 훨씬 작다 */
  xp?: number;
  /** 세력 평판 */
  faction?: { id: FactionId; delta: number };
  /** 자원. 음수면 잃는다 */
  resources?: Partial<Record<ResourceId, number>>;
  /** 기력. 음수면 잃는다 */
  hp?: number;
  /** 동행자 호감. 동행이 없으면 무시된다 */
  affinity?: number;
  /** 유물을 한 번 굴린다 */
  relic?: boolean;
}

export interface RegionEvent {
  id: string;
  /** 이 지역들에서만 나온다. 비면 어디서나 */
  regions?: string[];
  /** 동행자가 있어야 나온다 */
  needsEscort?: boolean;
  situation: string;
  choices: RegionChoice[];
}

export const REGION_EVENTS: RegionEvent[] = [
  {
    id: 'cart',
    situation:
      '길가에 짐수레가 뒤집혀 있었다. 끌던 짐승도 몰던 사람도 보이지 않았다.',
    choices: [
      {
        text: '쓸 만한 것만 챙긴다.',
        result: '바퀴 아래 깔린 것들을 꺼냈다. 주인이 돌아올 자리는 아니었다.',
        resources: { wood: 6, food: 4 },
        xp: 4,
      },
      {
        text: '수레를 세워 길가로 밀어 둔다.',
        result: '수레를 바로 세워 길에서 치웠다. 다음에 지날 사람은 이 자리를 모를 것이다.',
        faction: { id: 'guild', delta: 4 },
        xp: 6,
        hp: -1,
      },
      {
        text: '그냥 지나친다.',
        result: '보고도 지나쳤다. 몇 걸음 뒤에 한 번 돌아보았다.',
        xp: 3,
      },
    ],
  },

  {
    id: 'marks',
    situation:
      '나무껍질에 칼자국으로 표식이 새겨져 있었다. 최근 것이었고, 하나가 아니었다.',
    choices: [
      {
        text: '표식을 따라간다.',
        result: '표식은 바위 틈에서 끊겼다. 그 안에 누가 두고 간 것이 있었다.',
        relic: true,
        resources: { gold: 8 },
        hp: -2,
      },
      {
        text: '표식을 지운다.',
        result: '칼자국을 덧그어 못 읽게 만들었다. 누구를 위한 것인지 알 수 없었으므로.',
        faction: { id: 'oath', delta: 4 },
        xp: 5,
      },
      {
        text: '모양을 적어 두고 지나친다.',
        result: '표식의 모양을 옮겨 적었다. {거점}에서 아는 사람을 찾으면 될 일이다.',
        faction: { id: 'tower', delta: 3 },
        xp: 7,
      },
    ],
  },

  {
    id: 'lost',
    situation: '누군가 길을 잃고 바위에 앉아 있었다. 며칠은 굶은 얼굴이었다.',
    choices: [
      {
        text: '{거점}까지 데려다준다.',
        result: '먹을 것을 나누고 길 끝까지 함께 걸었다. 이름은 묻지 않았다.',
        resources: { food: -5 },
        faction: { id: 'guild', delta: 5 },
        xp: 5,
      },
      {
        text: '길만 일러 준다.',
        result: '해가 지는 쪽을 가리키고 갈라섰다. 그 뒤는 모른다.',
        xp: 4,
      },
    ],
  },

  {
    id: 'rubble',
    regions: ['gate', 'peaks', 'deep'],
    situation: '무너진 돌더미가 길을 반쯤 막고 있었다. 위쪽이 더 무너질 수도 있었다.',
    choices: [
      {
        text: '치우고 지나간다.',
        result: '한나절을 들여 돌을 옮겼다. 쓸 만한 것은 따로 골라 두었다.',
        resources: { stone: 10 },
        hp: -3,
        xp: 5,
      },
      {
        text: '돌아서 간다.',
        result: '먼 길로 돌았다. 등 뒤에서 돌 구르는 소리가 한 번 났다.',
        xp: 4,
      },
    ],
  },

  {
    id: 'rain',
    regions: ['whisper', 'marsh'],
    situation: '비가 내리기 시작했다. 그칠 비인지 아닌지는 알 수 없었다.',
    choices: [
      {
        text: '나무 아래에서 기다린다.',
        result: '비가 잦아들 때까지 앉아 있었다. 잃은 것은 시간뿐이었다.',
        xp: 3,
      },
      {
        text: '젖은 채로 걷는다.',
        result: '비를 맞으며 계속 걸었다. 남들이 피한 자리에 남은 것이 있었다.',
        resources: { food: 7, gold: 3 },
        hp: -2,
        xp: 5,
      },
    ],
  },

  {
    id: 'smoke',
    situation: '멀리서 연기가 한 줄 올랐다. 불이 난 것치고는 너무 가늘었다.',
    choices: [
      {
        text: '가까이 가 본다.',
        result: '꺼진 지 얼마 안 된 모닥불이었다. 둘러앉았던 자국이 넷이었다.',
        resources: { gold: 10 },
        hp: -2,
        xp: 6,
      },
      {
        text: '반대쪽으로 돈다.',
        result: '연기를 등지고 걸었다. 누가 피운 불인지 끝내 알지 못했다.',
        xp: 4,
      },
    ],
  },

  {
    id: 'shrine',
    situation:
      '길 옆에 오래된 사당이 있었다. 돌 위에 마른 것들이 놓여 있었고, 아직 썩지 않았다.',
    choices: [
      {
        text: '금화를 놓고 간다.',
        result: '동전 몇 닢을 돌 위에 얹었다. 무엇에 비는지도 모르면서.',
        resources: { gold: -8 },
        faction: { id: 'grove', delta: 5 },
        xp: 4,
      },
      {
        text: '고개만 숙이고 지나친다.',
        result: '아무것도 놓지 않고 아무것도 가져가지 않았다.',
        xp: 4,
      },
      {
        text: '놓인 것을 가져간다.',
        result: '돌 위의 것을 쓸어 담았다. 뒤가 서늘했으나 돌아보지 않았다.',
        resources: { gold: 14 },
        faction: { id: 'grove', delta: -6 },
        xp: 3,
      },
    ],
  },

  {
    id: 'fork',
    needsEscort: true,
    situation:
      '길이 둘로 갈렸다. {동료}는 한쪽을 한참 보더니 반대쪽을 가리켰다. 이유는 말하지 않았다.',
    choices: [
      {
        text: '{동료}의 말을 따른다.',
        result: '{동료}가 고른 길로 갔다. 왜 그랬는지는 끝까지 묻지 않았다.',
        affinity: 6,
        xp: 5,
      },
      {
        text: '가려던 길로 간다.',
        result: '먼저 정한 길로 갔다. 얻은 것은 있었고, {동료}는 말이 줄었다.',
        resources: { stone: 8, gold: 6 },
        affinity: -3,
        xp: 5,
      },
    ],
  },
];
