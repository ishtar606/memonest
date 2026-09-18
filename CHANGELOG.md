# Changelog

## [2026-09-18] (반복 일정)
- **feat:** 반복 일정 — 일정 DB에 '반복'(매일/매주/격주/매월) 추가(구버전 DB 자동 스키마 보강), 등록/수정 모달 반복 선택, 캘린더·리스트에 반복 인스턴스 전개(🔁 표시), reminders 스케줄러가 반복 발생분도 알림

## [2026-09-18] (모바일 수정)
- **fix:** 안드로이드 Chrome에서 입력 시 키보드가 닫히던 문제 — viewport의 maximum-scale=1.0 제거 + form 입력 글꼴 16px로(포커스 자동 확대 방지)
- **fix:** 노션 DB '생성' 시 Netlify 함수 타임아웃으로 'Failed to fetch' 나던 문제 — initNotion에 25초 타임아웃 + 실패 시 기존 DB '복원'으로 자동 대체

## [2026-09-18] (개선)
- **perf:** 홈 대시보드 데이터 fetch 최적화 — todos/schedules를 각 1회만 호출해 위젯들이 공유(기존 5회 → 2회)
- **fix:** 일정 캘린더 날짜 버킷팅을 선택 타임존 기준으로 통일 — 보기 타임존과 저장 타임존이 다를 때 하루 어긋나던 문제 해결(월/주/일 + 리스트)
- **feat:** 회의록 'AI 재정리' 버튼 — 기존 회의록의 원본 내용으로 요약을 다시 생성해 노션 본문에 비파괴적으로 추가

## [2026-09-18] v3.0.0 (정식 버전)
- **feat:** 정식 버전 출시 — Netlify + Notion 구조 안정화
- **feat(UX):** PC 홈 개편 — 사이드바와 중복되던 '빠른 실행' 모듈 그리드 제거, '오늘 할 일'·'이번 주 일정'을 최상단에 우선 배치. 모바일은 사이드바가 없어 바로가기 그리드 유지(하단으로 이동)
- **fix:** 버전 배너의 스택 표기 Cloudflare Pages → Netlify

## [2026-09-17]
- **feat:** Cloudflare Workers → Netlify(Node Functions) 호스팅 전환 (netlify.toml, netlify/functions/api.ts, 정적 index.html), Notion 데이터 계층 유지
- **fix:** Google OAuth redirect URI를 하드코딩된 gensparksite 도메인 대신 요청 Origin/APP_BASE_URL 기반으로 동적 산출
- **fix:** /api/* 가 404(HTML) 반환하던 문제 수정 — netlify.toml 의 /api redirect(프리픽스 소실) 제거하고 함수 config.path=['/api/*'] 로 원본 경로 보존
- **fix:** 일정 연동 회의록 작성 시 회의록 날짜가 오늘로 고정되던 문제 — 연동된 일정의 날짜를 기본값으로 사용
- **feat:** 일정 타임존(GMT) 선택 기능 — 일정 전체화면에 타임존 선택 바 추가(기본값은 단말 위치 자동 감지, localStorage 저장), 일정 등록/수정 모달에도 개별 타임존 선택 추가(전체화면 값이 기본값), 저장 ISO 및 리스트 표시를 선택 타임존 기준으로 처리
- **feat:** 웹푸시 알림(Android/데스크톱/iOS 공통) — VAPID 기반 구독(/api/push/*), Notion에 구독 DB 저장, sw.js push/notificationclick 핸들러, iOS는 홈화면 추가 안내, Netlify Scheduled Function(reminders.ts, 5분 주기)으로 임박 일정 리마인더 발송
- **fix:** STT(음성인식) 실패 시 원인 불명 문제 — groqSTT가 Groq 오류/빈 녹음/키 미설정을 삼키지 않고 실제 메시지를 throw, 프론트가 서버 error 메시지를 토스트로 표시
- **fix:** AI 요약이 항상 빈 결과({})로 반환되던 문제 — deprecated된 gemini-1.5-flash(v1beta 404) 교체 + 과부하(503)/쿼터(429) 대응: gemini-2.5-flash 우선, 백오프 재시도 후 gemini-flash-latest/2.0-flash로 폴백
- **fix:** 회의록 AI 요약 프롬프트 개선(원문 충실·창작 금지) + 노션 저장 구조 개편(긴 요약/논의/액션/원본을 토글 블록으로 접기, DB 속성은 미리보기만)
- **fix:** 회의록 요약이 "회의 아님" 판단 시 내용을 통째로 비우던 문제 — 입력 종류와 무관하게 항상 요약/정리하도록 프롬프트 수정(안건/액션만 없으면 빈 배열)
- **fix:** 기존 setup 사용자가 웹푸시 알림 켜기 실패하던 문제 — parentPageId가 없으면 schedule DB의 부모 페이지에서 루트 페이지를 역추적하도록 개선
- **fix:** 서비스워커 등록 실패(scope 제약)로 알림 켜기 무반응 — sw.js를 /static/sw.js에서 루트 /sw.js로 이동하여 scope '/' 허용
- **feat:** 홈 대시보드 강화 — '오늘 할 일'(기한초과/오늘마감 우선 정렬)과 '이번 주 일정' 위젯 추가
- **feat:** ToDo↔일정 연계 — ToDo 카드에 '일정으로 잡기' 버튼(제목·마감일 프리필), 일정 화면에 오늘까지 할 일 마감 배너
