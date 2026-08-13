/**
 * 온보딩 — §16.2. 스플래시·로고·인트로 애니메이션 없음(§15.3 재개 3초).
 * 도입 문장은 기획서 §16.2 의 것을 그대로 쓴다(문어체).
 */

/** 도입 3문장 (탭하면 즉시 거점 화면) */
export const INTRO_LINES = [
  '변방의 이름 없는 땅에 천막을 세웠다.',
  '왕도의 지도에는 아직 이곳이 없다.',
  '첫 주가 시작된다.',
];

export const DEFAULT_HERO_NAME = '무명';
export const DEFAULT_SETTLEMENT_NAME = '아쉬베일';

/** 과제 카드 — 순서 고정, 문어체 한 줄 (§16.2). 다섯을 마치면 사라진다. */
export interface Task {
  id: string;
  label: string;
}

export const ONBOARDING_TASKS: Task[] = [
  { id: 'farm', label: '농장을 세운다.' },
  { id: 'explore', label: '속삭이는 숲을 탐험한다.' },
  { id: 'lumber', label: '목재소를 세운다.' },
  { id: 'seria', label: '세리아와 교류한다.' }, // 세리아 등장·교류는 M7
  { id: 'era1', label: '정착기에 이른다.' },
];
