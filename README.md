# MONEYMAX V16.5 CODEX MERGE

Codex가 정리한 서버/배포 안정화 파일을 기존 안정 프론트 화면에 합친 버전입니다.

## 포함 내용
- Codex `server.js` 적용
- Codex `package.json`, `package-lock.json` 적용
- Codex `render.yaml` 적용
- `/api/health` 유지
- 서버 소스/배포 파일 정적 노출 차단 유지
- 기존 안정판 `index.html`과 로고/파비콘 유지
- Cloudflare Functions용 `functions/api/rates.js`, `functions/api/markets.js` 보관

## 실행
```bash
npm ci
npm start
```

기본 주소는 `http://localhost:3001` 입니다.

## 확인
```bash
npm run check
```

## Render
`render.yaml` 기준으로 배포할 수 있습니다. Health Check 경로는 `/api/health` 입니다.
