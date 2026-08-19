/**
 * 문 왕복 점검 — 빌드 도구다.
 *
 *   npx tsx scripts/check-doors.ts
 *
 * 들어가고 나올 때 서는 자리가 **걸을 수 있는 칸인지** 본다.
 * 나올 때 문 위가 아니라 문 앞에 서야 하고, 그 칸이 막혀 있으면 안 된다.
 */

import { buildTownMap } from '../src/data/maps/town';
import { buildIndoorMap, INDOOR_ENTRY } from '../src/data/maps/indoor';
import { isBlocked } from '../src/systems/map';
import { BUILDINGS } from '../src/data/buildings';

let ok = true;

for (const eraIndex of [0, 1, 2, 3, 4, 5]) {
  for (const level of [1, 4, 12]) {
    const buildings: Record<string, number> = {};
    for (const b of BUILDINGS) buildings[b.id] = level;
    const town = buildTownMap({ eraIndex, buildings });

    for (const door of town.objects.filter((o) => o.building !== undefined)) {
      // 나오는 자리 = 문 아래 한 칸
      const front = { x: door.x, y: door.y + 1 };
      const usable = !isBlocked(town, front.x, front.y);
      if (!usable) {
        ok = false;
        console.log(`실패 시대 ${eraIndex} lv${level} ${door.building} — 문 앞(${front.x},${front.y})이 막혔다`);
      }

      // 들어가는 자리
      if (BUILDINGS.find((b) => b.id === door.building)?.indoor !== true) continue;
      const inside = buildIndoorMap({ buildingId: door.building!, eraIndex });
      if (isBlocked(inside, INDOOR_ENTRY.x, INDOOR_ENTRY.y)) {
        ok = false;
        console.log(`실패 ${door.building} 실내 입구가 막혔다`);
      }
    }
  }
}

console.log(ok ? 'OK  모든 문의 안팎 자리가 걸을 수 있다' : '실패');
if (!ok) process.exitCode = 1;
