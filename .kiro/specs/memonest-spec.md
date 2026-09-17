# MemoNest — 기능 명세서 (AWS Kiro 용)

> **버전:** v2.4.0 · **최종 수정:** 2026-09-17  
> **배포 URL:** https://16bf51cf-4855-4db9-a334-aa07e29f4b47.vip.gensparksite.com  
> **런타임:** Cloudflare Workers (Hono framework) + Notion API (데이터 저장소)

---

## 1. 프로젝트 개요

MemoNest는 **Notion을 백엔드 데이터베이스로 사용**하는 개인 생산성 웹앱이다.  
사용자가 자신의 Notion 워크스페이스에 7개의 DB를 자동 생성하고, 이 앱을 통해 읽기/쓰기/수정/삭제를 수행한다.  
AI (Gemini) 로 회의록·쇼핑·아이디어를 자동 구조화하고, STT(Groq Whisper)로 음성 입력을 지원한다.

### 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Hono (TypeScript) on Cloudflare Workers |
| 프론트엔드 | Vanilla JS (SPA, CDN 라이브러리 사용) |
| 빌드 | Vite + @hono/vite-cloudflare-pages |
| 데이터 저장 | Notion REST API (D1/KV 미사용) |
| AI | Google Gemini API (텍스트 구조화) |
| STT | Groq Whisper API (음성→텍스트) |
| 인증 | Notion API Key (사용자 직접 입력 → Worker Secret) |
| 배포 | Genspark Hosted (Workers for Platform) |

---

## 2. 아키텍처 요약

```
브라우저 (app.js — SPA)
    │
    ├── GET/POST/PATCH/DELETE /api/*   ← Hono Worker (src/index.tsx)
    │       │
    │       ├── Notion REST API  (데이터 읽기/쓰기)
    │       ├── Gemini API       (AI 구조화)
    │       └── Groq STT API     (음성 전사)
    │
    └── /static/*  ← 정적 파일 서빙 (public/static/)
```

### 프론트엔드 핵심 패턴

- **단일 객체 `MemoNest`** — 모든 UI·로직을 하나의 JS 객체 안에 정의
- **`_scheduleCache`** — 일정 데이터를 `{ [pageId]: {...} }` 형태로 메모리 캐싱. onclick 인라인 특수문자 버그를 방지하기 위해 `data-sid` attribute + `this.dataset.sid` 패턴 사용
- **`_meetingCache`** — 회의록 데이터 캐싱 (`{ [pageId]: {...} }`), 수정 모달용
- **`_meetingScheduleIds`** — 이미 회의록이 등록된 일정 ID Set. 일정-회의록 연동 상태 표시에 사용
- **`_schedView`** — 일정 캘린더 뷰 상태 `{ mode: 'day'|'week'|'month', anchor: ISO string, selectedDate: string }`
- **`_catStyle`** — 카테고리별 파스텔 색상 설정 (회의/개인/이벤트/약속/기타 5종)
- **`state.dbIds`** — 7개 모듈 DB ID를 localStorage에 저장·복원

---

## 3. 모듈별 기능 명세

### 3-1. 초기 설정 (Setup)

**목적:** 사용자 Notion 워크스페이스에 7개 DB를 자동 생성 또는 재사용

**흐름:**
1. 사용자가 Notion API Key + 루트 Page ID 입력
2. `POST /api/notion/init` 호출
   - 기존 자식 DB 스캔 → 있으면 재사용, 없으면 신규 생성
   - 반환: `{ databases: { todo, schedule, meeting, shopping, idea, novel, diary } }`
3. DB ID들을 localStorage (`mn_dbIds`)에 저장
4. 앱 메인 화면 진입

**생성되는 Notion DB 목록:**

| DB 이름 | 바인딩 키 | 주요 프로퍼티 |
|---------|----------|-------------|
| 📋 ToDo Manager | `todo` | 할 일(title), 상태(select), 우선순위(select), Due Date(date), 태그(multi_select), 반복(select), 메모(rich_text) |
| 📅 Schedule Manager | `schedule` | 제목(title), 날짜/시간(date: {start, end}), 카테고리(select), 장소(rich_text), 알림(select), 메모(rich_text) |
| 🎙️ Meeting Notes | `meeting` | 회의 제목(title), 날짜(date), 고객사/프로젝트(rich_text), 요약(rich_text), 액션 아이템(rich_text), 태그(multi_select), 일정 ID(rich_text) |
| 🛒 Shopping List | `shopping` | 상품명(title), 수량(rich_text), 카테고리(select), 구매처 추천(rich_text), 태그(multi_select), 구매완료(checkbox) |
| 💡 Idea Memo | `idea` | 제목(title), 카테고리(select), 내용(rich_text), 태그(multi_select), 실행가능성(select), AI분석(rich_text) |
| 📖 Novel Memo | `novel` | 제목(title), 장르(select), 등장인물(rich_text), 배경(rich_text), 줄거리(rich_text), 태그(multi_select) |
| 📔 Diary | `diary` | 제목(title), 날짜(date), 감정(select), 날씨(select), 내용(rich_text), 태그(multi_select) |

---

### 3-2. ToDo 관리

**API 엔드포인트:**
- `POST /api/todos` — 할 일 생성
- `GET /api/todos?dbId=` — 목록 조회 (상태 오름차순 정렬)
- `PATCH /api/todos/:pageId` — 상태/내용 수정
- `DELETE /api/todos/:pageId` — 삭제

**UI 기능:**
- 카드 리스트 뷰 (상태별 색상 배지)
- 드래그 앤 드롭으로 순서 변경 (`dragstart` / `dragover` / `drop` 이벤트)
- 태그별 그룹 뷰 / 기본 목록 뷰 토글
- 상태 필터 (전체/미완료/진행중/완료/보류)
- 검색 필터 (제목 실시간 검색)
- 인라인 상태 토글 버튼

**프론트엔드 함수:**
- `renderTodo()` — 화면 렌더링
- `renderTodoList(todos)` — 목록 렌더링
- `renderTodoByTag(tagMap)` — 태그별 그룹 렌더링
- `loadTodos()` — API 호출 후 상태 갱신
- `showAddTodo()` — 추가 모달
- `saveTodo()` — 저장 API 호출
- `toggleTodoStatus(pageId)` — 상태 순환 토글
- `deleteTodo(pageId)` — 삭제 확인 후 API 호출

---

### 3-3. 일정 관리 (Schedule)

**API 엔드포인트:**
- `POST /api/schedules` — 일정 생성 (body: `{ dbId, title, datetime, endDatetime, location, category, reminder, memo }`)
- `GET /api/schedules?dbId=` — 목록 조회 (날짜 오름차순)
- `PATCH /api/schedules/:pageId` — 수정 (body: 위와 동일)
- `DELETE /api/schedules/:pageId` — 삭제

**Notion 날짜 프로퍼티 구조:**
```json
"날짜/시간": {
  "date": {
    "start": "2026-09-17T10:00:00+09:00",
    "end":   "2026-09-17T11:00:00+09:00"  // 종료시간 (선택)
  }
}
```

**UI 기능 — 2분할 레이아웃:**

```
┌─────────────────────┬────────────────────────┐
│   캘린더 패널 (좌)    │   일정 리스트 패널 (우)   │
│  ┌───────────────┐  │  ┌──────────────────┐  │
│  │ 일 │ 주 │ 월  │  │  │ 카테고리 파스텔   │  │
│  ├───────────────┤  │  │ 색상 카드 리스트  │  │
│  │    캘린더 뷰   │  │  │ (스크롤)         │  │
│  │  (날짜 클릭)  │  │  └──────────────────┘  │
│  └───────────────┘  │                        │
└─────────────────────┴────────────────────────┘
```

**캘린더 컴포넌트:**
- **`_renderCalendar()`** — 헤더(모드 탭 + 네비게이션 화살표) + 본문 렌더링
- **`_renderMonthCal(anchor, today, eventDates)`** — 월간 7×N 그리드, 이벤트 점 표시, 오늘 하이라이트, 선택된 날짜 강조
- **`_renderWeekCal(anchor, today, eventDates)`** — 주간 7열, 요일 레이블 + 날짜
- **`_renderDayCal(anchor, today, eventDates)`** — 일간 타임라인, 해당 날 카테고리별 이벤트 표시
- **`_setCalMode(mode)`** — 'day'|'week'|'month' 전환
- **`_calNavigate(dir)`** — ±1 단위 이전/다음 이동 (모드별 이동량 다름)
- **`_calGoToday()`** — anchor를 오늘 날짜로 리셋
- **`_calSelectDate(dateStr)`** — 날짜 선택 → `_schedView.selectedDate` 업데이트 → 리스트 필터 갱신
- **`_animateCalendar(fn)`** — fadeSlide CSS 애니메이션 (기존 내용 fade-out → fn() 실행 → fade-in)

**일정 리스트 컴포넌트 (`_renderScheduleList()`):**
- `_schedView.mode`에 따라 선택된 일/주/월 범위 필터링
- `_catStyle`로 카테고리별 파스텔 배경색 적용
- 시작시간 + 종료시간(있을 경우) 표시
- 수정(✏️) / 삭제(🗑️) 버튼

**카테고리별 파스텔 색상 (`_catStyle`):**
| 카테고리 | 배경색 | 텍스트색 | 닷 색상 |
|---------|-------|---------|--------|
| 회의 | `#ede9fe` | `#5b21b6` | `#7c3aed` |
| 개인 | `#d1fae5` | `#065f46` | `#059669` |
| 이벤트 | `#fef3c7` | `#92400e` | `#d97706` |
| 약속 | `#fce7f3` | `#9d174d` | `#db2777` |
| 기타 | `#f1f5f9` | `#475569` | `#94a3b8` |

**일정 등록/수정 모달 (`showAddSchedule` / `showEditSchedule`):**
- 시작 시간 (`sch-datetime`, `edit-sch-datetime`) — datetime-local
- 종료 시간 (`sch-end-datetime`, `edit-sch-end-datetime`) — datetime-local, 선택
- 2컬럼 나란히 배치
- 로컬 시간 → ISO 8601 변환 (`_toISO` 헬퍼, 타임존 오프셋 포함)
- `showEditScheduleById(pageId)` — `_scheduleCache[pageId]`에서 `endDatetime` 포함 데이터 읽어 모달에 pre-population
- 장소 + 비대면 링크 분리 입력 (`_serializeLocation` / `_parseLocation`)
- Google Maps 검색어 자동 미리보기 힌트

---

### 3-4. 회의록 (Meeting Notes)

**API 엔드포인트:**
- `POST /api/meetings` — 회의록 생성 + AI 구조화
  - Body: `{ dbId, transcript, manualNotes, date, client, scheduleId }`
  - Gemini로 `{ title, summary, agenda, discussion, action_items, tags }` 추출
  - AI 실패 시 기본값으로 fallback (저장은 반드시 성공)
  - `scheduleId`가 있으면 Notion 프로퍼티 `일정 ID`에 저장
- `GET /api/meetings?dbId=` — 목록 조회 (날짜 내림차순)
- `PATCH /api/meetings/:pageId` — 제목/날짜/고객사/요약/액션아이템 수정

**UI 기능:**

**일정-회의록 연동 (`_renderMeetingScheduleLinks`):**
- `loadSchedules()` 실행 시 `카테고리 == '회의'`인 일정만 `_scheduleCache` 에 동기화
- `loadMeetings()` 실행 시 각 회의록의 `일정 ID` 프로퍼티를 읽어 `_meetingScheduleIds` Set에 저장
- `_renderMeetingScheduleLinks()` — 회의 카테고리 일정 목록을 두 섹션으로 표시:
  - **회의록 등록완료** (초록 배지): `_meetingScheduleIds`에 포함된 일정
  - **회의록 미등록** (주황 배지): 아직 회의록 없는 일정 → "회의록 작성" 버튼

**회의록 추가 모달 (`showAddMeetingModal(scheduleId, scheduleTitle)`):**
- 일정 연동 배너 (scheduleId 전달 시 표시)
- 날짜, 고객사/프로젝트명 입력
- 수기 메모 텍스트에리어
- 음성 녹음 버튼 → STT 변환
- **AI 처리 버튼** — 25초 타임아웃 (AbortController), 실패 시 기본값 fallback
- 저장 시 `_meetingScheduleIds.add(scheduleId)` 즉시 업데이트
- 현재 모듈 분기 처리:
  - `meeting` 탭 → `loadMeetings()` 호출
  - `schedule` 탭 → `_renderMeetingScheduleLinks()` 호출

**회의록 수정 모달 (`showEditMeetingModal(mid)`):**
- `_meetingCache[mid]`에서 데이터 읽어 pre-population
- 제목, 날짜, 고객사, 요약, 액션 아이템 수정
- `PATCH /api/meetings/:pageId` 호출

**빈 값 조건:**
- `transcript`와 `manualNotes`가 둘 다 비어있어도 `scheduleId` 또는 `client`가 있으면 저장 허용
- 백엔드도 동일하게 완화 필요 (현재 백엔드는 `!transcript && !manualNotes`면 400 반환 — 추후 수정 필요)

---

### 3-5. 쇼핑 리스트 (Shopping)

**API 엔드포인트:**
- `POST /api/shopping` — 상품 추가 + AI 구매처 추천
  - Body: `{ dbId, item, quantity, category, tags, userLocation }`
  - Gemini로 구매처(온라인/오프라인) 추천 생성
- `GET /api/shopping?dbId=` — 목록 조회
- `PATCH /api/shopping/:pageId` — 수정 (구매완료 체크 포함)
- `DELETE /api/shopping/:pageId` — 삭제

**UI 기능:**
- 카테고리별 그룹 뷰 토글
- 구매완료 체크박스
- AI 추천 구매처 인라인 표시

---

### 3-6. 아이디어 메모 (Idea)

**API 엔드포인트:**
- `POST /api/ideas` — 아이디어 생성 + AI 분석
  - Gemini로 실행 가능성·확장 방향 분석
- `GET /api/ideas?dbId=` — 목록 조회
- `PATCH /api/ideas/:pageId` — 수정
- `DELETE /api/ideas/:pageId` — 삭제

**UI 기능:**
- 카테고리 필터
- AI 분석 결과 인라인 표시
- 실행가능성 배지 (높음/중간/낮음)

---

### 3-7. 소설 메모 (Novel)

**API 엔드포인트:**
- `POST /api/novels` — 소설 메모 생성
- `GET /api/novels?dbId=` — 목록 조회
- `PATCH /api/novels/:pageId` — 수정
- `DELETE /api/novels/:pageId` — 삭제

**UI 기능:**
- 장르별 필터
- 등장인물 / 배경 / 줄거리 섹션 구분 표시

---

### 3-8. 일기 (Diary)

**API 엔드포인트:**
- `POST /api/diary` — 일기 생성
- `GET /api/diary?dbId=` — 목록 조회 (날짜 내림차순)
- `PATCH /api/diary/:pageId` — 수정
- `DELETE /api/diary/:pageId` — 삭제

**UI 기능:**
- 감정/날씨 이모지 배지
- 날짜별 정렬
- 음성 입력 지원

---

### 3-9. Google Calendar 연동

**API 엔드포인트:**
- `GET /api/google/auth-url` — OAuth 2.0 인증 URL 생성
- `GET /api/google/callback` — 코드 교환 → access_token, refresh_token 반환 (localStorage로 전달)
- `POST /api/google/calendar/events` — 단일 이벤트 생성
- `POST /api/google/calendar/sync-all` — Notion 일정 전체 → Google Calendar 일괄 등록

**토큰 관리:**
- localStorage `mn_googleCalTokens`에 `{ access_token, refresh_token, expires_at }` 저장
- 만료 5분 전 자동 갱신 (refresh_token 기반)

---

### 3-10. STT (음성→텍스트)

**API 엔드포인트:**
- `POST /api/stt` — Groq Whisper API 호출
  - Body: multipart/form-data (audio file)
  - 응답: `{ text: "전사된 텍스트" }`
  - Rate limit: 분당 5회 (in-memory, per Worker instance)
  - 파일 크기 제한: 5MB

**UI 기능:**
- 녹음 버튼 → MediaRecorder API 사용
- 회의록 / 일기 / 아이디어 모듈에서 공통 사용 (`startVoiceInput(targetId)`)
- STT 활성화 여부 설정 가능 (`state.sttSettings.enabled`)

---

### 3-11. AI 구조화

**API 엔드포인트:**
- `POST /api/ai/structure` — 범용 AI 구조화
  - Body: `{ content, type }` (type: 'meeting'|'idea'|'shopping')
  - Gemini API 호출 (25초 타임아웃, AbortController)

**Rate limit:** 분당 10회 (in-memory, per Worker instance)

---

## 4. 공통 인프라

### 4-1. 백엔드 헬퍼 함수

```typescript
// Notion API 호출
notionRequest(apiKey, path, method?, body?) → Promise<any>

// Gemini API 호출 (25초 타임아웃)
geminiRequest(apiKey, prompt) → Promise<string>
// - AbortController로 25초 타임아웃
// - HTTP 에러 시 빈 문자열 반환 (throw 안함)

// Groq STT
groqSTT(apiKey, audioBuffer, filename) → Promise<string>
```

### 4-2. 프론트엔드 공통 함수

```javascript
// UI
MemoNest.showModal(title, body, confirmCb)   // 범용 모달
MemoNest.toast(message, type)                 // 토스트 알림 (success/error/info)
MemoNest.render()                             // 전체 앱 리렌더링

// 위치/장소
MemoNest._parseLocation(raw)                  // "장소 | 링크" 파싱
MemoNest._serializeLocation(place, link)      // 장소 + 링크 직렬화
MemoNest._isUrl(str)                          // URL 판별
MemoNest.onLocationInput(inputId)             // Google Maps 힌트 표시

// 시간
MemoNest.getLocalDatetimeStr(date)            // YYYY-MM-DDTHH:MM
MemoNest.getGMTOffsetStr()                    // "GMT+09:00"
MemoNest.getTimezoneName()                    // "Asia/Seoul"
// _toISO 인라인 헬퍼 (saveSchedule, saveEditSchedule 내부)
// "YYYY-MM-DDTHH:MM" → "YYYY-MM-DDTHH:MM:00+09:00"

// 음성
MemoNest.startVoiceInput(targetId)            // STT 시작

// DB 복원
MemoNest.recoverFromApp()                     // 잘못된 DB ID 복원 모달
```

### 4-3. 레이아웃 구조

```
PC (≥768px):
┌──────────┬────────────────────────────────────┐
│  사이드바  │         메인 콘텐츠                 │
│  (240px) │                                    │
│  - 네비   │  ┌─────────────────────────────┐  │
│  - 버전   │  │  모듈 헤더 (제목 + FAB)      │  │
│  - 설정   │  ├─────────────────────────────┤  │
│           │  │  모듈 콘텐츠                │  │
└──────────┴────────────────────────────────────┘

모바일:
┌────────────────────────────────────────┐
│  헤더 (타이틀 + 설정 아이콘)            │
├────────────────────────────────────────┤
│  모듈 콘텐츠 (스크롤)                  │
├────────────────────────────────────────┤
│  하단 네비게이션 탭 (5개 아이콘)        │
└────────────────────────────────────────┘
```

### 4-4. 상태 관리 (`MemoNest.state`)

```javascript
state: {
  currentModule: 'todo'|'schedule'|'meeting'|'shopping'|'idea'|'novel'|'diary',
  dbIds: { todo, schedule, meeting, shopping, idea, novel, diary },
  todos: [],         // 로드된 todo 목록
  sttSettings: { enabled: boolean },
  // Google Calendar
  googleCalTokens: null | { access_token, refresh_token, expires_at },
}

// 캐시 (객체 직접 프로퍼티)
_scheduleCache: { [pageId]: { title, datetime, endDatetime, location, category, reminder, memo } }
_meetingCache:  { [pageId]: { title, date, client, summary, actions } }
_meetingScheduleIds: Set<string>   // 회의록 등록완료된 일정 ID

// 캘린더 뷰 상태
_schedView: {
  mode: 'day'|'week'|'month',
  anchor: ISO_date_string,   // 현재 캘린더 기준점 날짜
  selectedDate: YYYY-MM-DD,  // 선택된 날짜
}

// 카테고리 스타일
_catStyle: {
  회의:   { bg, text, dot },
  개인:   { bg, text, dot },
  이벤트: { bg, text, dot },
  약속:   { bg, text, dot },
  기타:   { bg, text, dot },
}
```

---

## 5. 환경 변수 (Cloudflare Worker Secrets)

| Secret 이름 | 용도 |
|------------|------|
| `NOTION_API_KEY` | Notion Integration 토큰 |
| `GEMINI_API_KEY` | Google Gemini AI API 키 |
| `GROQ_API_KEY` | Groq Whisper STT API 키 |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `GOOGLE_REDIRECT_URI` | OAuth 콜백 URL |

---

## 6. 파일 구조

```
webapp/
├── src/
│   └── index.tsx          # Hono 백엔드 (모든 API 라우트)
├── public/
│   └── static/
│       ├── app.js         # 프론트엔드 SPA (MemoNest 객체)
│       └── style.css      # 전역 스타일
├── dist/                  # 빌드 산출물 (vite build)
│   └── _worker.js
├── wrangler.jsonc          # Cloudflare 설정
├── vite.config.ts          # 빌드 설정
├── package.json
└── tsconfig.json
```

---

## 7. 알려진 제약사항 및 TODO

### 제약사항
- **KV/D1 미사용** — 모든 데이터는 Notion API를 통해 저장. 서버 캐시 없음
- **In-memory Rate Limiter** — Worker 인스턴스별 독립적. 여러 인스턴스가 뜨면 각각 초기화됨
- **`refresh_token` 저장** — Google OAuth refresh_token을 localStorage에만 저장. 브라우저 초기화 시 재인증 필요
- **Worker CPU limit** — Gemini/STT API 25초 타임아웃 적용. Cloudflare Free 플랜 30ms CPU 제한

### 백엔드 TODO
- `POST /api/meetings` — `scheduleId`만 있고 `transcript`·`manualNotes` 둘 다 비어있을 때 400 반환하는 조건 완화 필요
  ```typescript
  // 현재 (버그):
  if (!transcript && !manualNotes) return c.json({ error: '...' }, 400)
  // 수정 필요:
  if (!transcript && !manualNotes && !scheduleId && !client) return c.json({ error: '...' }, 400)
  ```

### 프론트엔드 TODO
- 다크모드 지원
- PWA(오프라인 캐싱) 지원
- 회의록 페이지 내 블록 내용(안건·논의·액션아이템) 수정 기능
- 일정 드래그 앤 드롭으로 날짜 이동

---

## 8. API 엔드포인트 전체 목록

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/notion/init` | 7개 DB 초기화/재사용 |
| POST | `/api/notion/recover` | DB ID 자동 탐색 + 빈 DB 정리 |
| GET | `/api/todos?dbId=` | Todo 목록 |
| POST | `/api/todos` | Todo 생성 |
| PATCH | `/api/todos/:pageId` | Todo 수정 |
| DELETE | `/api/todos/:pageId` | Todo 삭제 |
| GET | `/api/schedules?dbId=` | 일정 목록 |
| POST | `/api/schedules` | 일정 생성 (endDatetime 지원) |
| PATCH | `/api/schedules/:pageId` | 일정 수정 (endDatetime 지원) |
| DELETE | `/api/schedules/:pageId` | 일정 삭제 |
| GET | `/api/meetings?dbId=` | 회의록 목록 |
| POST | `/api/meetings` | 회의록 생성 + AI 구조화 |
| PATCH | `/api/meetings/:pageId` | 회의록 수정 |
| GET | `/api/shopping?dbId=` | 쇼핑 목록 |
| POST | `/api/shopping` | 쇼핑 아이템 추가 + AI 추천 |
| PATCH | `/api/shopping/:pageId` | 쇼핑 아이템 수정 |
| DELETE | `/api/shopping/:pageId` | 쇼핑 아이템 삭제 |
| GET | `/api/ideas?dbId=` | 아이디어 목록 |
| POST | `/api/ideas` | 아이디어 생성 + AI 분석 |
| PATCH | `/api/ideas/:pageId` | 아이디어 수정 |
| DELETE | `/api/ideas/:pageId` | 아이디어 삭제 |
| GET | `/api/novels?dbId=` | 소설 메모 목록 |
| POST | `/api/novels` | 소설 메모 생성 |
| PATCH | `/api/novels/:pageId` | 소설 메모 수정 |
| DELETE | `/api/novels/:pageId` | 소설 메모 삭제 |
| GET | `/api/diary?dbId=` | 일기 목록 |
| POST | `/api/diary` | 일기 생성 |
| PATCH | `/api/diary/:pageId` | 일기 수정 |
| DELETE | `/api/diary/:pageId` | 일기 삭제 |
| POST | `/api/stt` | 음성 → 텍스트 (Groq Whisper) |
| POST | `/api/ai/structure` | 범용 AI 구조화 (Gemini) |
| GET | `/api/google/auth-url` | Google OAuth URL 생성 |
| GET | `/api/google/callback` | Google OAuth 콜백 처리 |
| POST | `/api/google/calendar/events` | Google Calendar 이벤트 생성 |
| POST | `/api/google/calendar/sync-all` | Notion 일정 전체 Google Calendar 동기화 |
