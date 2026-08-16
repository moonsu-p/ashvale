/**
 * 조작 입력 버퍼.
 *
 * D패드·키보드가 여기에 쓰고, 씬이 매 프레임 읽는다.
 * 눌려 있는 방향은 게임 상태가 아니라 손가락 상태라서 zustand 에 넣지 않는다 —
 * 60fps 로 스토어를 흔들면 React 가 통째로 다시 그린다.
 *
 * 입력의 **결과**(한 칸 이동·방향 전환)는 씬이 스토어 액션으로 올린다.
 * 상태를 바꾸는 길은 그쪽 하나뿐이다.
 */

import type { Dir } from '@/types/game';

export interface InputSnapshot {
  /** 지금 눌려 있는 방향 */
  held: Dir | null;
  /** 누를 때마다 증가. 씬이 "새로 눌렸다"를 알아채는 데 쓴다 */
  pressCount: number;
  /** A 를 누를 때마다 증가 */
  actionCount: number;
}

const state: InputSnapshot = { held: null, pressCount: 0, actionCount: 0 };

/**
 * A 를 누를 때 알려 줄 곳. 대화 레이어가 여기 붙는다.
 * 씬은 매 프레임 읽어 가지만, React 쪽은 60fps 로 훑을 수 없어 알림이 필요하다.
 */
const actionListeners = new Set<() => void>();

export function onActionPress(fn: () => void): () => void {
  actionListeners.add(fn);
  return () => actionListeners.delete(fn);
}

export function pressDir(dir: Dir): void {
  state.held = dir;
  state.pressCount += 1;
}

/** 놓은 방향이 지금 눌린 것과 같을 때만 푼다. 두 손가락으로 굴릴 때 끊기지 않게 */
export function releaseDir(dir: Dir): void {
  if (state.held === dir) state.held = null;
}

export function releaseAll(): void {
  state.held = null;
}

export function pressAction(): void {
  state.actionCount += 1;
  for (const fn of actionListeners) fn();
}

export function readInput(): InputSnapshot {
  return state;
}
