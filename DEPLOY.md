# MemoNest 배포 & 구글 연동 가이드 (Netlify + Notion)

이 문서는 Cloudflare → Netlify 전환 이후, 실제 외부 서비스로 띄우고 구글 캘린더 연동을 활성화하기 위해 **사용자가 직접 해야 하는 설정**을 정리합니다.

---

## 1. Netlify 배포

### 필요한 것
- Netlify 계정
- Netlify CLI (`npm i -g netlify-cli`) 또는 GitHub 연동 배포

### 방법 A — CLI 배포
```bash
# 프로젝트 루트(memonest)에서
netlify login
netlify init          # 새 사이트 생성 또는 기존 사이트 연결
netlify deploy --prod
```

### 방법 B — GitHub 연동 (권장)
1. Netlify 대시보드 → Add new site → Import an existing project
2. `ishtar606/memonest` 리포 선택
3. 빌드 설정은 `netlify.toml`이 자동 적용됨
   - publish: `public`
   - functions: `netlify/functions`
   - `/api/*` → Hono 함수, 그 외 → `index.html`

배포가 끝나면 `https://<사이트이름>.netlify.app` 형태의 URL이 생깁니다.
(커스텀 도메인을 붙이면 그 도메인이 기준이 됩니다.)

---

## 2. 환경변수 (Netlify Site settings → Environment variables)

코드에 시크릿을 넣지 않습니다. 아래 값을 Netlify 환경변수로 등록하세요.

| 변수명 | 용도 | 필수 |
|--------|------|------|
| `NOTION_API_KEY` | Notion Integration 토큰 (데이터 저장) | 필수 |
| `GEMINI_API_KEY` | AI 구조화 (회의록/아이디어/쇼핑) | 기능 사용 시 |
| `GROQ_API_KEY` | STT 음성 인식 | 기능 사용 시 |
| `GOOGLE_CLIENT_ID` | 구글 OAuth 클라이언트 ID | 캘린더 연동 시 |
| `GOOGLE_CLIENT_SECRET` | 구글 OAuth 클라이언트 시크릿 | 캘린더 연동 시 |
| `APP_BASE_URL` | (선택) 배포 도메인 강제 지정. 예: `https://memonest.netlify.app` | 선택 |

> `APP_BASE_URL`을 지정하지 않으면 요청 Origin에서 자동으로 리다이렉트 URI를 계산합니다.
> 커스텀 도메인 + 미리보기 배포를 섞어 쓰면 값이 흔들릴 수 있으니, 안정적으로 하려면 `APP_BASE_URL`을 명시하는 것을 권장합니다.

환경변수를 바꾼 뒤에는 **재배포**해야 반영됩니다.

---

## 3. 구글 캘린더 연동 활성화 (버그1 실제 해결)

`ishtar606@gmail.com` 연동이 "차단됨(blocked)"으로 막히는 것은 코드 문제가 아니라
**Google Cloud Console의 OAuth 설정** 때문입니다. 아래를 확인하세요.

### 3-1. OAuth 클라이언트의 리디렉션 URI 등록
1. [Google Cloud Console](https://console.cloud.google.com/) → 해당 프로젝트
2. API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID (웹 애플리케이션)
3. **승인된 리디렉션 URI**에 배포 도메인 기준 콜백을 정확히 추가:
   ```
   https://<사이트이름>.netlify.app/api/calendar/callback
   ```
   - `APP_BASE_URL`을 지정했다면 그 도메인 기준으로 등록
   - 끝의 `/api/calendar/callback` 경로까지 **정확히** 일치해야 함 (안 맞으면 `redirect_uri_mismatch`)

### 3-2. "차단됨(Access blocked)" 해제 — 이게 핵심
OAuth 동의 화면이 **테스트(Testing) 모드**이면, **테스트 사용자로 등록된 계정만** 로그인할 수 있습니다.
`ishtar606@gmail.com`이 목록에 없으면 차단됩니다.

**해결 (둘 중 하나):**
- **옵션 1 (간단, 개인용 권장):** API 및 서비스 → OAuth 동의 화면 → **테스트 사용자(Test users)** 에
  `ishtar606@gmail.com` 추가. (본인 계정만 쓰면 이걸로 충분)
- **옵션 2 (공개 배포):** OAuth 동의 화면을 **게시(Publish app)** 해서 프로덕션으로 전환.
  단, `calendar.events` 범위는 민감 범위라 외부 사용자를 받으려면 구글 검증(verification)이 필요할 수 있음.
  개인 사용이면 옵션 1이 훨씬 빠릅니다.

### 3-3. 사용 설정된 API 확인
- API 및 서비스 → 라이브러리 → **Google Calendar API**가 "사용 설정됨" 상태인지 확인.

### 3-4. 범위(Scope) 확인
- 앱이 요청하는 범위: `https://www.googleapis.com/auth/calendar.events`
- 동의 화면의 범위 목록과 일치해야 합니다.

---

## 4. 연동 점검 체크리스트

- [ ] Netlify에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 등록 후 재배포
- [ ] Google Console에 `https://<도메인>/api/calendar/callback` 리디렉션 URI 등록
- [ ] OAuth 동의 화면 테스트 사용자에 `ishtar606@gmail.com` 추가 (또는 앱 게시)
- [ ] Google Calendar API 사용 설정
- [ ] 앱 → 일정 탭 → "Google 연동" 버튼 → 팝업에서 정상 로그인/동의 확인

---

## 5. 로컬 개발

```bash
npm install
# Netlify 환경 로컬 에뮬레이션 (함수 + 정적 파일 + 환경변수)
netlify dev
```

로컬에서 구글 연동까지 테스트하려면 `http://localhost:8888/api/calendar/callback`도
Google Console 리디렉션 URI에 추가해야 합니다. (`netlify dev` 기본 포트 8888)

---

## 6. 웹푸시 알림 설정 (v2.5.0+)

### 6-1. VAPID 키 생성 (최초 1회)
프로젝트 폴더에서:
```bash
npx web-push generate-vapid-keys
```
출력된 **Public Key / Private Key**를 사용합니다. (키는 채팅 등에 노출 금지)

### 6-2. Netlify 환경변수 추가
| Key | Value | Secret |
|-----|-------|:---:|
| `VAPID_PUBLIC_KEY` | (생성된 Public Key) | 안 함(공개키) |
| `VAPID_PRIVATE_KEY` | (생성된 Private Key) | ✅ |
| `VAPID_SUBJECT` | `mailto:본인이메일` | 안 함 |

### 6-3. 최초 구독 후 PUSH_DB_ID 등록
1. 재배포 후 앱 → 일정 탭 → **알림 켜기** (테스트 알림 도착 확인)
2. 이때 브라우저 개발자도구 Network 탭에서 `/api/push/subscribe` 응답의 `pushDbId` 값 확인
   (또는 Notion에 생성된 "🔔 Push Subscriptions" DB의 ID 32자리)
3. Netlify 환경변수에 `PUSH_DB_ID` = 그 값 추가 → 재배포
   - 이 값이 있어야 5분 주기 리마인더(scheduled function)가 어느 DB에서 구독을 읽을지 압니다.

### 6-4. 플랫폼별 안내
- **Android/데스크톱**: 알림 켜기 즉시 동작
- **iOS(아이폰) 16.4+**: Safari에서 **공유 → 홈 화면에 추가** 후, 홈 화면 아이콘으로 실행한 상태에서 알림 켜기 (앱이 자동 안내함)

### 6-5. 동작 확인
- 알림 켜기 직후 테스트 알림이 오면 구독 성공
- 실제 리마인더: 알림 설정(10분 전/1시간 전/1일 전)이 있는 일정에 대해, 5분 주기 스케줄러가 임박 시 발송
