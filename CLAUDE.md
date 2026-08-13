# CLAUDE.md

이 파일은 매 세션 자동으로 읽힌다. 아래 규칙은 **모든 작업에 항상 적용된다.**

## 프로젝트

「아쉬베일 연대기」 — 끝나지 않고 계속 성장하는 1인용 그래픽 판타지 RPG.
안드로이드 세로 화면 전용 웹 앱(PWA). 완전 무서버, 완전 오프라인.

스택: Vite + React 18 + TypeScript + Tailwind + Phaser 3 + zustand

## 절대 규칙

### 문서 읽기
- `docs/game-design-doc.md`는 1300줄이다. **전체를 읽지 마라.** 지시받은 절만 읽는다
- 지시에 절 번호가 없으면 물어라. 추측해서 전체를 읽지 마라

### 범위
- **현재 마일스톤 범위를 넘어서 구현하지 마라.** 다음 마일스톤 시스템의 자리를 미리 비워두는 것도 하지 마라
- 마일스톤이 끝나면 완료 조건 충족 여부를 보고하고 멈춘다. 이어서 다음 것을 시작하지 마라
- "다음 것도 할까요?"라고 묻지 말고 그냥 멈춘다

### 아키텍처
- 규칙 로직은 `src/systems/`의 **순수 함수**로: `(state, input, rng) => { state, entries }`
- React 컴포넌트나 Phaser 씬에 게임 규칙을 넣지 마라
- Phaser 씬은 `GameState`를 **읽기만** 한다. `syncFromState(state)` 한 곳에서 갱신한다
- 입력은 Phaser → 콜백 → zustand 액션 순서로만 흐른다
- 수치는 전부 `src/data/*.ts` 상수로. 코드에 숫자를 박지 마라
- **시각 상태를 저장하지 마라.** 건물 배치·워커 위치·맵 크기는 `GameState`에서 파생한다.
  배치는 `deriveLayout(state)`가 `state.createdAt`을 시드로 결정론적으로 계산한다

### 저장
- `localStorage` / `indexedDB`를 **`StorageAdapter` 밖에서 직접 호출하지 마라**
- 원장(ledger)은 세이브와 별도 키다. 불러오기가 원장 값을 낮추지 못한다
- 서비스 워커에서 `caches.delete()`는 써도 되지만 IndexedDB/localStorage는 **절대** 건드리지 마라
- `schemaVersion` 마이그레이션 실패 시 덮어쓰지 말고 원본을 백업 키로 보존한 뒤 오류를 표시한다

### 비통신 (이건 요구사항이다)
- **CDN 참조 금지.** 폰트·라이브러리를 런타임에 원격에서 불러오지 마라. 폰트는 `public/fonts/`에 자체 호스팅
- **분석·크래시 리포팅·텔레메트리 금지.** Sentry, GA 등을 "관행"으로 추가하지 마라
- 외부 API 호출 금지. 이 앱은 네트워크를 쓰지 않는다

### 색과 에셋
- 색은 `src/data/palette.ts`에서만 가져온다. **Tailwind 기본 팔레트를 쓰지 마라**
- 파일 경로를 코드에 박지 마라. 반드시 `src/data/assets.ts` 매니페스트를 거친다
- `path`가 `null`이면 플레이스홀더(색 사각형 + 라벨)를 그린다. 에셋이 없어도 게임은 정상 작동해야 한다

### 수정 금지 파일
아래는 완성본이다. **읽기만 하고 수정하지 마라.** "개선"하지 마라.
```
src/data/palette.ts
src/data/assets.ts
src/data/content/companion-dialogue.ts
src/data/content/patron-dialogue.ts
src/data/content/dialogue-events.ts
src/data/content/region-text.ts
src/data/content/world-content.ts
```
대사와 서술은 문체 규약(§15.1)에 맞춰 작성된 것이다. 새로 쓰거나 다듬으면 톤이 무너진다.
텍스트가 필요한 곳에서는 반드시 이 파일들에서 가져온다.

### 문체
- **연대기·판정 결과·시대 전환**: 무주어 문어체, 과거형 종결(`~했다`). 2인칭(`그대`·`당신`) 금지
- **인물 대화**: 현대 구어체. 호감 단계에 따라 말투가 변한다(존댓말 → 반말 → 연인 호칭)
- **UI 라벨**: 간결한 명사형 또는 동사원형
- 오류 메시지는 무엇을 하면 되는지 명시한다

### 모바일
- 설계 기준 393×852dp 세로. 상단 55% 맵, 하단 45% UI 시트
- 줌은 0.5 / 0.75 / 1.0 / 1.5 / 2.0 스냅. 임의 배율은 픽셀아트를 흐리게 한다
- 타일은 16px 원본의 정수배(×2 = 32px) 렌더
- 건물 히트박스는 스프라이트보다 가로세로 각 8px 크게
- `prefers-reduced-motion` 존중. 턴 연출 총합 1.2초 이내, 탭으로 스킵 가능

### 결정된 사항
`docs/game-design-doc.md` §13의 결정 27개는 **전부 확정**이다. 임의로 바꾸지 마라.
바꿔야 할 이유가 생기면 먼저 말하고 승인을 받는다.

## 파일 지도

```
docs/game-design-doc.md          기획서. 지시받은 절만 읽는다
docs/claude-code-instructions.md 마일스톤 지시 순서
docs/ASSETS.md                   에셋 조달과 라이선스
docs/illustration-prompts.md     일러스트 프롬프트 (사용자가 나중에 생성)
src/data/                        수정 금지 (위 목록 참조)
scripts/remap-palette.ts         빌드 전 실행. 런타임 코드 아님
```

## 커밋

마일스톤이 끝나면 커밋한다. 메시지는 `feat(M3): 건설과 인구 시스템` 형태로.
`*.keystore`, `*.jks`, `.env`는 절대 커밋하지 않는다.
