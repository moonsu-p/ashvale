# public/fonts/

폰트는 **자체 호스팅**한다. CDN 링크 금지 (§10.7, §12.8).

여기에 들어갈 파일 (서브셋 woff2, 나중에 배치):

| 파일명 | 폰트 | 굵기 | 라이선스 |
|---|---|---|---|
| `Pretendard-Regular.subset.woff2` | Pretendard | 400 | SIL OFL 1.1 |
| `Pretendard-Medium.subset.woff2` | Pretendard | 500 | SIL OFL 1.1 |
| `NotoSerifKR-Regular.subset.woff2` | Noto Serif KR | 400 | SIL OFL 1.1 |

- 서브셋 범위: 한글 완성형 2350자 + ASCII + 한국어 문장부호 (한자·미사용 라틴 확장 제외)
- `@font-face` 선언은 `src/index.css` 에 있다. 파일이 없어도 폴백 스택으로 앱은 동작한다.
