/**
 * 지역 배치 점검 — 빌드 도구다.
 *
 *   npx tsx scripts/check-region.ts [지역id]
 *
 * 표식이 정말 길 위에 있고 입구에서 걸어 닿는지 확인한다.
 * 손으로 돌아다니며 찾는 것보다 이쪽이 확실하다.
 */

import { buildRegionMap, REGION_ENTRY } from '../src/data/maps/region';
import { isBlocked } from '../src/systems/map';
import { REGIONS } from '../src/data/regions';

const only = process.argv[2];
const ids = only === undefined ? REGIONS.map((r) => r.id) : [only];

let allOk = true;

for (const id of ids) {
  const map = buildRegionMap(id);
  const nodes = map.objects.filter((o) => o.nodeKind !== undefined);

  // 입구에서 막히지 않은 칸을 전부 훑는다
  const seen = new Set<string>([`${REGION_ENTRY.x},${REGION_ENTRY.y}`]);
  const queue = [{ x: REGION_ENTRY.x, y: REGION_ENTRY.y }];
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

  const unreachable = nodes.filter((n) => !seen.has(`${n.x},${n.y}`));
  const ok = unreachable.length === 0;
  if (!ok) allOk = false;

  console.log(
    `${ok ? 'OK ' : '실패'} ${id.padEnd(8)} 노드 ${nodes.length}개  ` +
      `걸을 수 있는 칸 ${seen.size}/${map.width * map.height}  ` +
      nodes.map((n) => `${n.nodeKind === 'loot' ? '전리품' : '사건'}(${n.x},${n.y})`).join(' '),
  );
  if (!ok) {
    console.log(`   닿지 않는 노드: ${unreachable.map((n) => `(${n.x},${n.y})`).join(' ')}`);
  }
}

if (!allOk) process.exitCode = 1;
