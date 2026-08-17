/**
 * 실내의 목적 자리 (§10).
 *
 * §10 은 이 다섯 건물에 "실내: 있음"만 적어 두고 안에 무엇이 있는지는 정하지
 * 않았다. 효과가 전부 수치라 들어가도 볼 것이 없었다 —
 * **들어가는 행동에 뜻이 없으면 문을 만들 이유도 없다.**
 *
 * 그래서 건물이 이미 하는 일을 방에서 **보이게** 했다. 새 규칙을 만들지 않고,
 * 이미 있는데 쓸 데가 없던 것들을 여기에 붙인다:
 *   - 학당: 레벨업으로 쌓이기만 하던 능력치·기술 포인트를 여기서 쓴다
 *   - 첨탑: 모은 유물을 볼 데가 없었다
 *   - 서고: 지역 정보를 나가기 전에 볼 데가 없었다
 * 신전의 봉납만 새로 만든 것이다 — 금화를 기력으로 바꾸는 자리가 필요했다.
 */

import type { RoomId } from '@/types/map';

export interface RoomDef {
  id: RoomId;
  buildingId: string;
  /** 자리 이름. A 를 눌렀을 때 뜨는 화면의 제목 */
  title: string;
  /** 상호작용 문구 (§5). 동사원형 */
  prompt: string;
}

export const ROOMS: RoomDef[] = [
  { id: 'study', buildingId: 'library', title: '열람대', prompt: '열람' },
  { id: 'altar', buildingId: 'shrine', title: '제단', prompt: '봉납' },
  { id: 'roster', buildingId: 'guildhall', title: '명부', prompt: '명부' },
  { id: 'training', buildingId: 'academy', title: '수련장', prompt: '수련' },
  { id: 'observatory', buildingId: 'spire', title: '관측의', prompt: '관측' },
];

const BY_BUILDING = new Map(ROOMS.map((r) => [r.buildingId, r]));
const BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

export function roomForBuilding(buildingId: string): RoomDef | undefined {
  return BY_BUILDING.get(buildingId);
}

export function getRoom(id: RoomId): RoomDef | undefined {
  return BY_ID.get(id);
}

/**
 * 봉납 (신전).
 *
 * 금화를 기력으로 바꾼다. 신전 레벨이 오르면 한 번에 더 많이 낫는다.
 * **주를 쓰지 않는다** — 쉬는 것과 다른 선택지여야 값이 있다.
 * 대신 금화가 든다. 탐사로 번 것을 다시 탐사에 쏟는 셈이다.
 */
export const OFFERING = {
  /** 기력 1 당 금화. 신전 레벨이 올라도 이 값은 그대로다 */
  goldPerHp: 4,
  /** 한 번에 회복하는 최대치 = 신전 레벨 × 이 값 */
  hpPerLevel: 3,
} as const;
