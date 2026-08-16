/**
 * 온보딩.
 *
 * **스플래시·로고·인트로 애니메이션을 만들지 않는다.**
 * 열면 바로 마을이고, 필요한 말만 그 자리에서 한 줄 준다.
 * 한 번 보면 다시 나오지 않는다 (counters.firsts).
 *
 * 문체: UI 안내라 담백하게. 무엇을 하면 되는지만 말한다 (§15).
 */

export interface Hint {
  /** counters.firsts 에 적히는 열쇠 */
  id: string;
  text: string;
}

export const HINTS: Record<string, Hint> = {
  town: { id: 'hint:town', text: '왼쪽 방향판으로 걷는다. 앞에 무언가 있으면 A.' },
  plot: { id: 'hint:plot', text: '빈 터에 서서 A — 건물을 세운다. 시간은 들지 않는다.' },
  gateway: { id: 'hint:gateway', text: '길목에서 A — 지역으로 나간다. 한 주가 지난다.' },
  node: { id: 'hint:node', text: '표식을 밟으면 판정이 돈다.' },
  approach: { id: 'hint:approach', text: '사람이 먼저 다가온다. 찾아다니지 않아도 된다.' },
};
