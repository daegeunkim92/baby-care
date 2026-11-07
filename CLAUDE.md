# baby-care

유아 이유식 기록 + 이유식 재료 재고/장보기 체크리스트 앱.
아이폰 사파리에서 "홈 화면에 추가"로 쓰는 모바일 전용 웹앱.

- Vite + React + TypeScript, 서버 없음. 데이터는 `localStorage`, 사진은 IndexedDB에 저장
- `main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가
  https://daegeunkim92.github.io/baby-care/ 로 자동 배포

## 규칙

- **`git push`는 사용자가 허락할 때만 한다.** push가 곧 배포이기 때문.
  변경 후에는 빌드·확인·커밋까지만 하고 "배포할까요?"라고 물은 뒤,
  허락을 받으면 그때 push한다. 한 번 받은 허락은 다음 push에 이어지지 않는다.
- 메모리 기능은 쓰지 않는다. 기억해야 할 규칙은 이 파일에 적는다.
- **답변은 항상 한국어로 한다.** 코드와 커밋 메시지는 지금처럼 써도 된다.
