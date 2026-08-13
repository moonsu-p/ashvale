# 붙여넣기 5블록 (간편판)

규칙은 `CLAUDE.md`가 자동으로 처리한다. **더 이상 공통 규칙 블록을 붙일 필요가 없다.**
아래 5개를 순서대로, 한 번에 하나씩 붙인다. 각 블록이 끝나면 커밋하고 다음으로.

상세판은 `claude-code-instructions.md`. 마일스톤을 더 쪼개고 싶으면 그쪽을 쓴다.

---

## 준비 (윈도우)

1. **Node.js LTS**(nodejs.org)와 **Git for Windows**(git-scm.com) 설치
2. `ashvale.zip`을 **압축 풀기** → `C:\dev\ashvale`
   윈도우 zip 미리보기 상태로는 클로드 코드가 파일을 못 본다. 반드시 실제로 풀 것
3. Claude 앱 → **Code** 탭 → **Local** → **Select folder** → `C:\dev\ashvale`

---

## 블록 1 — 셋업과 골격 (M0 + M1)

```
CLAUDE.md 를 먼저 읽어. 그 규칙이 이 프로젝트 전체에 항상 적용돼.

먼저 확인만:
- node --version, git --version 을 확인해서 둘 다 있는지 알려줘. 없으면 어디서 받는지만 말하고 멈춰

그 다음 이 순서로 해줘:

[1] git 초기화 + .gitignore (node_modules, dist, .env, *.keystore, *.jks 제외.
    raw-assets/ 는 제외하지 마) + .gitattributes 에 "* text=auto eol=lf"
    → "docs: 기획서와 콘텐츠 데이터 추가" 로 커밋

[2] docs/game-design-doc.md 의 §0, §3, §7.8, §12.1~12.4, §12.7a, §12.8 을 읽고 M0:
    - Vite + React 18 + TS + Tailwind + Phaser 3 + zustand 셋업
    - GameState 타입 전체 (CompanionRecord / PatronRecord 포함)
    - 시드 주입 가능한 RNG 인터페이스
    - StorageAdapter 인터페이스 + WebStorageAdapter (상태=localStorage, 이미지=IndexedDB)
    - 원장(ledger) 저장·불러오기 규칙
    - schemaVersion 마이그레이션 체인 골격 (지금은 빈 함수여도 만들어둘 것)
    - PWA 매니페스트 + 서비스 워커 + navigator.storage.persist()
    - src/data/assets.ts 를 읽어 플레이스홀더 렌더러 (?debugAssets=1 포함)
    - 393x852dp 세로 레이아웃 골격
    - public/fonts/ 자리와 @font-face 작성 (폰트 파일은 내가 나중에 넣음, §10.7)
    완료 조건: 새 게임 → 새로고침 → 복원. 홈 화면 설치되고 오프라인 실행됨
    → 커밋

[3] §10.1~10.4, §10.6 을 읽고 M1:
    - Phaser 통합 (캔버스 배경 + React UI 오버레이)
    - SettlementScene 골격, 격자 12x12 / 18x18 / 24x24
    - 핀치 줌 0.5~2.0x + 팬 + 더블탭 전체보기 + 줌 스냅
    - LOD (0.75x 미만에서 워커·파티클 숨김)
    - ResizeObserver로 캔버스 크기 맞춤
    완료 조건: 폰에서 격자를 확대·이동할 수 있고 픽셀이 흐려지지 않음
    → 커밋

각 단계가 끝나면 완료 조건 충족 여부를 보고하고 멈춰. 다음 단계로 넘어가지 마.
```

---

## 블록 2 — 자원 루프 (M2 + M3 + M4)

```
docs/game-design-doc.md 의 §2, §5, §9, §10.4, §15.1, §15.2, §15.3 을 읽고 순서대로 해줘.

[M2] 턴 엔진 + 자원 생산 + 계절 틴트 + 연대기
     턴 종료 처리는 §2의 8단계 순서를 그대로 고정
     세계 이벤트는 content/world-content.ts 의 WORLD_EVENTS 사용
     완료 조건: 휴식만으로 10주 진행, 계절이 화면 색으로 바뀜, 자원 수지 맞음
     → 커밋

[M3] 건설 + 인구/식량 + deriveLayout + 건물 시각 3단계 + 주민 워커
     워커는 min(인구, 24)명. 성벽은 둘레 링으로 별도 처리
     완료 조건: 건물 올리면 스프라이트가 커지고 워커가 늘어남
     → 커밋

[M4] 시대 전환 + 맵 확장/줌아웃 연출 + 지역 해금 + 거점 붕괴
     붕괴 시 연대기·갤러리·업로드 이미지는 100% 보존. 예외 없음
     식량 마이너스 주부터 경고 배너, 붕괴 2주 전 문어체 경고
     붕괴 1회당 시대 임계값 5% 완화
     완료 조건: 시대 2 도달, 확장 연출, 붕괴 경로와 재기 보정 동작
     → 커밋

각 마일스톤이 끝나면 보고하고 멈춰.
```

---

## 블록 3 — 탐험과 성장 (M5 + M6)

```
docs/game-design-doc.md 의 §4, §6, §9, §10.4, §16.2 를 읽고 순서대로 해줘.

[M5] 탐험 판정 + RegionScene + 주사위 연출 + XP/레벨업 + 온보딩
     서술은 content/region-text.ts 사용. 새로 쓰지 마
     판정은 1d20이 돌아가다 멈추고 보정값이 하나씩 더해지는 연출로 노출
     온보딩에 스플래시·로고·인트로 애니메이션 금지
     속삭이는 숲 난이도 9와 시작 민첩 3을 낮추지 마. 첫 판정이 실패로 시작하면 안 됨
     완료 조건: 판정 계산식이 화면에 단계적으로 보임, 새 게임 첫 5턴이 막히지 않음
     → 커밋

[M6] 스킬 트리 + 능력치 배분 + 유물
     유물은 content/world-content.ts 의 RELICS 사용
     48랭크 이후 초월 랭크 (초과 랭크마다 비용 +1 SP 누진)
     완료 조건: 보너스가 판정 연출에 숫자로 나타남
     → 커밋
```

**여기서 멈추고 30분 플레이해본다.** 색 사각형만으로도 재미있는가?
재미없으면 그래픽이 아니라 밸런스를 손봐야 한다. 이게 이 프로젝트의 진짜 판단 지점이다.

---

## 블록 4 — 인물 (M7 + M7b + M7c)

```
docs/game-design-doc.md 의 §7 전체, §11.1, §11.4, §11.5, §12.6, §15.1, §16.1, §16.3~16.5 를 읽고 순서대로 해줘.

[M7] CompanionRecord/PatronRecord 분리 + 원형 + 호감 4경로 + 신뢰 + 세력 평판
     대사는 content/companion-dialogue.ts, patron-dialogue.ts 사용. 새로 쓰지 마
     말투가 호감 단계에 따라 바뀌는 것을 실제로 반영
     교류 연속 체감(6→4→2), 선물 취향 판정, 호감 상한 59 게이트 필수
     같은 원형 보너스는 중첩 없이 최대값만 적용
     세력 상충: 마탑 +5 시 숲의 부족 −2
     → 커밋

[M7b] 이미지 업로드 파이프라인 + 슬롯 해금 + 갤러리 + 꾸러미 내보내기/불러오기
     절대 규칙:
     - 원본 참조를 저장하지 마 (content:// URI, File 핸들, 경로 전부 금지).
       선택 즉시 바이트를 읽어 WebP 재인코딩하고 그 Blob만 저장
     - createImageBitmap(file, { imageOrientation: 'from-image' }) 로 EXIF 회전 처리
     - createObjectURL 결과를 저장하지 말고 언마운트 시 revokeObjectURL
     - zip 구조 고정: save.json + images/companion_{id}_slot_{n}.webp + ledger.json
     완료 조건: 이미지 없이도 정상 작동. 내보내기 → 다른 브라우저에서 불러오기 동작
     → 커밋

[M7c] 관계 트랙 분기 + 대화 사건 + 동행 탐험 + 의뢰인 퀘스트 + 인물 생성 흐름 + 교역 + 선물
     대화 사건은 content/dialogue-events.ts 사용. 주사위를 굴리지 마
     연심은 다수 허용, 질투 페널티 없음. 소개 연쇄는 우애 트랙(맹우 80) 전용
     퀘스트는 동시 1개, 기한 없음, 실패 없음. 완료는 의뢰인과 교류할 때 보고
     교역에 주간 한도(시장 레벨 × 30 금화) 필수
     → 커밋
```

M7b가 끝나면 직접 확인할 것:
- [ ] 이미지 추가 → **사진첩 원본 삭제** → 게임 내 이미지가 남아 있는가
- [ ] 세로 사진이 눕지 않는가
- [ ] 갤러리 앱에 게임 이미지가 안 보이는가
- [ ] 인물 화면 5분 열어둬도 앱이 무거워지지 않는가

---

## 블록 5 — 마무리 (M8 + M9 + M10)

```
docs/game-design-doc.md 의 §8, §9, §10.1~10.2, §10.5, §10.6, §11.1~11.3, §12.8, §15.3 과
docs/ASSETS.md 를 읽고 순서대로 해줘.

[M8] 위협 + 방비 + 성벽 링 렌더 + 적 접근 연출 + 세계 이벤트
     위협은 content/world-content.ts 의 THREATS 사용
     준비 기간에 현재 방어력과 위협 강도를 숫자로 나란히 표시.
     못 이길 싸움임을 알 수 있어야 함
     → 커밋

[M9] 에셋 파이프라인: scripts/remap-palette.ts 실행 가능하게 정리,
     텍스처 아틀라스 묶기, 매니페스트 교체 흐름
     Kenney 스프라이트시트는 에셋 사이 1px 간격. spacing: 1 필수
     일러스트는 팔레트 리맵 대상 아님. public/assets/illustration/ 으로 분리
     완료 조건: raw-assets/ 에 타일셋을 넣고 스크립트를 돌리면 public/assets/ 가 채워짐
     → 커밋

[M10] 애니메이션 예산(총합 1.2초, 탭 스킵) + 성능 예산 + 비통신 검증
     직전 행동 재실행 버튼, 앱 열면 직전 연대기 1~2줄 표시
     그리고 번들에서 http:// https:// 문자열을 검색해 런타임 참조가 없는지 확인하고 보고
     완료 조건: 실기기 60fps, 비행기 모드에서 전 기능 동작, 네트워크 요청 0
     → 커밋
```

---

## 그 다음

- **배포**: GitHub 저장소 만들고 GitHub Pages로 정적 배포 → 폰 Chrome으로 열어 홈 화면 추가
- **에셋**: `docs/ASSETS.md`의 CC0 타일셋 다운로드, `docs/illustration-prompts.md`로 일러스트 18장 생성
- **APK**: 필요해지면 `claude-code-instructions.md` §7의 M11

## 주의

1. **블록을 합치지 마라.** 5개가 이미 합친 결과다. 더 합치면 컨텍스트가 차서 CLAUDE.md 규칙이 조용히 무시된다
2. 클로드 코드가 "다음 것도 할까요?"라고 물으면 **거절한다.** 사람이 허락하면 넘어간다
3. 각 블록 끝에 커밋한다. 망가지면 `git log --oneline` 보고 "M4 커밋으로 되돌려줘"라고 말하면 된다
