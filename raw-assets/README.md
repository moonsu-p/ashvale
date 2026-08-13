# raw-assets/

내려받은 원본 에셋을 둔다. **읽기 전용으로 취급한다 — 절대 수정하지 않는다.**

```
raw-assets/
  kenney-tiny-town/      CC0 타일셋 (16px, spacing 1)
  kenney-tiny-dungeon/
  tiny-creatures/
  kenney-map-pack/
  illustration/          AI 생성 일러스트 (리맵 대상 아님, 그대로 복사)
```

## 파이프라인

```bash
npm run assets        # remap + atlas 한 번에
# 또는 개별
npm run assets:remap  # raw-assets/ → public/assets/ (32색 팔레트로 강제, 일러스트는 복사)
npm run assets:atlas  # public/assets/ 스프라이트 → atlas.png + atlas.json (spacing 1)
```

`public/assets/` 는 위 스크립트가 생성한다(파생물이라 git 에서 제외됨). 원본은 여기 raw-assets/ 에만 둔다.

## 매니페스트 교체

에셋을 실제로 쓰려면 `src/data/assets.ts` 의 해당 항목 `path` 를 아틀라스 프레임 이름으로,
`status` 를 `'final'` 로 바꾼다. `path` 가 `null` 이면 렌더러가 플레이스홀더(색 사각형+라벨)를 그린다.
