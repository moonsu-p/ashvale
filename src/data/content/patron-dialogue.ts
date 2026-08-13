/**
 * 의뢰인 대사 — 6명 × 8줄 = 48줄
 * 기획서 §7.3, §16.1 준수.
 *
 * 관계 대상과 달리 말투가 관계에 따라 변하지 않는다.
 * 대신 신뢰 단계가 오를수록 주는 정보의 양과 솔직함이 달라진다.
 * 이들은 공략 대상이 아니라 거래 상대이며, 퀘스트 발행권을 독점한다.
 */

export interface PatronVoice {
  patronId: string;
  name: string;
  role: string;
  /** 신뢰 단계별 인사. 정보량이 달라진다 */
  greet: { acquaintance: string; client: string; oldFriend: string };
  /** 퀘스트 제시 */
  questOffer: string;
  /** 진행 중 재방문 */
  questProgress: string;
  /** 완료 보고 */
  questComplete: string;
  /** 거절했을 때 */
  questDecline: string;
  /** 거점이 붕괴한 뒤 다시 만났을 때 (§15.2) */
  afterCollapse: string;
}

export const PATRON_VOICES: Record<string, PatronVoice> = {
  bartek: {
    patronId: 'bartek',
    name: '바르텍',
    role: '상인',
    greet: {
      acquaintance: '물건은 팔고 이야기는 안 팝니다. 필요한 게 있으면 말하세요.',
      client: '이번 달 장부에 당신 이름이 여러 번 있더군요. 나쁜 뜻 아닙니다.',
      oldFriend: '남쪽 길에 도적이 붙었어요. 당신한테만 말하는 겁니다. 값은 안 받고요.',
    },
    questOffer:
      '관문 아래로 길을 하나 낼 생각입니다. 위험한 건 제 몫이 아니고, 당신 몫이죠. 대신 그 길로 사람이 들어옵니다.',
    questProgress: '길은 아직 안 뚫렸군요. 서두르라는 말은 아니고, 계절이 서두르고 있습니다.',
    questComplete:
      '길이 열렸습니다. 첫 짐마차에 사람이 하나 섞여 있었는데, 여기 머물겠다고 하더군요. 제 소개는 아닙니다. 우연이죠.',
    questDecline: '싫으면 안 하셔도 됩니다. 제안은 없어지지 않아요.',
    afterCollapse:
      '다 잃었다고 들었습니다. 장부는 남아 있습니다. 그게 제가 드릴 수 있는 위로입니다.',
  },

  tova: {
    patronId: 'tova',
    name: '토바',
    role: '장인',
    greet: {
      acquaintance: '돌은 거짓말을 안 합니다. 무게만큼만 버텁니다.',
      client: '당신이 올린 벽을 봤습니다. 두 번째 층이 급했네요. 다음엔 천천히 하세요.',
      oldFriend: '내 아버지가 쌓은 벽이 아직 서 있습니다. 그 방식을 가르쳐 드리죠.',
    },
    questOffer:
      '채석장이 작습니다. 저 크기로는 석벽을 못 세워요. 세 배로 키우고 돌 여든을 모아주세요. 그러면 제대로 된 벽을 알려드립니다.',
    questProgress: '돌이 부족합니다. 세는 건 제가 하니까 속이려 하지 마세요.',
    questComplete:
      '이제 석벽을 세울 수 있습니다. 나무 울타리는 겨울 한 번을 못 넘겨요. 이건 손자까지 갑니다.',
    questDecline: '급할 것 없습니다. 돌은 안 도망가요.',
    afterCollapse: '무너진 자리에서 다시 쌓는 게 제일 어렵습니다. 그래도 그게 제 일이죠.',
  },

  harl: {
    patronId: 'harl',
    name: '하를',
    role: '대장장이',
    greet: {
      acquaintance: '무기를 고치러 왔으면 놓고 가세요. 이야기하러 왔으면 나중에 오세요.',
      client: '당신 검을 두 번 갈았습니다. 쓰는 방식이 거칠어요. 그게 나쁜 건 아닙니다.',
      oldFriend:
        '서약의 기사단이 이 땅을 지켜본 지 오래됐습니다. 나쁜 눈으로만 본 건 아니에요.',
    },
    questOffer:
      '서약이 시험을 냈습니다. 위협을 두 번 물리치고 훈련장을 세우세요. 검이 아니라 사람을 시험하는 겁니다.',
    questProgress: '아직입니다. 시험은 기다려주지 않지만, 저는 기다려 드리죠.',
    questComplete:
      '통과했습니다. 서약에서 사람을 하나 보냈어요. 감시자가 아니라 동료로 보냈다고 합니다. 저는 그 말을 믿습니다.',
    questDecline: '시험을 안 받는 것도 하나의 답입니다. 서약은 그것도 기록합니다.',
    afterCollapse:
      '무기는 부러져도 다시 벼릴 수 있습니다. 사람도 그렇다고 믿고 있습니다.',
  },

  oren: {
    patronId: 'oren',
    name: '오렌',
    role: '서기',
    greet: {
      acquaintance: '기록하지 않은 일은 일어나지 않은 일입니다. 그래서 제가 있습니다.',
      client: '당신 연대기를 옮겨 적고 있습니다. 문장이 짧아서 좋군요.',
      oldFriend:
        '탑이 이 땅에 관심을 두고 있습니다. 좋은 관심인지는 저도 모릅니다. 알려드리는 것까지가 제 몫입니다.',
    },
    questOffer:
      '읽을 수 없는 문서가 하나 있습니다. 서고를 두 층 올리고, 고대의 것을 한 번 크게 알아내 오세요. 그러면 이걸 함께 읽을 수 있습니다.',
    questProgress: '아직 읽을 준비가 안 됐습니다. 서두르면 오독합니다.',
    questComplete:
      '읽었습니다. 지도에 없던 땅이 하나 적혀 있었어요. 지금 가면 이릅니다만, 갈 수 있게는 되었습니다.',
    questDecline: '읽지 않기로 한 것도 기록해두겠습니다.',
    afterCollapse:
      '연대기는 남았습니다. 무너진 것은 벽이고, 남은 것은 기록입니다. 그게 순서대로 옳습니다.',
  },

  doran: {
    patronId: 'doran',
    name: '도란',
    role: '촌장',
    greet: {
      acquaintance: '사람이 모이면 싸움이 생기고, 싸움이 생기면 제가 불려 갑니다.',
      client: '올겨울에 굶는 집이 없었습니다. 그건 당신 덕입니다. 인정합니다.',
      oldFriend:
        '이 땅에서 나고 죽은 사람이 벌써 여럿입니다. 그 이름들을 저는 다 압니다.',
    },
    questOffer:
      '농장을 네 층까지 올리고 식량 백스물을 채워두세요. 그러면 사람을 불러올 수 있습니다. 배가 부르지 않은 곳에 사람을 불러오는 건 사기입니다.',
    questProgress: '아직 부족합니다. 사람을 부르기 전에 먹일 것을 세는 게 순서입니다.',
    questComplete:
      '이주민이 도착했습니다. 그중 하나가 남겠다고 하더군요. 짐이 유난히 적었습니다.',
    questDecline: '지금은 때가 아니라는 판단도 판단입니다.',
    afterCollapse:
      '흩어진 사람들이 조금씩 돌아옵니다. 사람은 벽보다 질깁니다.',
  },

  vell: {
    patronId: 'vell',
    name: '벨',
    role: '밀사',
    greet: {
      acquaintance: '제 이름은 한 글자입니다. 그게 편해서요.',
      client: '당신 이름이 세 곳에서 오르내립니다. 세 곳 다 다른 뜻으로요.',
      oldFriend:
        '제가 누구 밑에서 일하는지 궁금하시죠. 저도 요즘 헷갈립니다.',
    },
    questOffer:
      '서신 하나를 두 곳에 전해야 합니다. 두 세력의 신망을 마흔까지 쌓아두세요. 아무나 붙잡고 부탁할 수 있는 일이 아닙니다.',
    questProgress: '아직 문이 안 열렸습니다. 신망은 돈으로 안 됩니다.',
    questComplete:
      '전했습니다. 답장 대신 사람이 왔어요. 어디 소속인지 안 밝히더군요. 그런 사람이 제일 오래 남습니다.',
    questDecline: '전하지 않는 것도 하나의 전언이 됩니다.',
    afterCollapse:
      '소문은 벌써 왕도까지 갔습니다. 다시 세우면 그 소문도 다시 씁니다.',
  },
};
