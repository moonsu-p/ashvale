/**
 * 마을 배치 점검 — 빌드 도구다.
 *
 *   npx tsx scripts/check-town.ts
 *
 * 건물이 최대로 커진 상태에서 **모든 문에 걸어 닿는지** 본다.
 * 채석장이 못에 막혀 영영 못 들어가는 걸 뒤늦게 알았다. 손으로 돌아보는
 * 대신 여기서 잡는다.
 */

import { buildTownMap } from '../src/data/maps/town';
import { isBlocked } from '../src/systems/map';
import { BUILDINGS } from '../src/data/buildings';

const maxed: Record<string, number> = {};
for (const b of BUILDINGS) maxed[b.id] = 12;

let ok = true;

for (const eraIndex of [0, 1, 2, 3, 4, 5]) {
  const map = buildTownMap({ eraIndex, buildings: maxed });

  // 남쪽 길목에서 걸을 수 있는 칸을 전부 훑는다
  const gateway = map.objects.find((o) => o.type === 'gateway');
  if (gateway === undefined) throw new Error('길목이 없다');

  const seen = new Set<string>([`${gateway.x},${gateway.y}`]);
  const queue: { x: number; y: number }[] = [{ x: gateway.x, y: gateway.y }];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const x = cur.x + dx;
      const y = cur.y + dy;
      const key = `${x},${y}`;
      if (seen.has(key) || isBlocked(map, x, y)) continue;
      seen.add(key);
      queue.push({ x, y });
    }
  }

  const doors = map.objects.filter((o) => o.building !== undefined);
  const unreachable = doors.filter((d) => !seen.has(`${d.x},${d.y}`));
  if (unreachable.length > 0) ok = false;

  console.log(
    `${unreachable.length === 0 ? 'OK ' : '실패'} 시대 ${eraIndex}  부지 ${doors.length}개  ` +
      (unreachable.length === 0
        ? '문에 다 닿는다'
        : `못 닿는 문: ${unreachable.map((d) => d.building).join(', ')}`),
  );
}

if (!ok) process.exitCode = 1;
