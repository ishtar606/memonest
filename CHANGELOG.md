# Changelog

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
