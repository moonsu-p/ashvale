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

/**
 * 지형은 갈 때마다 새로 뽑힌다 (§11). 그러니 **한 장만 봐서는 모자란다** —
 * 어떤 뽑기가 나와도 표식에 닿아야 한다. 방문 회차를 여러 개 돌려 본다.
 */
const VISITS = 60;

for (const id of ids) {
 let worst: string | null = null;
 let checked = 0;

 for (let visit = 0; visit < VISITS; visit++) {
  const map = buildRegionMap(id, visit % 2 === 1, visit);
  const nodes = map.objects.filter((o) => o.nodeKind !== undefined);

  // 입구에서 막히지 않은 칸을 전부 훑는다
  const seen = new Set<string>([`${REGION_ENTRY.x},${REGION_ENTRY.y}`]);
  const queue: { x: number; y: number }[] = [{ x: REGION_ENTRY.x, y: REGION_ENTRY.y }];
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
  checked += nodes.length;
  if (unreachable.length > 0 && worst === null) {
    worst = `${visit}회차 — ${unreachable.map((n) => `(${n.x},${n.y})`).join(' ')}`;
  }
 }

 if (worst !== null) allOk = false;
 console.log(
   `${worst === null ? 'OK ' : '실패'} ${id.padEnd(8)} ` +
     `${VISITS}가지 지형 · 노드 ${checked}개 전부 확인` +
     (worst === null ? '' : `
   닿지 않는 노드: ${worst}`),
 );
}

if (!allOk) process.exitCode = 1;
