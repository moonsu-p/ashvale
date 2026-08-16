# 폰트 자리

CDN에서 불러오지 않는다. 파일을 여기 두고 `src/index.css`의 `@font-face`가 집어 간다.
파일이 없으면 `system-ui`로 떨어지고, 그 상태로도 게임은 정상 작동한다.

기대하는 파일 이름:

| 파일 | 용도 | 굵기 |
|---|---|---|
| `Pretendard-400.woff2` | 본문·UI·대화 | 400 |
| `Pretendard-500.woff2` | 강조 | 500 |
| `NotoSerifKR-400.woff2` | 연대기·시대 전환 | 400 |

둘 다 SIL OFL 1.1이라 임베딩·재배포가 자유롭다. 출처는 `docs/ASSETS.md`.

**서브셋을 거쳐서 넣는다.** 원본 그대로면 한 벌에 수 MB다.
한글 완성형 2350자 + ASCII + 문장부호로 줄이면 굵기당 300~400KB가 된다.

```bash
pip install fonttools brotli
pyftsubset Pretendard-Regular.otf \
  --unicodes-file=subset-kr.txt \
  --flavor=woff2 --layout-features='*' \
  --output-file=public/fonts/Pretendard-400.woff2
```
