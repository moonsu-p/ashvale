/**
 * 이미지 슬롯 — §7.6. 슬롯은 관계 진행에 따라 열리고, 열린 자리에 플레이어가 이미지를 넣는다.
 * 슬롯이 비어 있어도 게임은 정상 작동한다(§11.1). 슬롯 0 이 있으면 대체 렌더한다.
 */

export interface SlotDef {
  slot: number;
  label: string;
  /** 해금 호감 (0 은 등장 시) */
  affinity: number;
  /** 권장 긴 변(px) — 재인코딩 축소 기준 */
  longEdge: number;
  desc: string;
}

export const SLOTS: SlotDef[] = [
  { slot: 0, label: '기본 초상', affinity: 0, longEdge: 680, desc: '대화·목록 기본' },
  { slot: 1, label: '표정 변화', affinity: 20, longEdge: 680, desc: '아는 사이' },
  { slot: 2, label: '전신', affinity: 40, longEdge: 960, desc: '동료' },
  { slot: 3, label: '사건 삽화', affinity: 60, longEdge: 1200, desc: '벗' },
  { slot: 4, label: '트랙 전용', affinity: 80, longEdge: 1200, desc: '맹우·연인' },
  { slot: 5, label: '최종', affinity: 100, longEdge: 1200, desc: '100 도달' },
];

export const SLOT_MAP: Record<number, SlotDef> = Object.fromEntries(SLOTS.map((s) => [s.slot, s]));

/** 현재 호감에서 열린 슬롯 번호들 */
export function unlockedSlotsFor(affinity: number): number[] {
  return SLOTS.filter((s) => affinity >= s.affinity).map((s) => s.slot);
}

/** IndexedDB 키 (§11.4) */
export function imageKey(companionId: string, slot: number): string {
  return `companion:${companionId}:slot:${slot}`;
}

/** 업로드 제약 (§11.4) */
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const WEBP_QUALITY = 0.85;
export const TOTAL_WARN_BYTES = 40 * 1024 * 1024;
