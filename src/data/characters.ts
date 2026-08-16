/**
 * 캐릭터 스프라이트 명세 — 실제 파일 분석으로 확정된 값
 * 팩: 15 Top-Down Character Sprites (piano_no_renshu, CC0 1.0)
 *
 * 분석 결과:
 *   시트 크기 64×96, 캐릭터당 PNG 1장
 *   프레임 16×24, 여백·간격 없음 (Kenney 타일셋과 달리 spacing 0)
 *   4열 × 4행 = 16프레임
 *   행 순서: 0=아래, 1=왼쪽, 2=위, 3=오른쪽
 *   열 = 걷기 4프레임. 프레임 1과 3이 동일한 정지 자세, 0과 2가 좌우 발
 *   색 8개 + 투명
 *
 * 주의: 투명 픽셀이 마젠타(255,0,255)에 알파 0으로 저장돼 있다.
 *       알파를 평탄화하는 변환을 거치면 마젠타가 드러난다.
 *       리사이즈·아틀라스 작업에서 알파를 반드시 보존할 것.
 */

export const CHAR_SHEET = {
  frameWidth: 16,
  frameHeight: 24,
  spacing: 0,
  margin: 0,
  columns: 4,
  rows: 4,
  /** 렌더 배율. 32px 타일 위에서 32×48로 보인다 */
  scale: 2,
} as const;

export type Dir = 'down' | 'left' | 'up' | 'right';

/**
 * 행 인덱스.
 *
 * **왼쪽과 오른쪽이 원래 적힌 것과 반대다.** 실제 시트를 프레임 단위로 펼쳐
 * 확인했다 (scripts/frame-sheet.ts) — 행 1 은 얼굴이 오른쪽을 향하고,
 * 행 3 이 왼쪽을 향한다. 위 주석과 기획서 §12 표는 1=왼쪽 3=오른쪽으로
 * 적혀 있지만 파일이 그렇지 않다. 그대로 두면 좌우가 뒤집혀 걷는다.
 */
export const DIR_ROW: Record<Dir, number> = {
  down: 0,
  right: 1,
  up: 2,
  left: 3,
};

/** 걷기 프레임 순서. 그대로 순환시키면 자연스럽다 */
export const WALK_ORDER = [0, 1, 2, 3] as const;

/** 정지 프레임. 프레임 1과 3이 같으므로 1을 쓴다 */
export const IDLE_FRAME = 1;

/** 초당 프레임. 한 칸 이동 140ms에 맞춰 4프레임이 한 걸음에 대략 들어간다 */
export const WALK_FPS = 8;

export function frameIndex(dir: Dir, col: number): number {
  return DIR_ROW[dir] * CHAR_SHEET.columns + col;
}

/**
 * Phaser 로드 예시
 *
 *   this.load.spritesheet('char.seria', 'assets/characters/02.png', {
 *     frameWidth: 16, frameHeight: 24, spacing: 0, margin: 0,
 *   });
 *
 *   for (const dir of ['down','left','up','right'] as Dir[]) {
 *     this.anims.create({
 *       key: `seria-walk-${dir}`,
 *       frames: WALK_ORDER.map(c => ({ key: 'char.seria', frame: frameIndex(dir, c) })),
 *       frameRate: WALK_FPS,
 *       repeat: -1,
 *     });
 *   }
 *
 * Kenney 타일셋은 spacing: 1 이지만 캐릭터 팩은 spacing: 0 이다. 값을 공유하지 말 것.
 */

/** 15종 배역 배정. 파일명은 실제 팩의 것으로 교체한다 */
export interface CharAssignment {
  spriteId: string;
  role: 'hero' | 'companion' | 'patron';
  /** companion이면 원형, patron이면 고정 id */
  bind: string;
}

export const CHAR_ROSTER: CharAssignment[] = [
  { spriteId: 'char.hero',      role: 'hero',      bind: 'hero' },

  // 관계 대상 8자리 — 원형 6종에 배정하고 2자리는 중복 원형용 예비
  { spriteId: 'char.comp.1',    role: 'companion', bind: 'knight' },
  { spriteId: 'char.comp.2',    role: 'companion', bind: 'hunter' },
  { spriteId: 'char.comp.3',    role: 'companion', bind: 'mage' },
  { spriteId: 'char.comp.4',    role: 'companion', bind: 'herbalist' },
  { spriteId: 'char.comp.5',    role: 'companion', bind: 'envoy' },
  { spriteId: 'char.comp.6',    role: 'companion', bind: 'wanderer' },
  { spriteId: 'char.comp.7',    role: 'companion', bind: '*' },  // 중복 원형 등장 시
  { spriteId: 'char.comp.8',    role: 'companion', bind: '*' },

  // 의뢰인 6명 (고정)
  { spriteId: 'char.patron.bartek', role: 'patron', bind: 'bartek' },
  { spriteId: 'char.patron.tova',   role: 'patron', bind: 'tova' },
  { spriteId: 'char.patron.harl',   role: 'patron', bind: 'harl' },
  { spriteId: 'char.patron.oren',   role: 'patron', bind: 'oren' },
  { spriteId: 'char.patron.doran',  role: 'patron', bind: 'doran' },
  { spriteId: 'char.patron.vell',   role: 'patron', bind: 'vell' },
];

/**
 * 배정 지침 (M1에서 구현자가 실제 15장을 보고 확정할 것)
 *  - 의뢰인 6명은 전원 남성으로 보이는 스프라이트를 고른다
 *  - 관계 대상 8자리는 서로 머리색·옷색이 확실히 구분되는 것으로 고른다.
 *    플레이어가 이름을 직접 붙이므로 스프라이트만으로 구별돼야 한다
 *  - 플레이어는 남은 것 중 가장 무난한 것
 *  - 팩의 15종이 성별 분포상 배정이 안 되면, 같은 팩 안에서 재배치하고
 *    그래도 부족하면 색만 바꾼 변형을 만든다 (팔레트 8색 안에서 옷 색 교체)
 */
