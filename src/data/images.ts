/**
 * 인물 이미지 규칙 — 기획서 §9.1.
 *
 * **원본을 참조하지 말고 복사한다.** 플레이어는 사진첩 원본을 지운다.
 * content:// URI, File 핸들, 파일 경로 — 원본을 가리키는 값은 아무것도 저장하지 않는다.
 */

/** 받아들이는 형식 */
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');

/** 원본 8MB 이하 */
export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

/** WebP 재인코딩 품질 */
export const WEBP_QUALITY = 0.85;

/** 슬롯별 목표 크기 (§12 — 초상 512×680, 삽화 900×1200) */
export const SLOT_SIZE = {
  portrait: { width: 512, height: 680 },
  scene: { width: 900, height: 1200 },
} as const;

/** 슬롯 3(사건 삽화)만 큰 규격을 쓴다 (§8.2) */
export function targetSize(slot: number): { width: number; height: number } {
  return slot === 3 ? SLOT_SIZE.scene : SLOT_SIZE.portrait;
}

/** 슬롯 6개 (§8.2) */
export const SLOT_COUNT = 6;

export const SLOT_LABEL: Record<number, string> = {
  0: '기본 초상',
  1: '표정 변화',
  2: '전신',
  3: '사건 삽화',
  4: '트랙 전용',
  5: '회상',
};

/** 총 40MB 초과 시 경고 (8명 × 6슬롯 = 48장 기준) */
export const TOTAL_WARN_BYTES = 40 * 1024 * 1024;

/** 저장 키. 꾸러미 안의 파일 이름과 같은 규칙을 쓴다 (§14) */
export function imageKey(companionId: string, slot: number): string {
  return `companion_${companionId}_slot_${slot}`;
}

export function imageFileName(companionId: string, slot: number): string {
  return `images/${imageKey(companionId, slot)}.webp`;
}

/** 업로드를 마치고 한 줄 안내한다 (§9.3) */
export const AFTER_UPLOAD_NOTE = '사진첩의 원본은 지워도 됩니다.';
