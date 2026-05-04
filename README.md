# MONEYBOX Cloudflare Pages 버전

## 변경점

- `server.js` 대신 Cloudflare Pages Functions 사용
- `/api/rates` 파일 위치: `functions/api/rates.js`
- 기존 화면은 그대로 `/api/rates`를 호출

## 업로드할 때 필수 구조

```text
index.html
moneybox-logo.png
functions/api/rates.js
package.json
```

## 배포 후 확인

```text
https://배포주소/api/rates
```

JSON이 뜨면 성공입니다.
