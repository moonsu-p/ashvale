/**
 * 대화 자료 구조 — 기획서 §8.
 *
 * 대사 문구는 여기서 만들지 않는다. 전부 src/data/content/ 에서 가져온다.
 * 이 파일은 그것을 담아 나르는 그릇일 뿐이다.
 */

import type { FactionId } from './game';

/** 말하는 이가 누구인지. 초상과 말투를 여기서 끌어온다 */
export interface SpeakerRef {
  kind: 'companion' | 'patron';
  /** companion 이면 archetypeId, patron 이면 patronId */
  id: string;
}

/**
 * 초상 지정. 슬롯이 비어 있으면 아래 슬롯으로, 0도 없으면 원형 실루엣 (§8.2).
 * 폴백은 조용히 한다 — 대화 중에 "이미지가 없습니다" 를 띄우지 않는다.
 */
export interface PortraitRef {
  speaker: SpeakerRef;
  /** 쓰고 싶은 슬롯. 없으면 낮은 슬롯으로 내려간다 */
  wantSlot: number;
  /** 실루엣에 쓸 이름표. 이미지가 하나도 없을 때만 보인다 */
  label: string;
}

export interface DialogueOption {
  id: string;
  text: string;
  /** 고르면 이어지는 마무리 대사 한 줄 (§8.3) */
  reply: string;
  /** 고르면 실제로 일어나는 일. 정답은 없다 — 적게 오르는 쪽은 다른 것을 준다 (§8.4) */
  effect?: {
    companionId?: string;
    affinity?: number;
    factionShift?: [FactionId, number];
    /** 소화한 대화 사건 id. 같은 사건이 다시 오지 않게 표시한다 */
    clearedEvent?: string;
  };
}

export interface DialogueScript {
  /** 이름표에 들어갈 이름 */
  speakerName: string;
  portrait: PortraitRef;
  /** 한 줄씩 넘긴다 */
  lines: string[];
  /** 마지막 줄 뒤에 뜬다. 없으면 그대로 닫힌다 */
  choices?: DialogueOption[];
}

/** §8.3 상태 기계: 닫힘 → 열림(타이핑) → 대기(▼) → [다음 줄 | 선택지 | 닫힘] */
export type DialoguePhase = 'typing' | 'waiting' | 'choosing';

export interface DialogueState {
  script: DialogueScript;
  lineIndex: number;
  phase: DialoguePhase;
  /** 선택을 마친 뒤 보여 주는 마무리 대사. 이게 차 있으면 다음 A 에 닫힌다 */
  reply: string | null;
}
