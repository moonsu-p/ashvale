/**
 * 에셋 매니페스트 — 파일 경로를 코드에 박지 않기 위한 유일한 출처.
 *
 * 규칙 (CLAUDE.md, docs/ASSETS.md):
 *  - `path` 가 null 이면 아직 파일이 없다. 플레이스홀더를 그리고 **게임은 그대로 돈다.**
 *  - Kenney 타일셋은 `spacing: 1`, 캐릭터 팩은 `spacing: 0`. 값을 공유하지 않는다.
 *  - 여기 없는 에셋은 프로젝트에 넣지 않는다.
 *
 * 지금은 전부 null 이다. 원본 타일셋은 아직 받지 않았고, 캐릭터 15장은
 * raw-assets 에 있지만 어느 장이 누구인지는 배역을 정하면서 확정한다
 * (src/data/characters.ts 의 배정 지침).
 */

import type { PaletteKey } from './palette';
import { CHAR_SHEET, CHAR_ROSTER } from './characters';

export type AssetKind = 'tileset' | 'character' | 'ui' | 'illustration';

export interface SheetSpec {
  frameWidth: number;
  frameHeight: number;
  spacing: number;
  margin: number;
  columns?: number;
  rows?: number;
}

export interface AssetLicense {
  source: string;
  type: string;
}

export interface AssetEntry {
  id: string;
  kind: AssetKind;
  /** public/ 기준 상대 경로. null 이면 미조달 */
  path: string | null;
  sheet?: SheetSpec;
  /** 파일이 없을 때 대신 그릴 것 */
  placeholder: {
    label: string;
    color: PaletteKey;
    /** 플레이스홀더 한 장의 크기. 없으면 sheet 프레임 크기를 쓴다 */
    width?: number;
    height?: number;
  };
  license?: AssetLicense;
}

/** Kenney 계열 공통 시트 값. 1px 간격이 있다 — 16으로 그냥 자르면 밀린다 */
const KENNEY_SHEET: SheetSpec = {
  frameWidth: 16,
  frameHeight: 16,
  spacing: 1,
  margin: 0,
};

const KENNEY_CC0 = (source: string): AssetLicense => ({ source, type: 'CC0-1.0' });

const TILESETS: AssetEntry[] = [
  {
    id: 'tiles.town',
    kind: 'tileset',
    path: null,
    sheet: KENNEY_SHEET,
    placeholder: { label: '마을 타일', color: 'grass' },
    license: KENNEY_CC0('https://kenney.nl/assets/tiny-town'),
  },
  {
    id: 'tiles.dungeon',
    kind: 'tileset',
    path: null,
    sheet: KENNEY_SHEET,
    placeholder: { label: '대공동 타일', color: 'slate' },
    license: KENNEY_CC0('https://kenney.nl/assets/tiny-dungeon'),
  },
  {
    id: 'tiles.map',
    kind: 'tileset',
    path: null,
    sheet: KENNEY_SHEET,
    placeholder: { label: '길·다리 타일', color: 'dirt' },
    license: KENNEY_CC0('https://kenney.nl/assets/map-pack'),
  },
];

/** 캐릭터 시트 값은 characters.ts 에서 그대로 가져온다. 다시 적지 않는다 */
const CHARACTER_SHEET: SheetSpec = {
  frameWidth: CHAR_SHEET.frameWidth,
  frameHeight: CHAR_SHEET.frameHeight,
  spacing: CHAR_SHEET.spacing,
  margin: CHAR_SHEET.margin,
  columns: CHAR_SHEET.columns,
  rows: CHAR_SHEET.rows,
};

/** 역할별 플레이스홀더 색. 배역이 정해지기 전에도 서로 구분되게 */
const ROLE_COLOR: Record<'hero' | 'companion' | 'patron', PaletteKey> = {
  hero: 'clothCool',
  companion: 'clothWarm',
  patron: 'stone',
};

const CHARACTERS: AssetEntry[] = CHAR_ROSTER.map((slot) => ({
  id: slot.spriteId,
  kind: 'character' as const,
  path: null,
  sheet: CHARACTER_SHEET,
  placeholder: {
    label: slot.bind === '*' ? `${slot.role} 예비` : slot.bind,
    color: ROLE_COLOR[slot.role],
  },
  license: {
    source: 'https://piano-no-renshu.itch.io/top-down-character-sprites',
    type: 'CC0-1.0',
  },
}));

export const ASSETS: readonly AssetEntry[] = [...TILESETS, ...CHARACTERS];

const BY_ID = new Map(ASSETS.map((a) => [a.id, a]));

export function getAsset(id: string): AssetEntry | undefined {
  return BY_ID.get(id);
}

/** 파일이 실제로 있는가. 없으면 부르는 쪽은 플레이스홀더로 간다 */
export function hasFile(entry: AssetEntry): boolean {
  return entry.path !== null;
}

/** 아직 조달되지 않은 것들. 디버그 화면이 이걸 보여 준다 */
export function missingAssets(): AssetEntry[] {
  return ASSETS.filter((a) => !hasFile(a));
}
