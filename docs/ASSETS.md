# ASSETS.md — 에셋 조달과 라이선스 기록

기획서 §11.2, §11.3 대응. **여기 없는 에셋은 프로젝트에 넣지 않는다.**

## 타일셋 — 쓰지 않기로 했다

**지형은 외부 타일셋 대신 팔레트 색으로 직접 그린다.**

| 팩 | 상태 |
|---|---|
| **15 Top-Down Character Sprites** | **채택.** 필드 캐릭터 15종 (4방향 걷기), CC0 1.0, [출처](https://piano-no-renshu.itch.io/top-down-character-sprites) |
| Tiny Town / Tiny Dungeon / Map Pack | 미채택 |

받아서 붙이는 대신 16px 타일을 코드로 그린다. 생김새는 `src/data/terrain.ts` 의
`TERRAIN_LOOK` 이 유일한 출처이고, 그리는 일은 `src/render/terrain.ts` 가 한다.

- 팔레트 32색 밖으로 나갈 수가 없으니 색온도가 어긋날 일이 없다
- 대신 **변화가 없다.** 나무는 전부 같은 나무고 벽은 전부 같은 벽이다.
  창문·문틀·잡동사니 같은 잔재미가 없다
- 나중에 타일셋을 쓰기로 하면 `raw-assets/kenney-*/` 에 넣고 `npm run remap` 을
  돌린 뒤 `src/data/assets.ts` 에 항목을 더하면 된다.
  **Kenney 시트는 에셋 사이에 1px 간격이 있다.** 16으로 그냥 자르면 밀린다

### 캐릭터 팩 — 실측 확정값

| 항목 | 값 |
|---|---|
| 시트 | 64×96, 캐릭터당 PNG 1장 |
| 프레임 | 16×24, **spacing 0**, margin 0 |
| 배열 | 4열 × 4행 = 16프레임 |
| 행 | 0=아래, 1=왼쪽, 2=위, 3=오른쪽 |
| 걷기 | 프레임 0→1→2→3 순환. 1·3이 정지 자세 |
| 색 | 8색 + 투명 |

상수는 `src/data/characters.ts`에 있다.

- **투명 픽셀이 마젠타(255,0,255) 알파 0으로 저장돼 있다.** 알파를 평탄화하는 변환을 거치면 분홍이 드러난다. 리사이즈·아틀라스에서 알파를 보존할 것
- **캐릭터 팩은 팔레트 리맵 대상이 아니다.** 8색 16px이라 뭉갠다. `scripts/remap-palette.ts`가 `characters/`를 건너뛴다
- 세계 팔레트를 캐릭터 쪽으로 밝게 조정했다. 최종 40색(세계 32 + 캐릭터 8)

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
  characters/          ← 캐릭터 15장. 리맵에서 제외됨
  kenney-tiny-town/
  kenney-tiny-dungeon/
  kenney-map-pack/
        ↓  npx tsx scripts/remap-palette.ts   (32색 팔레트로 강제)
public/assets/         ← 실제 사용본
```

## 일러스트 — AI 생성 18장

| 항목 | 수량 | 비고 |
|---|---|---|
| 지역 배경 | **0** | v2에서 지역은 걸어다니는 맵이다. 배경 일러스트가 필요 없다 |
| 유물 아이콘 | 12 | Kenney Tiny Dungeon의 아이템 타일로 대체 가능. AI 생성은 선택 |

- 프롬프트는 `illustration-prompts.md`. **고정 접두를 바꾸지 말고, 전량을 한 세션에서 생성한다**
- 일러스트를 쓴다면 `public/assets/illustration/`에 직접 넣는다. 리맵 대상이 아니다
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
