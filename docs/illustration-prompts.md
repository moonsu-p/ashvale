# 일러스트 프롬프트 18장

기획서 §10.1, §11.2 대응. **이미지는 직접 생성해야 한다** — 이 문서는 스타일 일관성을 확보하기 위한 프롬프트 명세다.

## 사용 규칙

1. **전량을 같은 세션에서 생성한다.** 세션을 나누면 스타일이 갈린다. 이게 이 작업의 유일한 진짜 과제다.
2. 아래 **고정 접두**를 모든 프롬프트 앞에 그대로 붙인다. 한 단어도 바꾸지 않는다.
3. **네거티브 프롬프트**도 매번 같이 넣는다.
4. 생성 후 `raw-assets/` 가 아니라 `public/assets/illustration/` 에 직접 넣는다. **일러스트는 팔레트 리맵 대상이 아니다** — 리맵하면 그린 느낌이 죽는다.
5. 파일명은 `src/data/assets.ts`의 id를 따른다. 예: `region.whisper` → `region-whisper.webp`
6. 넣은 뒤 매니페스트에서 `path`를 채우고 `status`를 `'final'`로 바꾼다.

---

## 고정 접두 (모든 프롬프트 공통)

```
Painted fantasy illustration in the style of 1990s console RPG cover art.
Muted earthy palette: moss green, weathered stone gray, ochre, slate blue, warm amber highlights.
Visible brush texture, soft edges, hand-painted feel. No line art, no cel shading.
Overcast diffuse lighting with one warm light source. Melancholic, quiet, lived-in atmosphere.
No people, no figures, no text, no letters, no logos, no UI elements, no frames or borders.
```

## 네거티브 프롬프트 (공통)

```
photorealistic, 3D render, CGI, anime, manga, cel shaded, vector art, flat design,
neon colors, oversaturated, HDR, lens flare, bokeh, watermark, signature, text,
human figures, faces, characters, modern objects, cute, chibi, sticker
```

---

## 지역 배경 6장 · 900×1200 세로

세로 규격이다(§10.1). 가로로 만들면 폰 화면에서 다시 만들어야 한다.

### 1. `region-whisper` — 속삭이는 숲
```
[고정 접두]
A dense temperate forest interior seen from the forest floor, tall straight trunks
receding into pale mist, thick moss carpeting exposed roots, shafts of weak daylight
falling between trees, a barely visible game trail winding away. Vertical composition,
canopy at top, trail leading to bottom edge.
```

### 2. `region-gate` — 무너진 관문
```
[고정 접두]
A collapsed stone gateway of an abandoned border fortress, a broken arch half buried
in rubble, carved masonry blocks scattered and overgrown with creeping vine, a dark
opening leading down beneath the fallen stones. Overcast sky in the upper third.
Vertical composition.
```

### 3. `region-marsh` — 재의 늪
```
[고정 접두]
A vast ash-covered wetland, still black water reflecting a colorless sky, skeletal
dead trees standing in shallow pools, drifts of gray ash settled on the water surface
like snow, one small dry island of pale grass in the middle distance.
Vertical composition, water dominating the lower two thirds.
```

### 4. `region-peaks` — 서리 봉우리
```
[고정 접두]
A steep frost-covered mountain face, wind-scoured rock and blue-shadowed ice,
a narrow ledge traversing the slope, cloud filling the valley far below,
thin cold sunlight catching the upper ridge. Vertical composition emphasizing height.
```

### 5. `region-deep` — 지하 대공동
```
[고정 접두]
An immense underground cavern, ceiling lost in darkness above, rows of carved stone
pillars disappearing into the dark, a slow underground river crossing the floor,
faint blue mineral glow from the far wall, scale suggested by the tiny arch of a
distant doorway. Vertical composition.
```

### 6. `region-rift` — 별의 균열
```
[고정 접두]
A tear in the night sky above a barren plateau, the fissure edged in cold violet light,
stars visible through the opening arranged wrongly, cracked ground below with no
vegetation, faint motes of light drifting upward. Vertical composition, the rift
occupying the upper half. Restrained — no explosion, no beams.
```

---

## 유물 아이콘 12개 · 128×128 정사각

배경은 **투명 또는 단색**으로. 아이콘이므로 접두의 "atmosphere" 부분보다 물체 자체가 선명해야 한다. 접두 끝에 아래 한 줄을 추가한다.

```
Single object centered, isolated on plain neutral background, museum catalogue style,
even lighting, object fills 80% of frame.
```

| id | 프롬프트 본문 |
|---|---|
| `relic-compass` | A weathered brass compass, its glass fogged, moss dried into the seams, needle pointing off-center |
| `relic-seal` | A worn bronze signet stamp, moss in the engraved face, the emblem too eroded to read |
| `relic-oathring` | A plain silver ring, an inscription worn almost smooth on the inner band, one small dent |
| `relic-scale` | A single iron balance weight, hand-stamped numerals that do not match its actual mass |
| `relic-seedjar` | A small sealed clay jar, unglazed, faint water stains, a few pale seeds visible at the neck |
| `relic-ledgerstone` | A set of dark polished counting stones on a shallow wooden frame, arranged mid-calculation |
| `relic-frostlens` | A ground crystal lens in a frost-rimed iron mount, hairline crack across one edge |
| `relic-bannerpole` | A broken iron banner finial on a splintered wooden shaft, no cloth remaining |
| `relic-echostone` | A rough gray stone sphere with a spiral groove cut into its surface, faintly hollow-looking |
| `relic-deepvein` | A raw chunk of stone with an unusual pale mineral grain running through it diagonally |
| `relic-starshard` | A small translucent violet shard, edges too sharp to be natural, casting no shadow |
| `relic-unspoken` | A closed lead vessel the size of a fist, no opening, no seam, surface slightly warm-looking |

---

## 확인 절차

전부 넣은 뒤:

1. `?debugAssets=1` 로 열어 자홍색 외곽선이 남지 않았는지 확인
2. 지역 배경 6장을 나란히 놓고 본다. **한 장이라도 튀면 그 장만 다시 만든다.** 튀는 채로 두면 나머지 5장이 같이 싸구려로 보인다
3. 폰 세로 화면에서 배경 위에 텍스트를 올려본다. 중앙~하단이 너무 밝으면 판정 결과 글자가 안 읽힌다 — 그 경우 어두운 그라디언트 오버레이를 코드에서 씌운다(이미지를 다시 만들지 말 것)
4. 유물 아이콘은 128px로 축소한 상태에서 구별되는지 본다. 디테일이 많으면 뭉개진다

## 대안

직접 생성하지 않고 진행해도 된다. 플레이스홀더 규약(§11.1)이 있어 **일러스트 0장으로 M10까지 전부 플레이 가능**하다. 게임을 먼저 완성하고, 재미가 붙은 뒤에 그림을 채우는 순서가 오히려 안전하다.
