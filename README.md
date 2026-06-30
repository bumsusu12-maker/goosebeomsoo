# MONEYMAX V16.5.2 PROFILE DROPDOWN FIX

## 실행
npm install
node server.js

## 접속
http://localhost:3001

## 수정
- 상단 프로필 버튼 클릭 복구
- 남대문점/명동점/명동 2호점/강남점 선택 드롭다운 복구
- 프로필 선택 시 해당 프로필 저장값 적용 후 새로고침
- 기존 롤백 안정판 화면 유지
- TOP3 기본 표시 유지
- node --check 통과

## 검증
{
  "base": "moneymax-v16-5-1-rollback-stable-top3.zip",
  "profile_dropdown_fix": false,
  "node_check": true
}

# MONEYMAX V16.5 CODEX MERGE REAL

## 적용 내용
- Codex server.js 적용
- Codex package.json / package-lock.json 적용
- Codex render.yaml 적용
- /api/health 포함
- 서버 소스/배포 파일 정적 노출 차단 포함
- 기존 안정 프론트 화면 유지
- Cloudflare Functions 참고 파일은 functions/api 에 별도 보관

## 실행
npm ci
npm start

## 확인
http://localhost:3001/api/health
http://localhost:3001


## V16.6 변경 사항

- 용산지점 수집 주소를 새 M-BOX 페이지 `https://m-box.com/branch/YS1` 기준으로 변경
- 용산지점은 CEMS 수집 실패 시 새 M-BOX 페이지에서 외화 살 때 환율을 보조 파싱
- RUB 러시아 루블 통화 추가
- 서버와 Cloudflare Functions용 `functions/api/rates.js` 모두 동일하게 반영
