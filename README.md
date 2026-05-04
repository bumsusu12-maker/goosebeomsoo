# MONEYBOX 내부 공유용 V7

## 실행

```bash
npm install
node server.js
```

접속:

```text
http://localhost:3000
```

## V7 변경점

- 제일환전 환율 추가
- 체크박스는 표시할 지점 선택 기능으로 유지
- 별표를 누른 지점만 카드 TOP3 / 전체보기 / 상세표에서 파란색 강조
- 여러 지점 별표 가능
- 즐겨찾기만 보기 유지


## V7.1 수정

- V7의 `/api/rates` 호출 오류 수정
- 머니박스 API + 제일환전 크롤링을 안전하게 병합
