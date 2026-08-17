/**
 * 실내 (§6, §10).
 *
 * 문 타일을 밟고 A 를 누르면 들어온다. 밖에서 증축 패널만 뜨는 것과 달리
 * 실내가 있는 건물은 **들어가서** 일을 본다.
 *
 * 여기가 §7.6 의 대비를 살리는 자리다 —
 * **관계 대상은 마을에서 먼저 다가오고, 의뢰인은 찾아가야 만난다.**
 * 의뢰인은 전부 회관에 상주한다 (§10 회관 실내: 의뢰인 상주).
 *
 * **임시다.** Tiled 로 그린 실내가 들어오면 이 파일을 지운다.
 */

import type { MapObject, Terrain, TileMapData } from '@/types/map';
import { getBuilding } from '@/data/buildings';
import { PATRON_VOICES } from '@/data/content/patron-dialogue';
import { CHAR_ROSTER } from '@/data/characters';

const W = 13;
const H = 9;

/** 나가는 문. 남쪽 가운데 */
const EXIT_X = Math.floor(W / 2);

export const INDOOR_ENTRY = { x: EXIT_X, y: H - 2, dir: 'up' } as const;

/** 실내 맵 id 는 'indoor:hall' 꼴이다 (§4) */
export function indoorMapId(buildingId: string): string {
  return `indoor:${buildingId}`;
}

export function buildingIdFromIndoor(mapId: string): string | null {
  return mapId.startsWith('indoor:') ? mapId.slice('indoor:'.length) : null;
}

/** 시대별 등장 의뢰인 (§7.6). 전부 회관에 있다 */
const PATRON_ERA: Record<string, number> = {
  bartek: 0,
  tova: 1,
  harl: 1,
  oren: 2,
  doran: 2,
  vell: 3,
};

function patronSprite(patronId: string): string {
  return (
    CHAR_ROSTER.find((s) => s.role === 'patron' && s.bind === patronId)?.spriteId ??
    'char.patron.bartek'
  );
}

export interface IndoorContext {
  buildingId: string;
  eraIndex: number;
  /** 숙소에 상주하는 인물 (§7.4 수락 → 마을에 상주 위치가 생긴다) */
  residents?: { id: string; archetypeId: string }[];
}

function companionSprite(archetypeId: string): string {
  return (
    CHAR_ROSTER.find((s) => s.role === 'companion' && s.bind === archetypeId)?.spriteId ??
    'char.comp.1'
  );
}

export function buildIndoorMap(ctx: IndoorContext): TileMapData {
  const size = W * H;
  const ground: Terrain[] = new Array<Terrain>(size).fill('floor');
  const deco: (Terrain | null)[] = new Array<Terrain | null>(size).fill(null);
  const collision: boolean[] = new Array<boolean>(size).fill(false);
  const objects: MapObject[] = [];

  const at = (x: number, y: number) => y * W + x;
  const put = (x: number, y: number, t: Terrain, solid: boolean) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    ground[at(x, y)] = t;
    collision[at(x, y)] = solid;
  };

  // 벽
  for (let x = 0; x < W; x++) {
    put(x, 0, 'wall', true);
    put(x, 1, 'wall', true);
    put(x, H - 1, 'wall', true);
  }
  for (let y = 0; y < H; y++) {
    put(0, y, 'wall', true);
    put(W - 1, y, 'wall', true);
  }

  // 가운데 깔개
  for (let y = 3; y <= H - 3; y++) {
    for (let x = 4; x <= W - 5; x++) put(x, y, 'rug', false);
  }

  // 나가는 문
  put(EXIT_X, H - 1, 'door', false);
  objects.push({
    id: 'indoor-exit',
    type: 'gateway',
    x: EXIT_X,
    y: H - 1,
    target: 'town',
    solid: false,
  });

  // 안쪽 벽에 붙은 탁자. 여기 서서 증축한다
  for (let x = 2; x <= W - 3; x++) put(x, 2, 'counter', true);
  objects.push({
    id: `indoor-desk-${ctx.buildingId}`,
    type: 'node',
    x: 2,
    y: 3,
    solid: false,
    building: ctx.buildingId,
  });

  // 시장 — 판매대에서 교역과 선물을 본다 (§10)
  if (ctx.buildingId === 'market') {
    objects.push({
      id: 'market-counter',
      type: 'node',
      x: EXIT_X,
      y: 3,
      solid: false,
      shop: true,
    });
  }

  /**
   * 숙소 — 상주하는 인물이 여기 산다 (§10 관계 대상 상주 자리, §7.4).
   * 고백을 받아들이면 마을에 상주 위치가 생긴다. 그게 여기다 —
   * 찾아갈 데가 생겨야 관계가 자리를 얻는다.
   */
  if (ctx.buildingId === 'lodge') {
    (ctx.residents ?? []).forEach((who, i) => {
      const x = 3 + i * 3;
      if (x >= W - 2) return;
      objects.push({
        id: `resident-${who.id}`,
        type: 'npc',
        x,
        y: 4,
        sprite: companionSprite(who.archetypeId),
        voice: { kind: 'companion', id: who.archetypeId },
        solid: true,
      });
    });
  }

  // 의뢰인은 회관에 상주한다 (§7.6, §10)
  if (ctx.buildingId === 'hall') {
    const present = Object.keys(PATRON_VOICES).filter(
      (id) => ctx.eraIndex >= (PATRON_ERA[id] ?? 99),
    );
    present.forEach((patronId, i) => {
      // 탁자 앞에 나란히 선다
      const x = 4 + i * 2;
      if (x >= W - 2) return;
      objects.push({
        id: `patron-${patronId}`,
        type: 'npc',
        x,
        y: 3,
        sprite: patronSprite(patronId),
        voice: { kind: 'patron', id: patronId },
        solid: true,
      });
    });
  }

  return {
    id: indoorMapId(ctx.buildingId),
    width: W,
    height: H,
    ground,
    deco,
    collision,
    objects,
  };
}

/** 그 건물에 들어갈 수 있는가. 지어져 있고 실내가 있어야 한다 */
export function hasIndoor(buildingId: string, level: number): boolean {
  return level > 0 && getBuilding(buildingId)?.indoor === true;
}
