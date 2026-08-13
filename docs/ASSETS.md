# ASSETS.md — 에셋 조달과 라이선스 기록

기획서 §11.2, §11.3 대응. **여기 없는 에셋은 프로젝트에 넣지 않는다.**

## 타일셋 — Kenney 계열로 통일

한 작가의 계열로 맞추면 §10.2 팔레트 리맵 부담이 크게 줄고 스타일이 처음부터 붙는다.

| 팩 | 용도 | 수량 | 라이선스 | 출처 |
|---|---|---|---|---|
| **Tiny Town** | 지형, 건물, 주민 | 130 | CC0 1.0 | https://kenney.nl/assets/tiny-town |
| **Tiny Dungeon** | 지하 대공동, 관문, 아이템 | 130+ | CC0 1.0 | https://kenney.nl/assets/tiny-dungeon |
| **Tiny Creatures** (clintbellanger) | 위협 스프라이트 | 180 | CC0 1.0 | https://opengameart.org/content/tiny-creatures |
| **Map Pack** (보조) | 길·다리·지형 보강 | 180 | CC0 1.0 | https://kenney.nl/assets/map-pack |

- 전부 **16×16 원본**이며 §10.1의 ×2 스케일(32px 렌더) 규격과 맞는다
- Tiny Creatures는 Tiny Town·Tiny Dungeon과 호환되는 스타일로 제작된 확장이며, Kenney의 허락 아래 만들어졌고 CC0다
- Map Pack은 Tiny 계열과 결이 약간 다르다. **길·다리 등 형태가 단순한 타일만** 골라 쓰고, 반드시 팔레트 리맵을 거친다

### 구현 시 반드시 반영할 것

**Kenney 스프라이트시트는 에셋 사이에 1px 간격을 둔다.** 16으로 그대로 자르면 타일이 밀린다. 아틀라스를 만들거나 Phaser에 로드할 때 `spacing: 1`을 지정한다.

```ts
this.load.spritesheet('town', 'assets/tiny-town.png', {
  frameWidth: 16, frameHeight: 16, spacing: 1, margin: 0,
});
```

`scripts/remap-palette.ts`의 `KENNEY_SHEET` 상수에 같은 값이 있다.

### 처리 순서

```
raw-assets/            ← 내려받은 원본. 읽기 전용으로 취급, 절대 수정하지 않는다
  kenney-tiny-town/
  kenney-tiny-dungeon/
  tiny-creatures/
  kenney-map-pack/
        ↓  npx tsx scripts/remap-palette.ts   (32색 팔레트로 강제)
public/assets/         ← 실제 사용본
```

## 일러스트 — AI 생성 18장

| 항목 | 수량 | 규격 | 출처 표기 |
|---|---|---|---|
| 지역 배경 | 6 | 900×1200 세로 WebP | AI-generated |
| 유물 아이콘 | 12 | 128×128 WebP | AI-generated |

- 프롬프트는 `illustration-prompts.md`. **고정 접두를 바꾸지 말고, 전량을 한 세션에서 생성한다**
- **일러스트는 팔레트 리맵 대상이 아니다.** `public/assets/illustration/` 에 직접 넣는다
- 매니페스트에 `license: { source: '...', type: 'AI-generated' }` 로 표기한다

## 관계 대상 이미지 — 플레이어 업로드

| 항목 | 수량 | 출처 |
|---|---|---|
| 관계 대상 초상 | 0 (런타임 업로드) | 플레이어 |

- 프로젝트 저장소에 포함되지 않는다. 기기 로컬에만 저장되며 어디로도 전송되지 않는다(§11.4)
- 갤러리·파일 관리자에 노출되지 않아야 한다(§11.5)
- 직접 만들었거나 사용 권리가 있는 이미지를 넣는다

## 폰트

**한글 웹폰트를 CDN에서 불러오지 않는다.** §12.8 비통신 요구사항을 깨뜨린다.

- 자체 호스팅(번들)만 사용한다. `public/fonts/` 에 두고 `@font-face`로 로드
- 라이선스가 재배포와 웹 임베딩을 허용하는 폰트만 고른다. 선택 후 이 표에 기록할 것
- 픽셀 폰트는 쓰지 않는다(§10.1). 한글 자모 조합에서 품질 확보가 어렵다

| 폰트 | 용도 | 굵기 | 라이선스 | 출처 |
|---|---|---|---|---|
| **Pretendard** | 본문·UI·대화 | 400, 500 | SIL OFL 1.1 | https://github.com/orioncactus/pretendard |
| **Noto Serif KR** | 연대기·시대 전환 | 400 | SIL OFL 1.1 | Google Fonts에서 파일 다운로드 후 자체 호스팅 |

두 폰트 모두 OFL이라 수정·재배포·임베딩이 자유롭다. 폰트 파일 단독 유료 판매만 금지된다.

**서브셋 필수.** 한글 완성형 2350자 + ASCII + 문장부호로 줄인다. 한자와 미사용 라틴 확장은 제외. woff2로 변환하면 굵기당 300~400KB 수준이 된다.

```bash
# 예: fonttools 로 서브셋
pip install fonttools brotli
pyftsubset Pretendard-Regular.otf \
  --unicodes-file=subset-kr.txt \
  --flavor=woff2 --layout-features='*' \
  --output-file=public/fonts/Pretendard-400.woff2
```

Noto Serif KR은 **연대기 탭 첫 진입 시 지연 로딩**한다. 초기 화면에는 필요 없다.

## 금지 사항

- CC0가 아닌 타일셋을 쓰지 않는다. CC-BY도 이 프로젝트에서는 쓰지 않는다 — 표기 관리 비용이 얻는 것보다 크다
- 기존 게임·애니메이션의 캐릭터나 특정 작가 스타일을 재현하려 하지 않는다. 세계관 어휘(변방 개척지, 은빛 서약, 마탑)로 프롬프트를 쓴다
- 실존 인물의 사진을 어떤 슬롯에도 넣지 않는다
