/**
 * 에셋 매니페스트 — 전체 목록과 플레이스홀더 규약
 * 기획서 §11.1, §11.2 준수.
 *
 * 핵심 규칙:
 *  - 코드에 파일 경로를 직접 박지 않는다. 반드시 이 매니페스트를 거친다.
 *  - path가 null이면 렌더러가 색 사각형 + 라벨을 그린다. 게임은 정상 작동해야 한다.
 *  - 에셋 교체는 이 파일에서 path를 채우고 status를 'final'로 바꾸는 것이 전부다.
 *  - ?debugAssets=1 이면 status가 'placeholder'인 것에 PALETTE.rift 외곽선을 그린다.
 */

import { PALETTE } from './palette';

export type AssetKind = 'tile' | 'sprite' | 'illustration' | 'icon' | 'portrait';

export interface AssetEntry {
  id: string;
  kind: AssetKind;
  path: string | null;
  status: 'placeholder' | 'final';
  license?: { source: string; type: 'CC0' | 'AI-generated'; url?: string };
  placeholder: { color: string; label: string };
  /** 타일·스프라이트의 논리 크기 (32px 격자 단위) */
  grid?: [number, number];
}

const ph = (color: string, label: string) => ({ color, label });

function build(
  kind: AssetKind,
  color: string,
  items: [id: string, label: string, grid?: [number, number]][]
): AssetEntry[] {
  return items.map(([id, label, grid]) => ({
    id,
    kind,
    path: null,
    status: 'placeholder' as const,
    placeholder: ph(color, label),
    ...(grid ? { grid } : {}),
  }));
}

// ══════════════════ 지형 타일 (40) ══════════════════
// 조달: Kenney Tiny Town (CC0). 16x16 원본을 ×2 스케일

const TERRAIN = build('tile', PALETTE.grass, [
  ['terrain.grass.0', '풀0'], ['terrain.grass.1', '풀1'], ['terrain.grass.2', '풀2'],
  ['terrain.grass.3', '풀3'], ['terrain.grass.flower', '꽃풀'],
  ['terrain.dirt.0', '흙0'], ['terrain.dirt.1', '흙1'], ['terrain.dirt.2', '흙2'],
  ['terrain.path.h', '길─'], ['terrain.path.v', '길│'],
  ['terrain.path.cross', '길┼'], ['terrain.path.t', '길┬'],
  ['terrain.path.corner.ne', '길└'], ['terrain.path.corner.nw', '길┘'],
  ['terrain.path.corner.se', '길┌'], ['terrain.path.corner.sw', '길┐'],
  ['terrain.path.end', '길끝'],
  ['terrain.water.0', '물0'], ['terrain.water.1', '물1'],
  ['terrain.water.edge.n', '물가N'], ['terrain.water.edge.s', '물가S'],
  ['terrain.water.edge.e', '물가E'], ['terrain.water.edge.w', '물가W'],
  ['terrain.water.corner.ne', '물각NE'], ['terrain.water.corner.nw', '물각NW'],
  ['terrain.water.corner.se', '물각SE'], ['terrain.water.corner.sw', '물각SW'],
  ['terrain.rock.small', '바위小'], ['terrain.rock.large', '바위大'],
  ['terrain.tree.pine', '침엽수'], ['terrain.tree.broad', '활엽수'],
  ['terrain.tree.dead', '고목'], ['terrain.stump', '그루터기'],
  ['terrain.bush', '덤불'], ['terrain.crop.young', '작물幼'],
  ['terrain.crop.ripe', '작물熟'], ['terrain.fence.h', '울타리─'],
  ['terrain.fence.v', '울타리│'], ['terrain.bridge.h', '다리─'],
  ['terrain.bridge.v', '다리│'],
]);

// ══════════════════ 건물 스프라이트 (36 = 12건물 × 3단계) ══════════════════
// 시각 단계는 레벨 1 / 4 / 10 (§5). 점유 타일도 단계별로 커진다

const BUILDING_STAGES: [id: string, label: string, grids: [number, number][]][] = [
  ['hall', '회관', [[2, 2], [2, 2], [3, 3]]],
  ['lumber', '목재소', [[1, 1], [2, 2], [2, 2]]],
  ['farm', '농장', [[2, 1], [2, 2], [3, 2]]],
  ['quarry', '채석장', [[1, 1], [2, 2], [2, 2]]],
  ['yard', '훈련장', [[2, 2], [2, 2], [3, 3]]],
  ['market', '시장', [[2, 2], [3, 2], [3, 3]]],
  ['library', '서고', [[1, 1], [2, 2], [2, 2]]],
  ['shrine', '신전', [[1, 1], [2, 2], [2, 2]]],
  ['guildhall', '길드관', [[2, 2], [3, 3], [3, 3]]],
  ['academy', '마법학당', [[2, 2], [3, 3], [3, 3]]],
  ['spire', '별의 첨탑', [[2, 2], [2, 3], [2, 4]]],
  ['house', '민가', [[1, 1], [1, 1], [2, 2]]],
];

const BUILDINGS: AssetEntry[] = BUILDING_STAGES.flatMap(([id, label, grids]) =>
  grids.map((grid, i) => ({
    id: `building.${id}.s${i + 1}`,
    kind: 'sprite' as const,
    path: null,
    status: 'placeholder' as const,
    placeholder: ph(PALETTE.wood, `${label}${i + 1}`),
    grid,
  }))
);

// ══════════════════ 성벽 타일 (24 = 3재질 × 8) ══════════════════
// 성벽은 둘레 링으로 그린다 (§5). 재질은 레벨 1–3 / 4–9 / 10+

const WALL_PARTS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
const WALL_MATERIALS: [string, string, string][] = [
  ['fence', '울타리', PALETTE.woodLight],
  ['stone', '석벽', PALETTE.stone],
  ['tower', '성벽', PALETTE.stoneLight],
];

const WALLS: AssetEntry[] = WALL_MATERIALS.flatMap(([mat, label, color]) =>
  WALL_PARTS.map((part) => ({
    id: `wall.${mat}.${part}`,
    kind: 'tile' as const,
    path: null,
    status: 'placeholder' as const,
    placeholder: ph(color, `${label}${part}`),
    grid: [1, 1] as [number, number],
  }))
);

// ══════════════════ 주민·적 스프라이트 (10) ══════════════════
// 조달: Kenney Tiny Town(주민) + Tiny Creatures by clintbellanger(적, CC0)

const ACTORS = build('sprite', PALETTE.clothWarm, [
  ['actor.worker.0', '주민0'], ['actor.worker.1', '주민1'],
  ['actor.worker.2', '주민2'], ['actor.worker.3', '주민3'],
  ['actor.hero', '주인공'],
  ['actor.threat.goblins', '고블린'], ['actor.threat.bandits', '도적'],
  ['actor.threat.wolves', '늑대'], ['actor.threat.pilgrims', '순례자'],
  ['actor.threat.riftspawn', '파편'],
]);

// ══════════════════ 관계 원형 실루엣 (6) ══════════════════
// 플레이어가 이미지를 넣지 않았을 때의 대체 초상 (§7.6 슬롯 0 미충족 시)

const ARCHETYPE_SILHOUETTES = build('portrait', PALETTE.clothCool, [
  ['silhouette.knight', '기사'], ['silhouette.hunter', '사냥꾼'],
  ['silhouette.mage', '마법사'], ['silhouette.herbalist', '약초사'],
  ['silhouette.envoy', '사절'], ['silhouette.wanderer', '방랑자'],
]);

// ══════════════════ 관계 대상 상주 스프라이트 (6) ══════════════════
// 연인 도달 시 회관 근처에 상주 (§7.5)

const COMPANION_SPRITES = build('sprite', PALETTE.linen, [
  ['companion.knight', '기사'], ['companion.hunter', '사냥꾼'],
  ['companion.mage', '마법사'], ['companion.herbalist', '약초사'],
  ['companion.envoy', '사절'], ['companion.wanderer', '방랑자'],
]);

// ══════════════════ 의뢰인 스프라이트 + 초상 (12) ══════════════════

const PATRON_IDS: [string, string][] = [
  ['bartek', '바르텍'], ['tova', '토바'], ['harl', '하를'],
  ['oren', '오렌'], ['doran', '도란'], ['vell', '벨'],
];

const PATRONS: AssetEntry[] = [
  ...PATRON_IDS.map(([id, label]) => ({
    id: `patron.sprite.${id}`,
    kind: 'sprite' as const,
    path: null,
    status: 'placeholder' as const,
    placeholder: ph(PALETTE.clothDark, label),
    grid: [1, 1] as [number, number],
  })),
  ...PATRON_IDS.map(([id, label]) => ({
    id: `patron.portrait.${id}`,
    kind: 'portrait' as const,
    path: null,
    status: 'placeholder' as const,
    placeholder: ph(PALETTE.clothDark, `${label}상`),
  })),
];

// ══════════════════ 지역 배경 일러스트 (6) ══════════════════
// 조달: AI 생성. 900×1200 세로 (§10.1). 프롬프트는 일러스트_프롬프트.md

const REGION_ART = build('illustration', PALETTE.slate, [
  ['region.whisper', '속삭이는 숲'], ['region.gate', '무너진 관문'],
  ['region.marsh', '재의 늪'], ['region.peaks', '서리 봉우리'],
  ['region.deep', '지하 대공동'], ['region.rift', '별의 균열'],
]);

// ══════════════════ 유물 아이콘 (12) ══════════════════

const RELIC_ICONS = build('icon', PALETTE.gold, [
  ['relic.compass', '나침반'], ['relic.seal', '인장'],
  ['relic.oathring', '반지'], ['relic.scale', '저울추'],
  ['relic.seedjar', '항아리'], ['relic.ledgerstone', '셈돌'],
  ['relic.frostlens', '렌즈'], ['relic.bannerpole', '깃대'],
  ['relic.echostone', '메아리돌'], ['relic.deepvein', '광석'],
  ['relic.starshard', '별조각'], ['relic.unspoken', '하지않은말'],
]);

// ══════════════════ UI 아이콘 (16) ══════════════════

const UI_ICONS = build('icon', PALETTE.inkSoft, [
  ['ui.wood', '목재'], ['ui.stone', '석재'], ['ui.food', '식량'], ['ui.gold', '금화'],
  ['ui.might', '힘'], ['ui.agility', '민첩'], ['ui.insight', '통찰'], ['ui.will', '의지'],
  ['ui.hp', '체력'], ['ui.xp', '경험'], ['ui.defense', '방어'], ['ui.affinity', '호감'],
  ['ui.season.spring', '봄'], ['ui.season.summer', '여름'],
  ['ui.season.autumn', '가을'], ['ui.season.winter', '겨울'],
]);

// ══════════════════ 통합 ══════════════════

export const ASSETS: AssetEntry[] = [
  ...TERRAIN,
  ...BUILDINGS,
  ...WALLS,
  ...ACTORS,
  ...ARCHETYPE_SILHOUETTES,
  ...COMPANION_SPRITES,
  ...PATRONS,
  ...REGION_ART,
  ...RELIC_ICONS,
  ...UI_ICONS,
];

export const ASSET_MAP: Record<string, AssetEntry> = Object.fromEntries(
  ASSETS.map((a) => [a.id, a])
);

/** 개발 중 진행률 확인용 */
export function assetProgress() {
  const total = ASSETS.length;
  const done = ASSETS.filter((a) => a.status === 'final').length;
  return { total, done, remaining: total - done };
}

/**
 * 렌더러가 호출한다. path가 없으면 null을 돌려주고,
 * 호출부는 placeholder 정보로 색 사각형 + 라벨을 그린다.
 */
export function resolveAsset(id: string): AssetEntry | null {
  const entry = ASSET_MAP[id];
  if (!entry) {
    const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } };
    if (meta.env?.DEV) console.warn(`[assets] 알 수 없는 id: ${id}`);
    return null;
  }
  return entry;
}
