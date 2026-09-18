// MemoNest - Main Application
// ═══════════════════════════════════════════════════════════════════════════════

const MemoNest = {
  // ── State ──────────────────────────────────────────────────────────────────
  // ── 앱 버전/개발 로그 ─────────────────────────────────────────────────────
  VERSION: '3.0.0',
  CHANGELOG: [
    { ver: '3.0.0', date: '2026-09-18', changes: [
      '정식 버전 출시 🎉 (Netlify + Notion 안정화)',
      'PC 홈 개편: 사이드바와 중복되던 빠른실행 그리드 제거',
      '홈 최상단에 오늘 할 일 + 이번 주 일정 우선 배치',
      'ToDo→일정 연계 + 일정 화면 마감 배너',
      '웹푸시 알림(임박 일정 리마인더) + 타임존 선택',
      '회의록 AI 요약 개선 + 노션 토글 구조',
    ] },
    { ver: '2.5.0', date: '2026-09-17', changes: [
      'Netlify 호스팅 전환 (Notion 데이터 유지)',
      '버그수정: /api 라우팅 404 문제 해결',
      '버그수정: 일정탭 회의록 저장 후 목록/노션 반영 + 회의 카드 완료 배지',
      '일정 타임존(GMT) 선택 기능: 전체화면 설정(단말 자동 감지 기본) + 등록/수정 개별 선택',
      '일정 연동 회의록 날짜를 해당 일정 날짜로 자동 설정',
    ] },
    { ver: '2.4.0', date: '2026-09-17', changes: [
      '버그수정: 일정→회의록 저장 후 회의록 리스트 즉시 갱신 (모듈 분기 처리)',
      '버그수정: scheduleId/client 있으면 노션 저장 허용 (빈값 조건 완화)',
      '버그수정: 회의록 카드에 ✏️ 수정 버튼 추가 + PATCH /api/meetings/:pageId',
      '일정등록/수정 화면: 시작시간 + 종료시간 입력 필드 2분할 추가',
      '일정관리 화면 2분할: 왼쪽 일/주/월 캘린더 + 오른쪽 일정 리스트뷰',
      '카테고리별 파스텔 색상 구분 + fadeSlide 전환 애니메이션',
    ] },
    { ver: '2.3.0', date: '2026-09-17', changes: [
      '회의록 완전 개편: 리스트뷰 메인 + 팝업 작성 UI',
      '일정-회의록 연동: 회의 카테고리 일정 → 회의록 등록가능/완료 구분 표시',
      'AI 처리 버튼 수정: 25초 타임아웃 + 에러 복원, 실패해도 기본값으로 노션 저장',
      '회의록 작성 시 scheduleId 전달 → 노션 일정 ID 필드 저장',
    ] },
    { ver: '2.2.0', date: '2026-09-16', changes: [
      'Google Calendar 연동: OAuth 2.0 인증 + 일정 자동 동기화',
      '일정 탭: 구글캘린더 연동 버튼 + 개별/전체 내보내기',
      '토큰 자동 갱신 (refresh_token 기반, 만료 5분 전 갱신)',
    ] },
    { ver: '2.1.4', date: '2026-09-16', changes: [
      'Bug Fix: 비대면링크 포함 일정 편집버튼 안눌리는 문제 — onclick 인라인 특수문자 깨짐 → data-sid + _scheduleCache 방식으로 근본 해결',
      '장소 자동 파싱: "SKT A타워 3층 회의실 A" → Maps는 "SKT A타워"만 검색, "3층 회의실 A"는 목록에 인라인 표시',
      '입력 hint: Maps 검색어 미리보기 + 층/호실 분리 안내',
    ] },
    { ver: '2.1.3', date: '2026-09-16', changes: [
      'Bug Fix: 일정 장소+비대면 링크 동시 저장 지원 — 2개 입력칸 분리 (장소명 / 비대면 링크)',
      '저장 포맷: "장소명\\n[링크]" 구분자 — Notion DB 스키마 변경 없이 둘 다 저장',
      '목록: 장소(Maps) + 비대면링크 동시 표시, 각각 독립 클릭 가능',
      '구버전 단일 필드 데이터 자동 호환',
    ] },
    { ver: '2.1.2', date: '2026-09-16', changes: [
      '일정 장소: 실제 장소 입력 → Google Maps 링크로 자동 변환 (목록에서 클릭 시 지도 팝업)',
      '일정 장소: Zoom·Meet·Teams 등 비대면 링크 감지 → 목록에서 바로 클릭 입장 가능',
      '일정 장소 입력 시 실시간 hint 표시 (장소 확인 링크 / 비대면 링크 감지 안내)',
    ] },
    { ver: '2.1.1', date: '2026-09-16', changes: [
      'Bug Fix: 앱 내부 DB 복원 모달 추가 (recoverFromApp) — loadTodos 에러 화면에서 바로 복원 가능',
      'Bug Fix: loadShopping/loadSchedules/loadMeetings 에 Notion 에러 응답 감지 + 복원 버튼 추가 (일관성)',
    ] },
    { ver: '2.1.0', date: '2026-09-16', changes: [
      'Phase 2.1-a: 일정 수정 기능 (PATCH /api/schedules/:pageId + 인라인 수정 폼)',
      'Phase 2.1-b: ToDo 반복 태스크 완료 시 다음 날짜 자동 재생성 (매일/매주/매월)',
      'Phase 2.1-c: 홈 대시보드 — 오늘 일정 미리보기 카드 + ToDo 진행률 카드 (PC/모바일)',
      'Phase 2.2-a: ToDo AI 우선순위·마감일 자동 추천 버튼 + 결과 UI 연결',
      'Phase 2.2-b: 일기 저장 시 AI 한줄 요약·무드 자동 생성',
      'Phase 2.3-a: ToDo 드래그&드롭 순서 변경 + localStorage 영속화',
      'Phase 2.3-b: 쇼핑 카테고리별 그룹화 뷰 (목록/카테고리 뷰 스위처, 접기/펼치기, 진행률 바)',
      'Phase 2.3-c: PWA Service Worker 오프라인 캐시 (Cache First + Network First 전략)',
    ] },
    { ver: '2.0.0', date: '2026-09-16', changes: ['ToDo/일정/쇼핑 항목 삭제 기능 (Notion 아카이브)', 'ToDo 전체 필드 인라인 수정 기능 (제목·상태·우선순위·마감일·메모)', '홈 대시보드 ToDo 미완료·기한초과 카운터 배지 (PC/모바일)', 'Bug Fix: Firefox MediaRecorder mimeType 동적 감지 fallback', 'Bug Fix: stopRecording() 실제 mimeType 사용하도록 수정', 'Bug Fix: PC 홈 settings 카드 showMoreMenu→showSettings 수정'] },
    { ver: '1.4.4', date: '2026-09-16', changes: ['DB 복원 시 중복 자동 정리: 빈 중복 DB Notion에서 삭제, 데이터 있는 것은 보존', '복원 결과에 삭제/보존 현황 상세 표시'] },
    { ver: '1.4.3', date: '2026-09-16', changes: ['Notion DB 복원: created_time 정렬로 가장 오래된(원본) DB 확실히 선택', '복원 결과에 중복 세트 수 + 원본 생성 시간 표시'] },
    { ver: '1.4.0', date: '2026-09-16', changes: ['보안: Genspark Identity 인증 적용 (Sign in with Genspark)', 'STT 설정창 추가 (마이크 환경별 가이드)', '사용자 정보 헤더 표시', '기능 전체 자체 검토 및 버그 수정', '개발 로그 정보창 추가'] },
    { ver: '1.3.0', date: '2026-09-16', changes: ['일정: GMT 기준시간 표시 + 단말 타임존 동기화', 'ToDo: 태그 인라인 표시 + 태그별 그룹 필터 기능'] },
    { ver: '1.2.0', date: '2026-09-16', changes: ['PC 반응형 레이아웃 (사이드바+헤더)', 'ToDo 태그 저장 + 뱃지 표시', '창 크기 자동 레이아웃 전환'] },
    { ver: '1.1.0', date: '2026-09-09', changes: ['TypeScript 문법 제거 (blank page 버그 수정)', '삼항연산자 문법 오류 수정', 'PC/모바일 듀얼 레이아웃 초기 구현'] },
    { ver: '1.0.0', date: '2026-09-09', changes: ['MemoNest 최초 구현 (7개 모듈: ToDo, 일정, 회의록, 장보기, 아이디어, 소설, 일기)', 'Notion API 자동 DB 생성', 'Gemini AI 구조화', 'Groq Whisper STT'] },
  ],

  state: {
    currentModule: 'home',
    dbIds: {},
    isSetupDone: false,
    todos: [],
    recording: false,
    mediaRecorder: null,
    audioChunks: [],
    recordingTimer: null,
    recordingSeconds: 0,
    currentUser: null,
    googleCalTokens: null,  // { access_token, refresh_token, expires_in, issued_at }
    // 일정 타임존 오프셋(분). null이면 단말 위치 기반 자동 감지값 사용.
    // 예: 한국 +540, 미국 동부(EST) -300
    tzOffset: null,
    // 웹푸시 알림
    pushEnabled: false,
    pushDbId: null,
    sttSettings: {
      enabled: true,
      language: 'ko',
      autoStop: 10,  // 초
    },
  },

  // ── Storage Helpers ────────────────────────────────────────────────────────
  save(key, val) { localStorage.setItem(`mn_${key}`, JSON.stringify(val)); },
  load(key, def = null) {
    try { return JSON.parse(localStorage.getItem(`mn_${key}`)) ?? def; }
    catch { return def; }
  },

  // ── Init ───────────────────────────────────────────────────────────────────
  async init() {
    this.state.dbIds = this.load('dbIds', {});
    this.state.isSetupDone = Object.keys(this.state.dbIds).length === 7;
    this.state.sttSettings = this.load('sttSettings', this.state.sttSettings);
    this.state.googleCalTokens = this.load('googleCalTokens', null);
    // 타임존 오프셋: 저장값 우선, 없으면 단말 위치(브라우저) 기반 자동 감지
    this.state.tzOffset = this.load('tzOffset', this._deviceTzOffset());
    // 웹푸시 상태 복원
    this.state.pushEnabled = this.load('pushEnabled', false);
    this.state.pushDbId = this.load('pushDbId', null);
    // Genspark 사용자 정보 로드 (배포 환경)
    await this.loadCurrentUser();
    // Google OAuth 콜백 메시지 수신 리스너 등록
    window.addEventListener('message', (e) => this._onOAuthMessage(e));
    this.render();
  },

  async loadCurrentUser() {
    try {
      const res = await fetch('/__genspark_auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated) {
          this.state.currentUser = { id: data.id, email: data.email, name: data.name, avatar: data.avatar };
          return;
        }
      }
    } catch (_) {}
    // 로컬 개발 환경 fallback
    this.state.currentUser = null;
  },

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  showModal(title, content, onConfirm = null) {
    const existing = document.getElementById('app-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="document.getElementById('app-modal').remove()">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${onConfirm ? `<div style="margin-top:16px;display:flex;gap:8px;">
          <button class="btn btn-secondary btn-block" style="flex:1" onclick="document.getElementById('app-modal').remove()">취소</button>
          <button class="btn btn-primary btn-block" style="flex:1" id="modal-confirm-btn">확인</button>
        </div>` : ''}
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    if (onConfirm) document.getElementById('modal-confirm-btn').onclick = onConfirm;
  },

  // ── Is PC ──────────────────────────────────────────────────────────────────
  isPC() { return window.innerWidth >= 768; },

  // ── Render ─────────────────────────────────────────────────────────────────
  render() {
    const app = document.getElementById('app');
    // 기존 FAB 제거
    document.querySelectorAll('.fab, .pc-fab').forEach(el => el.remove());

    if (!this.state.isSetupDone) {
      app.innerHTML = `<div class="mobile-layout" style="display:block">${this.renderSetup()}</div>`;
      return;
    }

    if (this.isPC()) {
      this.renderPC(app);
    } else {
      this.renderMobile(app);
    }
    this.afterRender(this.state.currentModule);
  },

  // ── PC Render ──────────────────────────────────────────────────────────────
  renderPC(app) {
    app.innerHTML = `
    <div class="pc-layout" style="display:flex">
      ${this.renderPCSidebar()}
      <div class="pc-main">
        ${this.renderPCHeader()}
        <div class="pc-content" id="main-content">
          ${this.renderModule(this.state.currentModule)}
        </div>
      </div>
    </div>`;
    this.attachPCFAB();
  },

  // ── Mobile Render ──────────────────────────────────────────────────────────
  renderMobile(app) {
    app.innerHTML = `
    <div class="mobile-layout" style="display:flex;flex-direction:column;min-height:100vh">
      ${this.renderHeader()}
      <main class="main-content" id="main-content">
        ${this.renderModule(this.state.currentModule)}
      </main>
      ${this.renderBottomNav()}
    </div>`;
    this.attachFAB();
  },

  // ── PC Sidebar ─────────────────────────────────────────────────────────────
  renderPCSidebar() {
    const navGroups = [
      { label: '메인', items: [
        { id: 'home', icon: '🏠', name: '홈 대시보드' },
      ]},
      { label: '일정 & 할 일', items: [
        { id: 'todo', icon: '📋', name: 'ToDo 관리' },
        { id: 'schedule', icon: '📅', name: '일정 관리' },
      ]},
      { label: '메모 & 기록', items: [
        { id: 'meeting', icon: '🎙️', name: '회의록' },
        { id: 'idea', icon: '💡', name: '아이디어' },
        { id: 'novel', icon: '📖', name: '소설 메모' },
      ]},
      { label: '생활', items: [
        { id: 'shopping', icon: '🛒', name: '장보기' },
        { id: 'diary', icon: '📔', name: '일기' },
      ]},
    ];
    return `
    <aside class="pc-sidebar">
      <div class="pc-sidebar-logo">
        <h1>🪺 MemoNest</h1>
        <p>스마트 노션 메모앱</p>
      </div>
      ${navGroups.map(group => `
        <div class="pc-nav-section">
          <div class="pc-nav-label">${group.label}</div>
          ${group.items.map(item => `
            <button class="pc-nav-item ${this.state.currentModule === item.id ? 'active' : ''}"
              onclick="MemoNest.navigate('${item.id}')">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.name}</span>
            </button>`).join('')}
        </div>`).join('')}
      <div style="margin-top:auto;padding:16px;border-top:1px solid var(--border)">
        ${this.state.currentUser ? `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(99,102,241,0.08);border-radius:10px;margin-bottom:8px">
          ${this.state.currentUser.avatar ? `<img src="${this.state.currentUser.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" alt="">` : `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700">${(this.state.currentUser.name||this.state.currentUser.email||'?')[0].toUpperCase()}</div>`}
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.state.currentUser.name || ''}</div>
            <div style="font-size:10px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.state.currentUser.email || ''}</div>
          </div>
        </div>` : ''}
        <button class="pc-nav-item" onclick="MemoNest.showSettings()" style="color:#94a3b8">
          <span class="nav-icon">⚙️</span><span>설정</span>
        </button>
        <button class="pc-nav-item" onclick="MemoNest.showChangelog()" style="color:#94a3b8">
          <span class="nav-icon">📋</span><span>개발 로그 v${this.VERSION}</span>
        </button>
        <a href="https://notion.so" target="_blank" class="pc-nav-item" style="text-decoration:none;display:flex;color:#94a3b8">
          <span class="nav-icon">🔗</span><span>노션에서 보기</span>
        </a>
      </div>
    </aside>`;
  },

  // ── PC Header ──────────────────────────────────────────────────────────────
  renderPCHeader() {
    const titles = {
      home: { icon: '🪺', title: 'MemoNest 대시보드', sub: '오늘도 기록해요' },
      todo: { icon: '📋', title: 'ToDo 관리', sub: '할 일을 체계적으로' },
      schedule: { icon: '📅', title: '일정 관리', sub: '스케줄을 한눈에' },
      meeting: { icon: '🎙️', title: '회의록', sub: 'STT + AI 자동 정리' },
      shopping: { icon: '🛒', title: '장보기 목록', sub: 'AI 구매처 추천' },
      idea: { icon: '💡', title: '아이디어 메모', sub: 'AI가 정리해드려요' },
      novel: { icon: '📖', title: '소설 메모', sub: 'AI 시나리오 도우미' },
      diary: { icon: '📔', title: '일기', sub: '크림이 · 대붕이 · 나의 일기' },
    };
    const info = titles[this.state.currentModule] || titles.home;
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    return `
    <header class="pc-header">
      <div>
        <div class="pc-header-title">${info.icon} ${info.title}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${today} · ${info.sub}</div>
      </div>
      <div class="pc-header-actions">
        <button class="pc-header-btn" onclick="MemoNest.showAddForCurrentModule()">
          <i class="fas fa-plus"></i> 새로 추가
        </button>
        <button class="pc-header-btn" onclick="MemoNest.showSettings()" title="설정">
          <i class="fas fa-cog"></i>
        </button>
        ${this.state.currentUser ? `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:rgba(99,102,241,0.08);font-size:12px;color:#475569">
          ${this.state.currentUser.avatar ? `<img src="${this.state.currentUser.avatar}" style="width:22px;height:22px;border-radius:50%;object-fit:cover" alt="">` : `<div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700">${(this.state.currentUser.name||this.state.currentUser.email||'?')[0].toUpperCase()}</div>`}
          <span>${this.state.currentUser.name || this.state.currentUser.email || ''}</span>
        </div>` : ''}
        <a href="https://notion.so" target="_blank" class="pc-header-btn" style="text-decoration:none">
          <i class="fas fa-external-link-alt"></i> 노션 열기
        </a>
      </div>
    </header>`;
  },

  showAddForCurrentModule() {
    const actions = {
      todo: () => this.showAddTodo(),
      schedule: () => this.showAddSchedule(),
      meeting: () => this.showAddMeetingModal(),
      shopping: () => this.showAddShopping(),
      idea: () => this.showAddIdea(),
      novel: () => this.showAddNovel(),
      diary: () => this.showAddDiary(),
    };
    const action = actions[this.state.currentModule];
    if (action) action();
  },

  attachPCFAB() {
    const fabConfigs = {
      todo: { icon: 'fa-plus', action: () => this.showAddTodo() },
      schedule: { icon: 'fa-plus', action: () => this.showAddSchedule() },
      shopping: { icon: 'fa-plus', action: () => this.showAddShopping() },
      idea: { icon: 'fa-lightbulb', action: () => this.showAddIdea() },
      novel: { icon: 'fa-pen', action: () => this.showAddNovel() },
      diary: { icon: 'fa-plus', action: () => this.showAddDiary() },
    };
    const config = fabConfigs[this.state.currentModule];
    if (!config) return;
    const fab = document.createElement('button');
    fab.className = 'pc-fab';
    fab.style.display = 'flex';
    fab.innerHTML = `<i class="fas ${config.icon}"></i>`;
    fab.onclick = config.action.bind(this);
    document.body.appendChild(fab);
  },

  // ── Setup Screen ───────────────────────────────────────────────────────────
  renderSetup() {
    return `
    <div class="setup-screen">
      <div class="setup-logo">
        <span class="emoji">🪺</span>
        <h2>MemoNest</h2>
        <p>첫 설정을 완료하면 모든 기능을 사용할 수 있어요</p>
      </div>

      <div class="setup-step">
        <h3><span class="step-badge">1</span> Notion 페이지 연결</h3>
        <p>노션에서 MemoNest 루트 페이지 ID를 입력해주세요.<br>
        페이지 URL에서 마지막 32자리가 Page ID입니다.<br>
        <small style="color:#94a3b8">예: notion.so/abc123... → abc123... 부분</small></p>
        <input class="form-input" id="setup-page-id" placeholder="노션 페이지 ID (32자리)" />
      </div>

      <div class="setup-step">
        <h3><span class="step-badge">2</span> 노션 DB 자동 생성</h3>
        <p>위 페이지 안에 7개의 데이터베이스가 자동으로 생성됩니다.<br>
        📋 ToDo · 📅 일정 · 🎙️ 회의록 · 🛒 장보기<br>
        💡 아이디어 · 📖 소설 · 📔 일기</p>
        <p style="font-size:12px;color:#6366f1;background:rgba(99,102,241,0.08);padding:8px 12px;border-radius:8px;margin-bottom:10px">
          ✅ 기존 DB가 있으면 자동으로 재사용합니다 (데이터 보존)
        </p>
        <button class="btn btn-primary btn-block" id="setup-init-btn" onclick="MemoNest.initNotion()">
          <i class="fas fa-magic"></i> 노션 DB 자동 생성 / 기존 DB 연결
        </button>
        <button class="btn btn-secondary btn-block" style="margin-top:8px" id="setup-recover-btn" onclick="MemoNest.recoverNotion()">
          <i class="fas fa-search"></i> 기존 DB ID 자동 복원
        </button>
      </div>

      <div id="setup-progress" style="display:none">
        <div class="loading">
          <div>
            <div class="spinner" style="margin:0 auto 12px"></div>
            <p style="text-align:center;color:#64748b;font-size:14px" id="setup-progress-text">노션 DB 생성 중...</p>
          </div>
        </div>
      </div>
    </div>`;
  },

  // ── 장소 헬퍼 ─────────────────────────────────────────────────────────────
  // 저장 포맷: "장소명\n[링크]" — 장소만, 링크만, 둘 다 모두 가능
  // _parseLocation(raw) → { place, link }
  _parseLocation(raw) {
    if (!raw) return { place: '', link: '' };
    const parts = raw.split('\n');
    const place = (parts[0] || '').trim();
    // 두 번째 줄이 있고 [링크] 형식이면 링크 추출
    const linkLine = (parts[1] || '').trim();
    const link = linkLine.startsWith('[') && linkLine.endsWith(']')
      ? linkLine.slice(1, -1).trim()
      : '';
    return { place, link };
  },

  // { place, link } → Notion 저장용 문자열
  _serializeLocation(place, link) {
    const p = (place || '').trim();
    const l = (link || '').trim();
    if (p && l) return `${p}\n[${l}]`;
    if (p) return p;
    if (l) return l;
    return '';
  },

  // 장소 문자열에서 구글맵스 검색용 핵심 주소와 상세 정보(층·호실 등) 분리
  // 예: "SKT A타워 3층 회의실 A" → { address: "SKT A타워", detail: "3층 회의실 A" }
  // 예: "강남역 2번 출구 앞 스타벅스" → { address: "강남역 2번 출구 앞 스타벅스", detail: "" }
  _splitPlaceDetail(place) {
    if (!place) return { address: '', detail: '' };
    // 층·호·실·번지 패턴 감지
    const detailPattern = /\s+(\d+층|\d+F|B\d+층?|\d+호|[A-Za-z]\동|\d+번\s*출구|\d+번\s*게이트|[가-힣]+\s*회의실|[가-힣]+\s*강의실|[가-힣]+\s*홀|[A-Z]\d*\s*룸|room\s*\w+)/i;
    const match = place.match(detailPattern);
    if (match) {
      const idx = place.indexOf(match[0]);
      return {
        address: place.slice(0, idx).trim(),
        detail: place.slice(idx).trim(),
      };
    }
    return { address: place.trim(), detail: '' };
  },

  // URL 여부 판별
  _isUrl(str) {
    return /^(https?:\/\/|zoom\.us|meet\.google\.com|teams\.microsoft\.com)/i.test((str || '').trim());
  },

  // 비대면 링크 브랜드 감지 → 아이콘+이름
  _getOnlineMeta(url) {
    const u = (url || '').toLowerCase();
    if (u.includes('zoom.us') || u.includes('zoom.com')) return { icon: '📹', name: 'Zoom 참여' };
    if (u.includes('meet.google.com')) return { icon: '🟢', name: 'Google Meet 참여' };
    if (u.includes('teams.microsoft.com')) return { icon: '🟣', name: 'Teams 참여' };
    if (u.includes('webex.com')) return { icon: '🔵', name: 'Webex 참여' };
    if (u.includes('discord.com') || u.includes('discord.gg')) return { icon: '🎮', name: 'Discord 참여' };
    if (u.includes('gather.town')) return { icon: '🏕️', name: 'Gather Town' };
    return { icon: '🌐', name: '링크 열기' };
  },

  // 장소 raw 문자열 → 목록 표시용 HTML
  // 장소명은 핵심주소만 Maps 링크, 층·회의실 등 상세는 인라인 텍스트로 함께 표시
  _renderLocationBadge(raw) {
    if (!raw) return '';
    const { place, link } = this._parseLocation(raw);
    let html = '';

    if (place && !this._isUrl(place)) {
      const { address, detail } = this._splitPlaceDetail(place);
      const searchTarget = address || place;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTarget)}`;
      html += `<a href="${mapsUrl}" target="_blank" rel="noopener"
        style="font-size:12px;color:#64748b;display:inline-flex;align-items:center;gap:4px;text-decoration:none;cursor:pointer"
        title="Google Maps에서 보기">
        <i class="fas fa-map-marker-alt" style="color:#ef4444"></i> ${address || place}
        <i class="fas fa-external-link-alt" style="font-size:10px;opacity:0.5"></i>
      </a>${detail ? `<span style="font-size:12px;color:#6b7280;margin-left:2px">· ${detail}</span>` : ''}`;
    } else if (place && this._isUrl(place)) {
      // 구버전 호환: place 자리에 URL만 있던 경우
      const href = place.startsWith('http') ? place : `https://${place}`;
      const meta = this._getOnlineMeta(place);
      html += `<a href="${href}" target="_blank" rel="noopener"
        style="font-size:12px;color:#6366f1;display:inline-flex;align-items:center;gap:4px;
               background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);
               border-radius:20px;padding:2px 10px;text-decoration:none;"
        title="${href}">${meta.icon} ${meta.name}</a>`;
    }

    // 비대면 링크
    if (link) {
      const href = link.startsWith('http') ? link : `https://${link}`;
      const meta = this._getOnlineMeta(link);
      html += `${place ? '<span style="margin:0 4px;color:#d1d5db">·</span>' : ''}` +
        `<a href="${href}" target="_blank" rel="noopener"
          style="font-size:12px;color:#6366f1;display:inline-flex;align-items:center;gap:4px;
                 background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);
                 border-radius:20px;padding:2px 10px;text-decoration:none;"
          title="${href}">${meta.icon} ${meta.name}</a>`;
    }

    return html;
  },

  // 장소 입력 hint
  onLocationInput(inputId) {
    const val = (document.getElementById(inputId)?.value || '').trim();
    const hint = document.getElementById(inputId + '-hint');
    if (!hint) return;
    if (!val) { hint.innerHTML = ''; return; }
    if (this._isUrl(val)) {
      const meta = this._getOnlineMeta(val);
      hint.innerHTML = `<span style="color:#6366f1;font-size:11px">${meta.icon} 비대면 링크 감지 → 목록에서 바로 클릭 가능</span>`;
    } else if (val.length >= 2) {
      const { address, detail } = this._splitPlaceDetail(val);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || val)}`;
      const detailHint = detail ? ` <span style="color:#9ca3af">· "${detail}" 은 Maps 검색 제외, 목록에 인라인 표시</span>` : '';
      hint.innerHTML = `<span style="color:#64748b;font-size:11px">📍 Maps 검색어: <a href="${mapsUrl}" target="_blank" rel="noopener" style="color:#ef4444;text-decoration:underline">${address || val}</a>${detailHint}</span>`;
    } else {
      hint.innerHTML = '';
    }
  },

  // ── 앱 내부 DB 복원 (모달 진입) ─────────────────────────────────────────
  recoverFromApp() {
    this.showModal('🔄 노션 DB 복원', `
      <p style="font-size:13px;color:#6b7280;margin-bottom:14px">
        노션 페이지 ID를 입력하면 기존 DB를 자동으로 찾아 연결해요.
      </p>
      <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px">노션 페이지 ID</label>
      <input class="form-input" id="recover-page-id" placeholder="예: 3dda1219f259816b81a6e254cd0c4669"
        style="font-family:monospace;font-size:13px;margin-bottom:6px">
      <p style="font-size:11px;color:#9ca3af;margin:0">
        노션 페이지 URL의 마지막 32자리 영문숫자 (하이픈 있어도 됩니다)
      </p>
      <div id="recover-result" style="margin-top:12px"></div>
    `, () => this.doRecoverFromApp());
  },

  async doRecoverFromApp() {
    const pageId = document.getElementById('recover-page-id')?.value?.trim();
    if (!pageId || pageId.length < 10) {
      this.toast('노션 페이지 ID를 입력해주세요', 'error');
      return;
    }
    const cleanId = pageId.replace(/-/g, '').replace(/.*([a-f0-9]{32}).*/i, '$1');
    const btn = document.getElementById('modal-confirm-btn');
    const resultEl = document.getElementById('recover-result');
    if (btn) { btn.textContent = '탐색 중...'; btn.disabled = true; }
    if (resultEl) resultEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#6b7280"><div class="spinner" style="width:14px;height:14px;border-width:2px"></div> 노션 DB를 탐색하고 있어요...</div>`;
    try {
      const res = await fetch('/api/notion/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPageId: cleanId })
      });
      const data = await res.json();
      if (data.success && data.found === 7) {
        this.state.dbIds = data.databases;
        this.save('dbIds', data.databases);
        this.save('parentPageId', cleanId);
        this.state.isSetupDone = true;
        document.getElementById('app-modal')?.remove();
        const deletedCount = data.deleted?.length || 0;
        const skippedCount = data.skipped?.length || 0;
        let msg = `🎉 DB ${data.found}개 복원 완료!`;
        if (deletedCount > 0) msg += ` · 빈 중복 ${deletedCount}개 자동 삭제`;
        if (skippedCount > 0) msg += ` · 데이터 있는 중복 ${skippedCount}개 보존`;
        this.toast(msg, 'success', 5000);
        this.render();
      } else if (data.success && data.found > 0) {
        if (resultEl) resultEl.innerHTML = `<p style="color:#d97706;font-size:13px">⚠️ ${data.found}/7개만 찾았어요.<br>"DB 자동 생성" 버튼으로 나머지를 생성해주세요.</p>`;
        if (btn) { btn.textContent = '확인'; btn.disabled = false; }
      } else {
        if (resultEl) resultEl.innerHTML = `<p style="color:#ef4444;font-size:13px">😢 해당 페이지에서 DB를 찾지 못했어요.<br>페이지 ID를 다시 확인해주세요.</p>`;
        if (btn) { btn.textContent = '다시 시도'; btn.disabled = false; }
      }
    } catch (e) {
      if (resultEl) resultEl.innerHTML = `<p style="color:#ef4444;font-size:13px">오류: ${e.message}</p>`;
      if (btn) { btn.textContent = '다시 시도'; btn.disabled = false; }
    }
  },

  async recoverNotion() {
    const pageId = document.getElementById('setup-page-id')?.value?.trim();
    if (!pageId || pageId.length < 10) {
      this.toast('노션 페이지 ID를 먼저 입력해주세요', 'error'); return;
    }
    const cleanId = pageId.replace(/-/g, '').replace(/.*([a-f0-9]{32}).*/, '$1');
    const btn = document.getElementById('setup-recover-btn');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 탐색 중...'; btn.disabled = true; }

    try {
      const res = await fetch('/api/notion/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPageId: cleanId })
      });
      const data = await res.json();
      if (data.success && data.found === 7) {
        this.state.dbIds = data.databases;
        this.save('dbIds', data.databases);
        this.save('parentPageId', cleanId);
        this.state.isSetupDone = true;

        // 결과 메시지 조합
        const oldestCreated = data.selectedInfo?.[0]?.created
          ? new Date(data.selectedInfo[0].created).toLocaleString('ko-KR', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})
          : '';
        const deletedCount = data.deleted?.length || 0;
        const skippedCount = data.skipped?.length || 0;

        let msg = `🎉 DB ${data.found}개 복원 완료!`;
        if (oldestCreated) msg += ` (원본: ${oldestCreated})`;
        if (deletedCount > 0) msg += ` · 빈 중복 ${deletedCount}개 자동 삭제`;
        if (skippedCount > 0) msg += ` · 데이터 있는 중복 ${skippedCount}개 보존`;

        this.toast(msg, 'success', 6000);
        this.render();
      } else if (data.success && data.found > 0) {
        this.toast(`⚠️ ${data.found}/7개만 찾았어요. "DB 자동 생성" 버튼으로 나머지를 생성해주세요.`, 'info', 5000);
        if (btn) { btn.innerHTML = '<i class="fas fa-search"></i> 기존 DB ID 자동 복원'; btn.disabled = false; }
      } else {
        this.toast('기존 DB를 찾지 못했어요. "DB 자동 생성" 버튼을 사용해주세요.', 'info');
        if (btn) { btn.innerHTML = '<i class="fas fa-search"></i> 기존 DB ID 자동 복원'; btn.disabled = false; }
      }
    } catch (e) {
      this.toast('복원 실패: ' + e.message, 'error');
      if (btn) { btn.innerHTML = '<i class="fas fa-search"></i> 기존 DB ID 자동 복원'; btn.disabled = false; }
    }
  },

  async initNotion() {
    const pageId = document.getElementById('setup-page-id')?.value?.trim();
    if (!pageId || pageId.length < 10) {
      this.toast('노션 페이지 ID를 입력해주세요', 'error'); return;
    }
    const cleanId = pageId.replace(/-/g, '').replace(/.*([a-f0-9]{32}).*/, '$1');
    document.getElementById('setup-progress').style.display = 'block';
    document.getElementById('setup-init-btn').disabled = true;
    document.getElementById('setup-progress-text').textContent = '노션에 DB를 생성하는 중... (약 30초 소요)';

    try {
      const res = await fetch('/api/notion/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPageId: cleanId })
      });
      const data = await res.json();
      if (data.success) {
        this.state.dbIds = data.databases;
        this.save('dbIds', data.databases);
        this.save('parentPageId', cleanId); // 웹푸시 구독 DB 생성에 필요
        this.state.isSetupDone = true;
        this.toast('🎉 설정 완료! MemoNest를 시작합니다', 'success');
        this.render();
      } else {
        throw new Error(data.error || '생성 실패');
      }
    } catch (e) {
      this.toast(`오류: ${e.message}`, 'error');
      document.getElementById('setup-init-btn').disabled = false;
      document.getElementById('setup-progress').style.display = 'none';
    }
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  renderHeader() {
    const titles = {
      home: { icon: '🪺', title: 'MemoNest', sub: '오늘도 기록해요' },
      todo: { icon: '📋', title: 'ToDo', sub: '할 일 관리' },
      schedule: { icon: '📅', title: '일정', sub: '스케줄 관리' },
      meeting: { icon: '🎙️', title: '회의록', sub: 'STT + AI 정리' },
      shopping: { icon: '🛒', title: '장보기', sub: 'AI 구매처 추천' },
      idea: { icon: '💡', title: '아이디어', sub: 'AI 구조화' },
      novel: { icon: '📖', title: '소설 메모', sub: 'AI 시나리오 도우미' },
      diary: { icon: '📔', title: '일기', sub: '크림이·대붕이' },
    };
    const info = titles[this.state.currentModule] || titles.home;
    return `
    <header class="app-header">
      <div>
        <h1>${info.icon} ${info.title}</h1>
        <div class="subtitle">${info.sub}</div>
      </div>
      <div class="header-actions">
        ${this.state.currentUser ? `
        <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;padding:4px 8px;background:rgba(99,102,241,0.08);border-radius:8px;cursor:pointer" onclick="MemoNest.showSettings()">
          ${this.state.currentUser.avatar ? `<img src="${this.state.currentUser.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover" alt="">` : `<div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:700">${(this.state.currentUser.name||this.state.currentUser.email||'?')[0].toUpperCase()}</div>`}
          <span style="max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(this.state.currentUser.name||'').split(' ')[0] || ''}</span>
        </div>` : ''}
        <button class="header-btn" onclick="MemoNest.openNotionLink()" title="노션에서 보기">
          <i class="fas fa-external-link-alt"></i>
        </button>
        <button class="header-btn" onclick="MemoNest.showSettings()" title="설정">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </header>`;
  },

  openNotionLink() {
    window.open('https://www.notion.so', '_blank');
  },

  // ── Bottom Nav ─────────────────────────────────────────────────────────────
  renderBottomNav() {
    const items = [
      { id: 'home', icon: 'fa-home', label: '홈' },
      { id: 'todo', icon: 'fa-check-square', label: 'ToDo' },
      { id: 'meeting', icon: 'fa-microphone', label: '회의록' },
      { id: 'diary', icon: 'fa-book', label: '일기' },
      { id: 'more', icon: 'fa-th', label: '더보기' },
    ];
    return `
    <nav class="bottom-nav">
      ${items.map(item => `
        <button class="nav-item ${this.state.currentModule === item.id ? 'active' : ''}"
          onclick="MemoNest.navigate('${item.id}')">
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        </button>`).join('')}
    </nav>`;
  },

  navigate(module) {
    if (module === 'more') {
      this.showMoreMenu(); return;
    }
    this.state.currentModule = module;
    if (this.isPC()) {
      // PC: 사이드바·헤더·컨텐츠만 업데이트 (전체 리렌더 없이)
      const app = document.getElementById('app');
      document.querySelectorAll('.pc-fab').forEach(el => el.remove());
      app.innerHTML = `
        <div class="pc-layout" style="display:flex">
          ${this.renderPCSidebar()}
          <div class="pc-main">
            ${this.renderPCHeader()}
            <div class="pc-content" id="main-content">
              ${this.renderModule(module)}
            </div>
          </div>
        </div>`;
      this.attachPCFAB();
    } else {
      this.render();
    }
    this.afterRender(module);
  },

  showMoreMenu() {
    this.showModal('더보기', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${[
          { id:'schedule', icon:'📅', name:'일정 관리' },
          { id:'shopping', icon:'🛒', name:'장보기' },
          { id:'idea', icon:'💡', name:'아이디어' },
          { id:'novel', icon:'📖', name:'소설 메모' },
        ].map(m => `
          <button onclick="MemoNest.navigate('${m.id}');document.getElementById('app-modal').remove()"
            style="padding:20px;border-radius:14px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;text-align:center;font-size:13px;font-weight:600">
            <span style="font-size:28px;display:block;margin-bottom:6px">${m.icon}</span>${m.name}
          </button>`).join('')}
      </div>
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="MemoNest.showSettings();document.getElementById('app-modal').remove()"
          style="padding:12px;border-radius:10px;border:1px solid #e2e8f0;background:white;cursor:pointer;color:#475569;font-size:13px">
          ⚙️ 설정
        </button>
        <button onclick="MemoNest.showChangelog();document.getElementById('app-modal').remove()"
          style="padding:12px;border-radius:10px;border:1px solid #e2e8f0;background:white;cursor:pointer;color:#475569;font-size:13px">
          📋 개발 로그
        </button>
        <button onclick="MemoNest.resetSetup();document.getElementById('app-modal').remove()"
          style="padding:12px;border-radius:10px;border:1px solid #fee2e2;background:#fff5f5;cursor:pointer;color:#ef4444;font-size:13px;grid-column:1/-1">
          🗑️ 설정 초기화
        </button>
      </div>`);
  },

  resetSetup() {
    if (confirm('설정을 초기화하면 DB 연결이 끊깁니다. 계속할까요?')) {
      localStorage.clear();
      location.reload();
    }
  },

  // ── FAB ────────────────────────────────────────────────────────────────────
  attachFAB() {
    const fabConfigs = {
      todo: { icon: 'fa-plus', action: () => this.showAddTodo() },
      schedule: { icon: 'fa-plus', action: () => this.showAddSchedule() },
      meeting: { icon: 'fa-plus', action: () => this.showAddMeetingModal() },
      shopping: { icon: 'fa-plus', action: () => this.showAddShopping() },
      idea: { icon: 'fa-lightbulb', action: () => this.showAddIdea() },
      novel: { icon: 'fa-pen', action: () => this.showAddNovel() },
      diary: { icon: 'fa-plus', action: () => this.showAddDiary() },
    };
    const config = fabConfigs[this.state.currentModule];
    if (!config) return;
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = `<i class="fas ${config.icon}"></i>`;
    fab.onclick = config.action.bind(this);
    document.body.appendChild(fab);
  },

  // ── Module Router ──────────────────────────────────────────────────────────
  renderModule(module) {
    switch (module) {
      case 'home': return this.renderHome();
      case 'todo': return this.renderTodo();
      case 'schedule': return this.renderSchedule();
      case 'meeting': return this.renderMeeting();
      case 'shopping': return this.renderShopping();
      case 'idea': return this.renderIdea();
      case 'novel': return this.renderNovel();
      case 'diary': return this.renderDiary();
      default: return this.renderHome();
    }
  },

  afterRender(module) {
    switch (module) {
      case 'home': this.loadHomeSummary(); break;
      case 'todo': this.loadTodos(); break;
      case 'schedule': this.loadSchedules(); break;
      case 'meeting': this.loadMeetings(); break;
      case 'shopping': this.loadShopping(); break;
      case 'idea': this.loadIdeas(); break;
      case 'novel': this.loadNovels(); break;
      case 'diary': this.loadDiary(); break;
    }
  },

  async loadHomeSummary() {
    // 홈 대시보드용 미완료 ToDo 카운트 로드
    const el = document.getElementById('home-todo-badge');
    if (el && this.state.dbIds.todo) {
      try {
        const res = await fetch(`/api/todos?dbId=${this.state.dbIds.todo}`);
        const data = await res.json();
        const todos = data.results || [];
        const undone = todos.filter(t => t.properties['상태']?.select?.name !== '완료').length;
        const overdue = todos.filter(t => {
          const d = t.properties['Due Date']?.date?.start;
          const s = t.properties['상태']?.select?.name;
          return d && new Date(d) < new Date() && s !== '완료';
        }).length;
        if (undone > 0) {
          el.textContent = undone + '개 미완료' + (overdue > 0 ? ` · ⚠️${overdue}개 기한초과` : '');
          el.style.display = 'inline-block';
          el.style.background = overdue > 0 ? '#fee2e2' : 'rgba(99,102,241,0.12)';
          el.style.color = overdue > 0 ? '#ef4444' : '#6366f1';
        }
      } catch (_) {}
    }
    // 오늘 일정 미리보기 로드
    const schedEl = document.getElementById('home-schedule-preview');
    if (schedEl && this.state.dbIds.schedule) {
      try {
        const res = await fetch(`/api/schedules?dbId=${this.state.dbIds.schedule}`);
        const data = await res.json();
        const results = data.results || [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayItems = results.filter(s => {
          const dt = s.properties['날짜/시간']?.date?.start || '';
          return dt.startsWith(todayStr);
        });
        const upcomingItems = results.filter(s => {
          const dt = s.properties['날짜/시간']?.date?.start || '';
          return dt > new Date().toISOString() && !dt.startsWith(todayStr);
        }).slice(0, 2);
        const showItems = [...todayItems, ...upcomingItems].slice(0, 3);
        if (!showItems.length) {
          schedEl.innerHTML = `<div style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">오늘 예정된 일정이 없어요 😊</div>`;
        } else {
          schedEl.innerHTML = showItems.map(s => {
            const title = s.properties['일정 제목']?.title?.[0]?.text?.content || '';
            const dtRaw = s.properties['날짜/시간']?.date?.start || '';
            const dtObj = dtRaw ? new Date(dtRaw) : null;
            const isToday = dtRaw.startsWith(todayStr);
            const timeStr = dtObj ? dtObj.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:false }) : '';
            const cat = s.properties['카테고리']?.select?.name || '';
            const catColors = { '회의':'#6366f1', '개인':'#10b981', '이벤트':'#f59e0b', '약속':'#ef4444', '기타':'#94a3b8' };
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9">
              <div style="width:3px;height:32px;border-radius:2px;background:${catColors[cat]||'#6366f1'};flex-shrink:0"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</div>
                <div style="font-size:11px;color:#94a3b8">${isToday ? '오늘' : dtRaw.slice(5,10).replace('-','/')} ${timeStr}</div>
              </div>
              ${isToday ? `<span style="font-size:10px;background:#fef3c7;color:#d97706;padding:2px 6px;border-radius:10px;flex-shrink:0">오늘</span>` : ''}
            </div>`;
          }).join('');
        }
      } catch(_) {
        schedEl.innerHTML = '';
      }
    }
    // PC 홈 ToDo 현황 카드 업데이트
    const todoSumEl = document.getElementById('home-todo-summary');
    if (todoSumEl && this.state.dbIds.todo) {
      try {
        const res = await fetch(`/api/todos?dbId=${this.state.dbIds.todo}`);
        const data = await res.json();
        const todos = data.results || [];
        const total = todos.length;
        const done = todos.filter(t => t.properties['상태']?.select?.name === '완료').length;
        const overdue = todos.filter(t => {
          const d = t.properties['Due Date']?.date?.start;
          const s = t.properties['상태']?.select?.name;
          return d && new Date(d) < new Date() && s !== '완료';
        }).length;
        const pct = total > 0 ? Math.round(done/total*100) : 0;
        todoSumEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:6px">
            <span>완료 ${done}/${total}</span>
            <span style="font-weight:700;color:#6366f1">${pct}%</span>
          </div>
          <div style="background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden">
            <div style="width:${pct}%;background:linear-gradient(90deg,#6366f1,#8b5cf6);height:100%;border-radius:4px;transition:width 0.4s"></div>
          </div>
          ${overdue > 0 ? `<div style="margin-top:6px;font-size:11px;color:#ef4444;font-weight:600">⚠️ 기한초과 ${overdue}개</div>` : `<div style="margin-top:6px;font-size:11px;color:#10b981">✅ 기한초과 없음</div>`}`;
      } catch(_) {}
    }
    // 오늘 할 일 목록 (미완료 우선, 기한초과 강조)
    const todayTodoEl = document.getElementById('home-today-todos');
    if (todayTodoEl && this.state.dbIds.todo) {
      try {
        const res = await fetch(`/api/todos?dbId=${this.state.dbIds.todo}`);
        const data = await res.json();
        const todos = data.results || [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        // 미완료 중: 기한초과 → 오늘마감 → 나머지 순
        const active = todos.filter(t => t.properties['상태']?.select?.name !== '완료');
        const rank = t => {
          const d = t.properties['Due Date']?.date?.start;
          if (d && d < todayStr) return 0;          // 기한초과
          if (d && d.startsWith(todayStr)) return 1; // 오늘마감
          if (d) return 2;                            // 향후 마감
          return 3;                                   // 마감없음
        };
        const sorted = active.sort((a, b) => rank(a) - rank(b)).slice(0, 5);
        if (!sorted.length) {
          todayTodoEl.innerHTML = `<div style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">할 일이 모두 완료됐어요 🎉</div>`;
        } else {
          todayTodoEl.innerHTML = sorted.map(t => {
            const title = t.properties['할 일']?.title?.[0]?.text?.content || '(제목 없음)';
            const d = t.properties['Due Date']?.date?.start || '';
            const overdue = d && d < todayStr;
            const isToday = d && d.startsWith(todayStr);
            const prio = t.properties['우선순위']?.select?.name || '';
            const dueLabel = overdue ? `기한초과 ${d.slice(5,10).replace('-','/')}` : isToday ? '오늘 마감' : d ? d.slice(5,10).replace('-','/') : '';
            const dueColor = overdue ? '#ef4444' : isToday ? '#d97706' : '#94a3b8';
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9">
              <span style="font-size:12px;flex-shrink:0">${prio.includes('높음') ? '🔴' : prio.includes('중간') ? '🟡' : prio.includes('낮음') ? '🟢' : '⚪'}</span>
              <div style="flex:1;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</div>
              ${dueLabel ? `<span style="font-size:10px;color:${dueColor};font-weight:600;flex-shrink:0;white-space:nowrap">${dueLabel}</span>` : ''}
            </div>`;
          }).join('');
        }
      } catch(_) { todayTodoEl.innerHTML = ''; }
    }
    // 이번 주 일정 (오늘~+7일)
    const weekEl = document.getElementById('home-week-schedule');
    if (weekEl && this.state.dbIds.schedule) {
      try {
        const res = await fetch(`/api/schedules?dbId=${this.state.dbIds.schedule}`);
        const data = await res.json();
        const results = data.results || [];
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const items = results
          .map(s => ({ s, dt: s.properties['날짜/시간']?.date?.start || '' }))
          .filter(x => x.dt && new Date(x.dt) >= new Date(now.toISOString().split('T')[0]) && new Date(x.dt) <= weekLater)
          .sort((a, b) => a.dt.localeCompare(b.dt))
          .slice(0, 5);
        if (!items.length) {
          weekEl.innerHTML = `<div style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">이번 주 일정이 없어요 😊</div>`;
        } else {
          const todayStr = now.toISOString().split('T')[0];
          const catColors = { '회의':'#6366f1', '개인':'#10b981', '이벤트':'#f59e0b', '약속':'#ef4444', '기타':'#94a3b8' };
          const wk = ['일','월','화','수','목','금','토'];
          weekEl.innerHTML = items.map(({ s, dt }) => {
            const title = s.properties['일정 제목']?.title?.[0]?.text?.content || '';
            const dObj = new Date(dt);
            const isToday = dt.startsWith(todayStr);
            const cat = s.properties['카테고리']?.select?.name || '';
            const timeStr = dObj.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:false });
            const dayLabel = isToday ? '오늘' : `${dObj.getMonth()+1}/${dObj.getDate()}(${wk[dObj.getDay()]})`;
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9">
              <div style="width:3px;height:32px;border-radius:2px;background:${catColors[cat]||'#6366f1'};flex-shrink:0"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</div>
                <div style="font-size:11px;color:#94a3b8">${dayLabel} ${timeStr}</div>
              </div>
              ${isToday ? `<span style="font-size:10px;background:#fef3c7;color:#d97706;padding:2px 6px;border-radius:10px;flex-shrink:0">오늘</span>` : ''}
            </div>`;
          }).join('');
        }
      } catch(_) { weekEl.innerHTML = ''; }
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════════════════════════════════
  renderHome() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? '좋은 아침이에요! ☀️' : hour < 18 ? '안녕하세요! 👋' : '수고하셨어요! 🌙';
    const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

    const modules = [
      { id:'todo', icon:'📋', name:'ToDo', desc:'할 일 관리' },
      { id:'schedule', icon:'📅', name:'일정', desc:'스케줄' },
      { id:'meeting', icon:'🎙️', name:'회의록', desc:'STT+AI' },
      { id:'shopping', icon:'🛒', name:'장보기', desc:'AI 추천' },
      { id:'idea', icon:'💡', name:'아이디어', desc:'AI 정리' },
      { id:'novel', icon:'📖', name:'소설', desc:'시나리오' },
      { id:'diary', icon:'📔', name:'일기', desc:'오늘의 기록' },
      { id:'settings', icon:'⚙️', name:'설정', desc:'노션 연결' },
    ];

    if (this.isPC()) {
      return `
      <div class="pc-dashboard-banner">
        <div>
          <h2>${greeting}</h2>
          <p>${dateStr} · 모든 메모는 노션에 자동 저장됩니다</p>
        </div>
        <span class="banner-emoji">🪺</span>
      </div>
      <!-- 최상단: 오늘 할 일 + 이번 주 일정 (가장 자주 보는 정보) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="card" style="border-top:3px solid #6366f1">
          <div class="card-header" style="margin-bottom:10px">
            <div class="card-title">✅ 오늘 할 일 <span id="home-todo-badge" style="display:none;font-size:10px;padding:2px 8px;border-radius:20px;margin-left:6px;font-weight:600"></span></div>
            <button onclick="MemoNest.navigate('todo')" style="font-size:12px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:4px 10px;border-radius:20px">전체 보기</button>
          </div>
          <div id="home-today-todos"><div style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">로딩 중...</div></div>
        </div>
        <div class="card" style="border-top:3px solid #10b981">
          <div class="card-header" style="margin-bottom:10px">
            <div class="card-title">🗓️ 이번 주 일정</div>
            <button onclick="MemoNest.navigate('schedule')" style="font-size:12px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:4px 10px;border-radius:20px">전체 보기</button>
          </div>
          <div id="home-week-schedule"><div style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">로딩 중...</div></div>
        </div>
      </div>
      <!-- 보조: 오늘의 일정 상세 + ToDo 진행률 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="card">
          <div class="card-header" style="margin-bottom:10px">
            <div class="card-title">📅 오늘의 일정</div>
            <button onclick="MemoNest.navigate('schedule')" style="font-size:12px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:4px 10px;border-radius:20px">전체 보기</button>
          </div>
          <div id="home-schedule-preview"><div style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">로딩 중...</div></div>
        </div>
        <div class="card">
          <div class="card-header" style="margin-bottom:10px">
            <div class="card-title">📊 ToDo 진행률</div>
            <button onclick="MemoNest.navigate('todo')" style="font-size:12px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:4px 10px;border-radius:20px">전체 보기</button>
          </div>
          <div id="home-todo-summary" style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">로딩 중...</div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-header">
          <div class="card-title">💡 MemoNest 사용 가이드</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;color:#64748b">
          <div style="padding:12px;background:#f8fafc;border-radius:10px">
            <div style="font-weight:600;margin-bottom:4px;color:#1e293b">🎙️ 음성 입력</div>
            회의록, 아이디어, 일기를 음성으로 입력하면 자동으로 텍스트 변환
          </div>
          <div style="padding:12px;background:#f8fafc;border-radius:10px">
            <div style="font-weight:600;margin-bottom:4px;color:#1e293b">🤖 AI 구조화</div>
            입력한 내용을 AI가 자동으로 분석·정리해서 노션에 템플릿으로 저장
          </div>
          <div style="padding:12px;background:#f8fafc;border-radius:10px">
            <div style="font-weight:600;margin-bottom:4px;color:#1e293b">📒 노션 연동</div>
            모든 데이터는 노션에 카테고리별로 자동 저장되어 언제든 조회 가능
          </div>
        </div>
      </div>
      ${this.renderVersionBanner()}`;
    }

    // Mobile
    const latestChange = this.CHANGELOG[0];
    return `
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:20px;border-radius:16px;margin-bottom:16px">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:4px">${greeting}</h2>
      <p style="font-size:13px;opacity:0.8">${dateStr}</p>
    </div>
    <!-- 최상단: 오늘 할 일 (가장 중요) -->
    <div class="card" style="margin-bottom:12px;border-top:3px solid #6366f1">
      <div class="card-header" style="margin-bottom:10px">
        <div class="card-title" style="font-size:14px">✅ 오늘 할 일 <span id="home-todo-badge" style="display:none;font-size:10px;padding:2px 8px;border-radius:20px;margin-left:6px;font-weight:600"></span></div>
        <button onclick="MemoNest.navigate('todo')" style="font-size:11px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:3px 8px;border-radius:20px">전체</button>
      </div>
      <div id="home-today-todos"><div style="font-size:12px;color:#94a3b8;text-align:center;padding:4px 0">로딩 중...</div></div>
    </div>
    <div class="card" style="margin-bottom:12px;border-top:3px solid #10b981">
      <div class="card-header" style="margin-bottom:10px">
        <div class="card-title" style="font-size:14px">🗓️ 이번 주 일정</div>
        <button onclick="MemoNest.navigate('schedule')" style="font-size:11px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:3px 8px;border-radius:20px">전체</button>
      </div>
      <div id="home-week-schedule"><div style="font-size:12px;color:#94a3b8;text-align:center;padding:4px 0">로딩 중...</div></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="margin-bottom:10px">
        <div class="card-title" style="font-size:14px">📅 오늘의 일정</div>
        <button onclick="MemoNest.navigate('schedule')" style="font-size:11px;color:#6366f1;background:rgba(99,102,241,0.08);border:none;cursor:pointer;padding:3px 8px;border-radius:20px">전체</button>
      </div>
      <div id="home-schedule-preview"><div style="font-size:12px;color:#94a3b8;text-align:center;padding:4px 0">로딩 중...</div></div>
    </div>
    <!-- 모바일은 사이드바가 없으므로 모듈 바로가기 그리드 유지 -->
    <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">바로가기</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
      ${modules.map(m => `
        <div class="module-card" onclick="${m.id === 'settings' ? 'MemoNest.showSettings()' : `MemoNest.navigate('${m.id}')`}">
          <span class="icon">${m.icon}</span>
          <div class="name">${m.name}</div>
          <div class="count">${m.desc}</div>
        </div>`).join('')}
    </div>
    <div style="padding:12px 14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="font-size:11px;color:#94a3b8">
        <strong style="color:#6366f1">v${this.VERSION}</strong> · ${latestChange.date} · ${latestChange.changes[0]}
      </div>
      <button onclick="MemoNest.showChangelog()" style="font-size:11px;color:#6366f1;background:none;border:none;cursor:pointer;padding:0;white-space:nowrap">로그 전체 ▶</button>
    </div>`;
  },

  renderVersionBanner() {
    const latest = this.CHANGELOG[0];
    const secureIcon = this.state.currentUser ? '🔒' : '🌐';
    const secureText = this.state.currentUser ? `Genspark 인증 활성 · ${this.state.currentUser.email || ''}` : '로컬 개발 환경';
    return `
    <div style="margin-top:10px;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:12px;font-weight:700;color:#1e293b">📋 개발 로그 <span style="font-weight:400;color:#6366f1">v${this.VERSION}</span></div>
        <button onclick="MemoNest.showChangelog()" style="font-size:12px;color:#6366f1;background:rgba(99,102,241,0.1);border:none;cursor:pointer;padding:4px 12px;border-radius:20px">전체 보기</button>
      </div>
      <div style="display:grid;gap:4px">
        ${this.CHANGELOG.slice(0,3).map(entry => `
          <div style="display:flex;gap:8px;font-size:12px;color:#475569;align-items:flex-start">
            <span style="color:var(--primary);font-weight:600;white-space:nowrap">v${entry.ver}</span>
            <span style="color:#94a3b8;white-space:nowrap">${entry.date}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${entry.changes[0]}</span>
          </div>`).join('')}
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8">
        <span>${secureIcon}</span>
        <span>${secureText}</span>
        <span style="margin-left:auto">Hono · Netlify · Notion API</span>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TODO
  // ══════════════════════════════════════════════════════════════════════════
  renderTodo() {
    return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div id="todo-filter" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:2px">
        <button class="diary-tab active" onclick="MemoNest.filterTodos('all', this)">전체</button>
        <button class="diary-tab" onclick="MemoNest.filterTodos('미완료', this)">미완료</button>
        <button class="diary-tab" onclick="MemoNest.filterTodos('진행중', this)">진행중</button>
        <button class="diary-tab" onclick="MemoNest.filterTodos('완료', this)">완료</button>
        <button class="diary-tab" onclick="MemoNest.filterTodos('tag', this)">🏷️ 태그별</button>
      </div>
    </div>
    <div id="todo-tag-filter" style="display:none;margin-bottom:12px"></div>
    <div id="todo-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  async loadTodos() {
    const dbId = this.state.dbIds.todo;
    const el = document.getElementById('todo-list');
    if (!dbId) {
      if (el) el.innerHTML = `<div style="text-align:center;padding:30px;color:#6b7280">
        <p style="font-size:32px">⚙️</p>
        <p style="font-weight:600;margin-bottom:8px">노션 설정이 필요해요</p>
        <p style="font-size:13px;margin-bottom:16px">홈 → 설정에서 노션 페이지 ID를 연결하거나<br>복원 버튼을 눌러주세요</p>
        <button class="btn btn-primary" onclick="MemoNest.navigate('home')">🏠 홈으로</button>
      </div>`;
      return;
    }
    try {
      const res = await fetch(`/api/todos?dbId=${dbId}`);
      const data = await res.json();
      // Notion API 에러 응답 감지 (object_not_found 등)
      if (data.object === 'error') {
        if (el) el.innerHTML = `<div style="text-align:center;padding:30px;color:#6b7280">
          <p style="font-size:32px">🔗</p>
          <p style="font-weight:600;margin-bottom:8px">노션 DB를 찾을 수 없어요</p>
          <p style="font-size:12px;color:#9ca3af;margin-bottom:16px">${data.message || 'DB ID가 유효하지 않습니다'}</p>
          <button class="btn btn-secondary" onclick="MemoNest.recoverFromApp()">🔄 DB 복원 시도</button>
        </div>`;
        return;
      }
      this.state.todos = data.results || [];
      this.renderTodoList(this.state.todos);
    } catch (e) {
      if (el) el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패: 네트워크를 확인해주세요</p>';
    }
  },

  renderTodoList(todos) {
    const el = document.getElementById('todo-list');
    if (!el) return;
    if (!todos.length) {
      el.innerHTML = `<div class="empty-state"><span class="emoji">📋</span><p>할 일이 없어요!<br>+ 버튼으로 추가해보세요</p></div>`; return;
    }
    // localStorage 순서 적용
    const orderKey = `todoOrder_${this.state.dbIds.todo}`;
    const savedOrder = this.load(orderKey, []);
    if (savedOrder.length) {
      const orderMap = {};
      savedOrder.forEach((id, i) => orderMap[id] = i);
      todos = [...todos].sort((a, b) => {
        const ia = orderMap[a.id] ?? 9999;
        const ib = orderMap[b.id] ?? 9999;
        return ia - ib;
      });
    }
    // ToDo 캐시 (onclick 인라인 특수문자 버그 방지: data-tid + this.dataset.tid 패턴)
    this._todoCache = {};
    el.innerHTML = todos.map(todo => {
      const props = todo.properties;
      const title = props['할 일']?.title?.[0]?.text?.content || '제목 없음';
      const status = props['상태']?.select?.name || '미완료';
      const priority = props['우선순위']?.select?.name || '';
      const dueDate = props['Due Date']?.date?.start;
      const tags = props['태그']?.multi_select || [];
      const memo = props['메모']?.rich_text?.[0]?.text?.content || '';
      const repeat = props['반복']?.select?.name || '';
      this._todoCache[todo.id] = { title, dueDate: dueDate || '', memo };
      const isDone = status === '완료';
      const isOverdue = dueDate && new Date(dueDate) < new Date() && !isDone;
      const priorityClass = priority.includes('높음') ? 'priority-high' : priority.includes('낮음') ? 'priority-low' : 'priority-mid';

      return `
      <div class="todo-item ${isDone ? 'done' : ''}" style="position:relative" 
           draggable="true" data-id="${todo.id}"
           ondragstart="MemoNest.onDragStart(event)"
           ondragover="MemoNest.onDragOver(event)"
           ondrop="MemoNest.onDrop(event)"
           ondragend="MemoNest.onDragEnd(event)">
        <div style="cursor:grab;padding:0 6px 0 0;color:#cbd5e1;font-size:14px;flex-shrink:0">⠿</div>
        <div class="todo-checkbox ${isDone ? 'checked' : ''}"
          onclick="MemoNest.toggleTodo('${todo.id}', '${isDone ? '미완료' : '완료'}')">
          ${isDone ? '<i class="fas fa-check" style="font-size:12px"></i>' : ''}
        </div>
        <div class="todo-content" style="flex:1;min-width:0">
          <div class="todo-title">${title}${repeat && repeat !== '없음' ? ` <span style="font-size:10px;color:#6366f1;background:rgba(99,102,241,0.1);padding:1px 5px;border-radius:8px">🔁${repeat}</span>` : ''}</div>
          <div class="todo-meta">
            ${priority ? `<span class="priority-badge ${priorityClass}">${priority}</span>` : ''}
            ${dueDate ? `<span class="todo-due ${isOverdue ? 'overdue' : ''}">
              <i class="fas fa-calendar"></i> ${dueDate}${isOverdue ? ' ⚠️' : ''}
            </span>` : ''}
            <span class="status-badge ${status === '완료' ? 'status-done' : status === '진행중' ? 'status-doing' : status === '보류' ? 'status-hold' : 'status-todo'}">${status}</span>
            ${tags.map(t => `<span class="tag" style="font-size:10px;padding:2px 7px">#${t.name}</span>`).join('')}
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;margin-left:6px">
          <button onclick="MemoNest.showEditTodo('${todo.id}','${title.replace(/'/g,"&apos;")}','${status}','${priority}','${dueDate||''}','${memo.replace(/'/g,"&apos;")}')" 
            style="background:none;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#64748b" title="수정">
            <i class="fas fa-pen"></i>
          </button>
          <button data-tid="${todo.id}" onclick="MemoNest.scheduleFromTodo(this.dataset.tid)"
            style="background:none;border:1px solid #e0e7ff;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#6366f1" title="일정으로 잡기">
            <i class="fas fa-calendar-plus"></i>
          </button>
          <button onclick="MemoNest.deleteTodo('${todo.id}')" 
            style="background:none;border:1px solid #fee2e2;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#ef4444" title="삭제">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
    }).join('');
  },

  // ── ToDo → 일정으로 잡기 ───────────────────────────────────────────────────
  // ToDo를 일정으로 변환: 일정 추가 모달을 열고 제목/날짜를 미리 채운다.
  scheduleFromTodo(tid) {
    const t = this._todoCache?.[tid];
    if (!t) { this.toast('할 일 정보를 찾을 수 없어요. 새로고침 후 시도해주세요.', 'error'); return; }
    // 일정 추가 모달 오픈 (기존 시간 컨트롤·타임존 로직 재사용)
    this.showAddSchedule();
    // 모달 렌더 후 필드 프리필
    setTimeout(() => {
      const titleEl = document.getElementById('sch-title');
      if (titleEl) titleEl.value = t.title || '';
      // Due Date 가 있으면 시작 날짜를 그 날짜로 (시간은 기본값 유지)
      if (t.dueDate) {
        const dateOnly = t.dueDate.slice(0, 10); // YYYY-MM-DD
        const startDateEl = document.getElementById('sch-start-date');
        const endDateEl = document.getElementById('sch-end-date');
        if (startDateEl) startDateEl.value = dateOnly;
        if (endDateEl) endDateEl.value = dateOnly;
        // 시작/종료/소요 연동 재계산 트리거
        startDateEl?.dispatchEvent(new Event('change'));
      }
      // 메모에 원본 할 일 표시
      const memoEl = document.getElementById('sch-memo');
      if (memoEl && !memoEl.value) memoEl.value = `📋 ToDo에서 생성${t.memo ? '\n' + t.memo : ''}`;
      this.toast('할 일을 일정으로 옮겼어요. 시간을 확인하고 저장하세요.', 'info', 3500);
    }, 60);
  },

  // ── Drag & Drop 핸들러 ─────────────────────────────────────────────────────
  _dragSrcId: null,

  onDragStart(e) {
    this._dragSrcId = e.currentTarget.dataset.id;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  },

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.borderTop = '2px solid #6366f1';
  },

  onDrop(e) {
    e.preventDefault();
    const targetId = e.currentTarget.dataset.id;
    e.currentTarget.style.borderTop = '';
    if (!this._dragSrcId || this._dragSrcId === targetId) return;

    // 현재 렌더된 순서에서 ID 목록 추출
    const items = [...document.querySelectorAll('#todo-list [data-id]')];
    const ids = items.map(el => el.dataset.id);
    const srcIdx = ids.indexOf(this._dragSrcId);
    const tgtIdx = ids.indexOf(targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    ids.splice(srcIdx, 1);
    ids.splice(tgtIdx, 0, this._dragSrcId);

    // 순서 저장
    const orderKey = `todoOrder_${this.state.dbIds.todo}`;
    this.save(orderKey, ids);

    // 재렌더 (상태 todos를 그대로 사용, 정렬만 바꿈)
    this.renderTodoList(this.state.todos);
  },

  onDragEnd(e) {
    e.currentTarget.style.opacity = '';
    e.currentTarget.style.borderTop = '';
    this._dragSrcId = null;
  },

  filterTodos(filter, btn) {
    document.querySelectorAll('#todo-filter .diary-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tagFilterEl = document.getElementById('todo-tag-filter');

    if (filter === 'tag') {
      // 태그 목록 수집
      const tagMap = {};
      this.state.todos.forEach(t => {
        const tags = t.properties['태그']?.multi_select || [];
        tags.forEach(tag => {
          if (!tagMap[tag.name]) tagMap[tag.name] = [];
          tagMap[tag.name].push(t);
        });
      });
      const tagNames = Object.keys(tagMap);
      if (!tagNames.length) {
        if (tagFilterEl) tagFilterEl.style.display = 'none';
        this.renderTodoList(this.state.todos);
        this.toast('등록된 태그가 없어요', 'info');
        return;
      }
      if (tagFilterEl) {
        tagFilterEl.style.display = 'flex';
        tagFilterEl.style.flexWrap = 'wrap';
        tagFilterEl.style.gap = '6px';
        tagFilterEl.innerHTML = tagNames.map(name =>
          `<button class="tag" style="cursor:pointer;padding:5px 12px;font-size:12px"
            onclick="MemoNest.filterByTag('${name}')">#${name} (${tagMap[name].length})</button>`
        ).join('');
      }
      // 태그별 그룹 렌더링
      this.renderTodoByTag(tagMap);
    } else {
      if (tagFilterEl) tagFilterEl.style.display = 'none';
      const filtered = filter === 'all' ? this.state.todos
        : this.state.todos.filter(t => t.properties['상태']?.select?.name === filter);
      this.renderTodoList(filtered);
    }
  },

  filterByTag(tagName) {
    const filtered = this.state.todos.filter(t =>
      (t.properties['태그']?.multi_select || []).some(tag => tag.name === tagName)
    );
    this.renderTodoList(filtered);
  },

  renderTodoByTag(tagMap) {
    const el = document.getElementById('todo-list');
    if (!el) return;
    const html = Object.entries(tagMap).map(([tagName, todos]) => `
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <span style="background:rgba(99,102,241,0.1);padding:3px 10px;border-radius:20px">#${tagName}</span>
          <span style="color:var(--text-muted);font-weight:400">${todos.length}개</span>
        </div>
        ${todos.map(todo => {
          const props = todo.properties;
          const title = props['할 일']?.title?.[0]?.text?.content || '제목 없음';
          const status = props['상태']?.select?.name || '미완료';
          const priority = props['우선순위']?.select?.name || '';
          const dueDate = props['Due Date']?.date?.start || '';
          const memo = props['메모']?.rich_text?.[0]?.text?.content || '';
          const isDone = status === '완료';
          return `<div class="todo-item ${isDone ? 'done' : ''}" style="position:relative">
            <div class="todo-checkbox ${isDone ? 'checked' : ''}" onclick="MemoNest.toggleTodo('${todo.id}', '${isDone ? '미완료' : '완료'}')">
              ${isDone ? '<i class="fas fa-check" style="font-size:12px"></i>' : ''}
            </div>
            <div class="todo-content" style="flex:1;min-width:0"><div class="todo-title">${title}</div>
              <span class="status-badge ${isDone ? 'status-done' : 'status-todo'}">${status}</span>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0;margin-left:6px">
              <button onclick="MemoNest.showEditTodo('${todo.id}','${title.replace(/'/g,"&apos;")}','${status}','${priority}','${dueDate}','${memo.replace(/'/g,"&apos;")}')" 
                style="background:none;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#64748b" title="수정">
                <i class="fas fa-pen"></i>
              </button>
              <button onclick="MemoNest.deleteTodo('${todo.id}')" 
                style="background:none;border:1px solid #fee2e2;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#ef4444" title="삭제">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');
    el.innerHTML = html || '<div class="empty-state"><span class="emoji">🏷️</span><p>태그가 없어요</p></div>';
  },

  async toggleTodo(pageId, newStatus) {
    try {
      await fetch(`/api/todos/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // 반복 태스크: 완료 처리 시 다음 Due Date로 새 항목 자동 생성
      if (newStatus === '완료') {
        const todo = this.state.todos.find(t => t.id === pageId);
        if (todo) {
          const repeat = todo.properties['반복']?.select?.name;
          const dueDate = todo.properties['Due Date']?.date?.start;
          if (repeat && repeat !== '없음' && dueDate) {
            const nextDate = this.calcNextRepeatDate(dueDate, repeat);
            if (nextDate) {
              await fetch('/api/todos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dbId: this.state.dbIds.todo,
                  title: todo.properties['할 일']?.title?.[0]?.text?.content || '',
                  dueDate: nextDate,
                  priority: todo.properties['우선순위']?.select?.name || '중간 🟡',
                  repeat,
                  memo: todo.properties['메모']?.rich_text?.[0]?.text?.content || '',
                  tags: (todo.properties['태그']?.multi_select || []).map(t => t.name),
                })
              });
              this.toast(`🔁 반복 태스크 자동 생성 (${nextDate})`, 'info', 4000);
            }
          }
        }
      }
      this.toast(newStatus === '완료' ? '✅ 완료!' : '↩️ 미완료로 변경', 'success');
      this.loadTodos();
    } catch (e) { this.toast('업데이트 실패', 'error'); }
  },

  calcNextRepeatDate(dateStr, repeat) {
    try {
      const d = new Date(dateStr);
      if (repeat === '매일') d.setDate(d.getDate() + 1);
      else if (repeat === '매주') d.setDate(d.getDate() + 7);
      else if (repeat === '매월') d.setMonth(d.getMonth() + 1);
      else return null;
      return d.toISOString().split('T')[0];
    } catch(e) { return null; }
  },

  async deleteTodo(pageId) {
    this.showModal('🗑️ 할 일 삭제', '이 항목을 삭제할까요? (노션에서 아카이브됩니다)', async () => {
      try {
        await fetch(`/api/todos/${pageId}`, { method: 'DELETE' });
        document.getElementById('app-modal')?.remove();
        this.toast('🗑️ 삭제됐어요', 'success');
        this.loadTodos();
      } catch (e) { this.toast('삭제 실패', 'error'); }
    });
  },

  showEditTodo(pageId, title, status, priority, dueDate, memo) {
    this.showModal('✏️ 할 일 수정', `
      <div class="form-group">
        <label class="form-label">할 일</label>
        <input class="form-input" id="edit-todo-title" value="${title}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-select" id="edit-todo-status">
            ${['미완료','진행중','완료','보류'].map(s => `<option value="${s}" ${status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">우선순위</label>
          <select class="form-select" id="edit-todo-priority">
            ${['높음 🔴','중간 🟡','낮음 🟢'].map(p => `<option value="${p}" ${priority===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input class="form-input" type="date" id="edit-todo-due" value="${dueDate}">
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="edit-todo-memo" style="min-height:60px">${memo}</textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveEditTodo('${pageId}')">
        <i class="fas fa-save"></i> 수정 저장
      </button>`, null);
  },

  async saveEditTodo(pageId) {
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...'; btn.disabled = true; }
    try {
      await fetch(`/api/todos/${pageId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('edit-todo-title')?.value,
          status: document.getElementById('edit-todo-status')?.value,
          priority: document.getElementById('edit-todo-priority')?.value,
          dueDate: document.getElementById('edit-todo-due')?.value || null,
          memo: document.getElementById('edit-todo-memo')?.value,
        })
      });
      document.getElementById('app-modal')?.remove();
      this.toast('✅ 수정됐어요!', 'success');
      this.loadTodos();
    } catch (e) { this.toast('수정 실패', 'error'); }
  },

  showAddTodo() {
    this.showModal('📋 할 일 추가', `
      <div class="form-group">
        <label class="form-label">할 일 *</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="todo-title" placeholder="할 일을 입력하세요" style="flex:1">
          <button class="btn btn-secondary btn-icon" onclick="MemoNest.startVoiceInput('todo-title')" title="음성 입력">
            <i class="fas fa-microphone"></i>
          </button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group">
          <label class="form-label">우선순위</label>
          <select class="form-select" id="todo-priority">
            <option value="높음 🔴">높음 🔴</option>
            <option value="중간 🟡" selected>중간 🟡</option>
            <option value="낮음 🟢">낮음 🟢</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">반복</label>
          <select class="form-select" id="todo-repeat">
            <option value="없음">없음</option>
            <option value="매일">매일</option>
            <option value="매주">매주</option>
            <option value="매월">매월</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input class="form-input" type="date" id="todo-due" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">태그 (Enter로 추가)</label>
        <div class="tag-input-container" id="todo-tags-container" onclick="this.querySelector('input').focus()">
          <input placeholder="태그 입력 후 Enter" onkeydown="MemoNest.addTag(event, 'todo-tags')">
        </div>
        <input type="hidden" id="todo-tags" value="[]">
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="todo-memo" placeholder="추가 메모" style="min-height:60px"></textarea>
      </div>
      <button class="btn btn-secondary btn-block" style="margin-bottom:8px" onclick="MemoNest.aiAnalyzeTodo()">
        <i class="fas fa-magic"></i> AI 우선순위·마감일 추천
      </button>
      <div id="todo-ai-result" style="display:none;margin-bottom:10px"></div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveTodo()">
        <i class="fas fa-save"></i> 저장하기
      </button>`);
  },

  async aiAnalyzeTodo() {
    const titleEl = document.getElementById('todo-title');
    const text = titleEl?.value?.trim();
    if (!text) { this.toast('할 일을 먼저 입력해주세요', 'error'); return; }
    const aiBtn = document.querySelector('#app-modal .btn-secondary');
    if (aiBtn) { aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 분석 중...'; aiBtn.disabled = true; }
    try {
      const res = await fetch('/api/ai/structure', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'todo', text })
      });
      const data = await res.json();
      if (data.priority) {
        const prioEl = document.getElementById('todo-priority');
        if (prioEl) prioEl.value = data.priority;
      }
      if (data.suggested_due) {
        const dueEl = document.getElementById('todo-due');
        if (dueEl) dueEl.value = data.suggested_due;
      }
      if (data.memo) {
        const memoEl = document.getElementById('todo-memo');
        if (memoEl && !memoEl.value) memoEl.value = data.memo;
      }
      const resultEl = document.getElementById('todo-ai-result');
      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `<div class="ai-card"><div class="ai-label">🤖 AI 추천</div><div class="ai-content">
          우선순위: <strong>${data.priority || '-'}</strong> · 마감일: <strong>${data.suggested_due || '-'}</strong>
          ${data.memo ? `<br><span style="font-size:11px;color:#64748b">${data.memo}</span>` : ''}
        </div></div>`;
      }
      this.toast('✨ AI 추천이 적용됐어요!', 'success');
    } catch(e) { this.toast('AI 분석 실패', 'error'); }
    finally {
      if (aiBtn) { aiBtn.innerHTML = '<i class="fas fa-magic"></i> AI 우선순위·마감일 추천'; aiBtn.disabled = false; }
    }
  },

  async saveTodo() {
    const title = document.getElementById('todo-title')?.value?.trim();
    if (!title) { this.toast('할 일을 입력해주세요', 'error'); return; }
    const btn = document.querySelector('#app-modal .btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
    btn.disabled = true;
    try {
      const tags = JSON.parse(document.getElementById('todo-tags')?.value || '[]');
      await fetch('/api/todos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.todo,
          title,
          dueDate: document.getElementById('todo-due')?.value,
          priority: document.getElementById('todo-priority')?.value,
          repeat: document.getElementById('todo-repeat')?.value,
          tags, memo: document.getElementById('todo-memo')?.value,
        })
      });
      document.getElementById('app-modal')?.remove();
      this.toast('✅ 노션에 저장됐어요!', 'success');
      this.loadTodos();
    } catch (e) { this.toast('저장 실패', 'error'); }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEETING NOTES
  // ══════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════
  // MEETING — 리스트뷰 메인 + 팝업 작성
  // ══════════════════════════════════════════════════════════════════════════

  // 회의록과 연동된 일정 ID 캐시 (loadMeetings 시 채움)
  _meetingScheduleIds: new Set(),

  renderMeeting() {
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:700;color:var(--text)">🎙️ 회의록</div>
      <button class="btn btn-primary" onclick="MemoNest.showAddMeetingModal()" style="padding:8px 16px;font-size:13px">
        <i class="fas fa-plus"></i> 새 회의록
      </button>
    </div>

    <!-- 일정에서 연동 가능한 회의 섹션 -->
    <div id="meeting-schedule-link-section"></div>

    <!-- 회의록 리스트 -->
    <div id="meeting-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  // ── 회의록 추가 팝업 ────────────────────────────────────────────────────
  showAddMeetingModal(scheduleId = null, scheduleTitle = '') {
    // 일정 연동 시: 해당 일정의 날짜를 회의록 기본 날짜로 사용 (없으면 오늘)
    const linkedSched = scheduleId ? this._scheduleCache?.[scheduleId] : null;
    const defaultDate = (linkedSched?.datetime)
      ? new Date(linkedSched.datetime).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const linkedLabel = scheduleId
      ? `<div style="padding:8px 12px;background:rgba(99,102,241,0.08);border-radius:8px;font-size:12px;color:#6366f1;margin-bottom:14px">
           <i class="fas fa-link"></i> 일정 연동: <strong>${scheduleTitle}</strong>
           <input type="hidden" id="meeting-linked-sid" value="${scheduleId}">
         </div>`
      : '<input type="hidden" id="meeting-linked-sid" value="">';

    this.showModal('🎙️ 새 회의록 작성', `
      ${linkedLabel}
      <div class="form-group">
        <label class="form-label">고객사 / 프로젝트명</label>
        <input class="form-input" id="meeting-client" placeholder="예: 삼성전자, Project Alpha"
          value="${scheduleTitle ? scheduleTitle : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="meeting-date" value="${defaultDate}">
      </div>

      <div class="form-group">
        <label class="form-label">🎙️ 음성 녹음</label>
        <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;border:1.5px dashed #e2e8f0">
          <div class="waveform" id="waveform" style="display:none;justify-content:center;margin-bottom:10px">
            ${Array(7).fill('<div class="wave-bar"></div>').join('')}
          </div>
          <div class="record-timer" id="record-timer" style="display:none">0:00</div>
          <button class="record-btn" id="record-btn" onclick="MemoNest.toggleRecording('meeting')" style="margin:0 auto">
            <i class="fas fa-microphone" id="record-icon"></i>
          </button>
          <p style="font-size:12px;color:#94a3b8;margin-top:8px" id="record-hint">버튼을 눌러 녹음 시작</p>
        </div>
        <div id="stt-result" style="display:none;margin-top:10px">
          <div class="ai-card">
            <div class="ai-label">🤖 STT 변환 결과</div>
            <div class="ai-content" id="stt-text"></div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">✍️ 수기 메모 (선택)</label>
        <textarea class="form-textarea" id="meeting-notes" rows="4"
          placeholder="회의 중 메모한 내용을 입력하세요&#10;음성 녹취와 합쳐서 AI가 회의록을 정리합니다"></textarea>
      </div>

      <div id="meeting-save-result" style="display:none"></div>

      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary" style="flex:1" onclick="document.getElementById('app-modal').remove()">취소</button>
        <button class="btn btn-primary" style="flex:1" id="meeting-save-btn" onclick="MemoNest.saveMeeting()">
          <i class="fas fa-magic"></i> AI 회의록 생성 & 저장
        </button>
      </div>
    `);

    // 모달의 기본 confirm 버튼 제거 (직접 버튼 삽입했으므로)
    const defaultBtns = document.querySelector('#app-modal .modal-body + div');
    if (defaultBtns) defaultBtns.remove();
  },

  async saveMeeting() {
    const client = document.getElementById('meeting-client')?.value?.trim();
    const date = document.getElementById('meeting-date')?.value;
    const transcript = document.getElementById('stt-text')?.textContent || '';
    const manualNotes = document.getElementById('meeting-notes')?.value || '';
    const scheduleId = document.getElementById('meeting-linked-sid')?.value || '';

    // 최소 하나 이상 입력돼야 함 — 단, 일정연동이면 제목만 있어도 OK
    if (!transcript && !manualNotes && !scheduleId && !client) {
      this.toast('녹음하거나 메모를 입력해주세요', 'error'); return;
    }

    const btn = document.getElementById('meeting-save-btn');
    const resultEl = document.getElementById('meeting-save-result');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 처리 중...'; btn.disabled = true; }
    if (resultEl) { resultEl.style.display = 'none'; }

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.meeting,
          transcript: transcript || '',
          manualNotes: manualNotes || (client ? `${client} 회의` : '회의록'),
          date: date || new Date().toISOString().split('T')[0],
          client: client || '',
          scheduleId: scheduleId || ''
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `서버 오류 (${res.status})`);
      }

      const data = await res.json();
      this.toast('🎉 회의록이 노션에 저장됐어요!', 'success');

      // scheduleId가 있으면 연동 완료 세트 업데이트
      if (scheduleId) {
        if (!this._meetingScheduleIds) this._meetingScheduleIds = new Set();
        this._meetingScheduleIds.add(scheduleId);
      }

      if (resultEl && data.structured) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
          <div style="padding:12px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:8px">
            <div style="font-size:12px;font-weight:700;color:#16a34a;margin-bottom:6px">✅ 저장 완료!</div>
            ${data.structured.summary ? `<div style="font-size:12px;color:#374151">${data.structured.summary}</div>` : ''}
          </div>`;
      }

      if (btn) {
        btn.innerHTML = '<i class="fas fa-check"></i> 저장 완료';
        btn.style.background = '#16a34a';
        btn.disabled = false;
      }

      // 모달 닫기 & 현재 화면 리프레시
      setTimeout(() => {
        document.getElementById('app-modal')?.remove();
        // 회의록 탭이면 회의록 리스트 새로고침,
        // 일정 탭이면 일정 리스트를 다시 로드해서 회의 카드에 "회의록 완료" 상태 반영
        // (일정 탭에는 meeting-schedule-link-section DOM이 없으므로 loadSchedules로 재렌더)
        if (this.state.currentModule === 'meeting') {
          this.loadMeetings();
        } else if (this.state.currentModule === 'schedule') {
          this.loadSchedules();
        }
      }, 1500);

    } catch (e) {
      this.toast('저장 실패: ' + e.message, 'error');
      if (btn) { btn.innerHTML = '<i class="fas fa-magic"></i> AI 회의록 생성 & 저장'; btn.disabled = false; }
      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `<div style="padding:10px;background:#fef2f2;border-radius:8px;font-size:12px;color:#dc2626">
          ❌ 오류: ${e.message}</div>`;
      }
    }
  },

  async loadMeetings() {
    const el = document.getElementById('meeting-list');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // 일정에서 회의 카테고리 일정 목록 로드 (연동 섹션)
    await this._loadMeetingScheduleLinks();

    try {
      const res = await fetch(`/api/meetings?dbId=${this.state.dbIds.meeting}`);
      const data = await res.json();
      if (data.object === 'error') {
        el.innerHTML = `<div style="text-align:center;padding:30px;color:#6b7280">
          <p style="font-size:32px">🔗</p>
          <p style="font-weight:600;margin-bottom:8px">노션 DB를 찾을 수 없어요</p>
          <p style="font-size:12px;color:#9ca3af;margin-bottom:16px">${data.message || 'DB ID가 유효하지 않습니다'}</p>
          <button class="btn btn-secondary" onclick="MemoNest.recoverFromApp()">🔄 DB 복원 시도</button>
        </div>`; return;
      }

      const results = data.results || [];

      // 회의록에 연동된 scheduleId 목록 추출 → _meetingScheduleIds 업데이트
      this._meetingScheduleIds = new Set(
        results.map(m => m.properties?.['일정 ID']?.rich_text?.[0]?.text?.content || '').filter(Boolean)
      );

      // 회의록 캐시 저장 (수정 시 사용)
      this._meetingCache = {};
      results.forEach(m => {
        const props = m.properties;
        this._meetingCache[m.id] = {
          title:   props['회의 제목']?.title?.[0]?.text?.content || '',
          date:    props['날짜']?.date?.start || '',
          client:  props['고객사/프로젝트']?.rich_text?.[0]?.text?.content || '',
          summary: props['요약']?.rich_text?.[0]?.text?.content || '',
          actions: props['액션 아이템']?.rich_text?.[0]?.text?.content || '',
          tags:    props['태그']?.multi_select?.map(t => t.name) || [],
          sid:     props['일정 ID']?.rich_text?.[0]?.text?.content || '',
        };
      });
      // 연동 섹션 다시 렌더 (연동 완료 상태 반영)
      await this._renderMeetingScheduleLinks();

      if (!results.length) {
        el.innerHTML = '<div class="empty-state"><span class="emoji">🎙️</span><p>아직 회의록이 없어요<br>위 버튼으로 작성해보세요</p></div>';
        return;
      }

      el.innerHTML = `
        <div class="section-title" style="margin-bottom:10px">📋 저장된 회의록 (${results.length}건)</div>
        ${results.map(m => {
          const props = m.properties;
          const title = props['회의 제목']?.title?.[0]?.text?.content || '제목 없음';
          const date = props['날짜']?.date?.start || '';
          const client = props['고객사/프로젝트']?.rich_text?.[0]?.text?.content || '';
          const summary = props['요약']?.rich_text?.[0]?.text?.content || '';
          const tags = props['태그']?.multi_select?.map(t => t.name) || [];
          const linkedSid = props['일정 ID']?.rich_text?.[0]?.text?.content || '';
          const notionUrl = `https://notion.so/${m.id.replace(/-/g,'')}`;

          const dateDisplay = date ? new Date(date).toLocaleDateString('ko-KR', {
            year:'numeric', month:'long', day:'numeric', weekday:'short'
          }) : '';

          return `
          <div class="card" style="margin-bottom:10px;cursor:default">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1;min-width:0">
                <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">🎙️ ${title}</div>
                <div style="font-size:12px;color:#64748b;margin-bottom:6px">
                  ${dateDisplay ? `<span><i class="fas fa-calendar-alt" style="margin-right:3px;color:var(--primary)"></i>${dateDisplay}</span>` : ''}
                  ${client ? `<span style="margin-left:8px"><i class="fas fa-building" style="margin-right:3px;color:#6366f1"></i>${client}</span>` : ''}
                  ${linkedSid ? `<span style="margin-left:8px;font-size:11px;background:rgba(99,102,241,0.1);color:#6366f1;padding:1px 7px;border-radius:10px"><i class="fas fa-link" style="margin-right:2px"></i>일정연동</span>` : ''}
                </div>
                ${summary ? `<div style="font-size:12px;color:#475569;line-height:1.5;margin-bottom:6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${summary}</div>` : ''}
                ${tags.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${tags.map(t=>`<span class="tag" style="font-size:11px">${t}</span>`).join('')}</div>` : ''}
              </div>
              <div style="display:flex;gap:4px;flex-shrink:0;margin-left:8px">
                <button data-mid="${m.id}" onclick="MemoNest.showEditMeetingModal(this.dataset.mid)"
                  style="background:none;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#64748b;display:flex;align-items:center;gap:3px"
                  title="수정"><i class="fas fa-pen"></i></button>
                <a href="${notionUrl}" target="_blank"
                  style="background:none;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#6366f1;text-decoration:none;display:flex;align-items:center;gap:3px"
                  title="노션에서 보기"><i class="fas fa-external-link-alt"></i></a>
              </div>
            </div>
          </div>`;
        }).join('')}`;
    } catch (e) {
      el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패: ' + e.message + '</p>';
    }
  },

  // 회의록 수정 모달
  showEditMeetingModal(mid) {
    const d = this._meetingCache?.[mid];
    if (!d) { this.toast('회의록 데이터를 찾을 수 없어요. 새로고침 후 시도해주세요.', 'error'); return; }

    this.showModal('✏️ 회의록 수정', `
      <div class="form-group">
        <label class="form-label">회의 제목 *</label>
        <input class="form-input" id="edit-mtg-title" value="${d.title}">
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="edit-mtg-date" value="${d.date}">
      </div>
      <div class="form-group">
        <label class="form-label">고객사 / 프로젝트명</label>
        <input class="form-input" id="edit-mtg-client" value="${d.client}">
      </div>
      <div class="form-group">
        <label class="form-label">요약</label>
        <textarea class="form-textarea" id="edit-mtg-summary" rows="3" style="min-height:60px">${d.summary}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">액션 아이템 (줄바꿈으로 구분)</label>
        <textarea class="form-textarea" id="edit-mtg-actions" rows="3" style="min-height:60px">${d.actions}</textarea>
      </div>
    `, () => this._doEditMeeting(mid));
  },

  async _doEditMeeting(mid) {
    const title = document.getElementById('edit-mtg-title')?.value?.trim();
    if (!title) { this.toast('제목을 입력해주세요', 'error'); return; }

    const btn = document.getElementById('modal-confirm-btn');
    if (btn) { btn.textContent = '저장 중...'; btn.disabled = true; }

    try {
      const res = await fetch(`/api/meetings/${mid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          date: document.getElementById('edit-mtg-date')?.value,
          client: document.getElementById('edit-mtg-client')?.value || '',
          summary: document.getElementById('edit-mtg-summary')?.value || '',
          actions: document.getElementById('edit-mtg-actions')?.value || '',
        })
      });

      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      this.toast('✅ 회의록이 수정됐어요!', 'success');
      document.getElementById('app-modal')?.remove();
      this.loadMeetings();
    } catch(e) {
      this.toast('수정 실패: ' + e.message, 'error');
      if (btn) { btn.textContent = '확인'; btn.disabled = false; }
    }
  },

  // 일정에서 회의 카테고리 목록 로드 → 회의록 등록 섹션 렌더
  async _loadMeetingScheduleLinks() {
    try {
      const res = await fetch(`/api/schedules?dbId=${this.state.dbIds.schedule}`);
      const data = await res.json();
      if (data.object === 'error' || !data.results) return;

      const meetings = data.results.filter(s => {
        const cat = s.properties?.['카테고리']?.select?.name || '';
        return cat === '회의';
      });

      // _scheduleCache 동기화 (회의 카테고리만)
      if (!this._scheduleCache) this._scheduleCache = {};
      meetings.forEach(s => {
        const props = s.properties;
        this._scheduleCache[s.id] = {
          title:    props['일정 제목']?.title?.[0]?.text?.content || '제목 없음',
          datetime: props['날짜/시간']?.date?.start || '',
          location: props['장소']?.rich_text?.[0]?.text?.content || '',
          category: props['카테고리']?.select?.name || '',
          reminder: props['알림']?.select?.name || '',
          memo:     props['메모']?.rich_text?.[0]?.text?.content || '',
        };
      });

      this._meetingScheduleList = meetings;
    } catch(e) {
      this._meetingScheduleList = [];
    }
  },

  async _renderMeetingScheduleLinks() {
    const sec = document.getElementById('meeting-schedule-link-section');
    if (!sec) return;

    const meetings = this._meetingScheduleList || [];
    if (!meetings.length) { sec.innerHTML = ''; return; }

    const registeredIds = this._meetingScheduleIds || new Set();

    const unregistered = meetings.filter(s => !registeredIds.has(s.id));
    const registered   = meetings.filter(s => registeredIds.has(s.id));

    if (!unregistered.length && !registered.length) { sec.innerHTML = ''; return; }

    const renderCard = (s, isDone) => {
      const title = this._scheduleCache?.[s.id]?.title || '제목 없음';
      const datetimeRaw = this._scheduleCache?.[s.id]?.datetime || '';
      let dtDisplay = '';
      if (datetimeRaw) {
        try { dtDisplay = new Date(datetimeRaw).toLocaleDateString('ko-KR', {month:'short',day:'numeric',weekday:'short'}); } catch(e) {}
      }

      if (isDone) {
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
          background:rgba(100,116,139,0.05);border:1px solid #e2e8f0;border-radius:10px;margin-bottom:6px;opacity:0.6">
          <i class="fas fa-check-circle" style="color:#10b981;font-size:14px;flex-shrink:0"></i>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#374151">${title}</div>
            ${dtDisplay ? `<div style="font-size:11px;color:#9ca3af">${dtDisplay}</div>` : ''}
          </div>
          <span style="font-size:11px;background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:10px;font-weight:600;flex-shrink:0">회의록 완료</span>
        </div>`;
      } else {
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
          background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.25);border-radius:10px;margin-bottom:6px">
          <i class="fas fa-calendar-check" style="color:#6366f1;font-size:14px;flex-shrink:0"></i>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#374151">${title}</div>
            ${dtDisplay ? `<div style="font-size:11px;color:#9ca3af">${dtDisplay}</div>` : ''}
          </div>
          <button onclick="MemoNest.showAddMeetingModal('${s.id}', '${title.replace(/'/g, "&#39;")}')"
            style="flex-shrink:0;background:var(--primary);color:white;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:600">
            <i class="fas fa-plus"></i> 작성
          </button>
        </div>`;
      }
    };

    let html = `
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:#6366f1;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <i class="fas fa-calendar-alt"></i> 일정 연동 (회의 카테고리)
      </div>`;

    if (unregistered.length) {
      html += `<div style="font-size:11px;color:#94a3b8;margin-bottom:6px">📝 회의록 미작성</div>`;
      html += unregistered.map(s => renderCard(s, false)).join('');
    }
    if (registered.length) {
      html += `<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;margin-top:${unregistered.length?'10px':'0'}">✅ 회의록 작성 완료</div>`;
      html += registered.map(s => renderCard(s, true)).join('');
    }

    html += '</div><hr style="margin-bottom:14px;border:none;border-top:1px solid #f1f5f9">';
    sec.innerHTML = html;
  },

  async toggleRecording(type) {
    if (!this.state.recording) {
      await this.startRecording(type);
    } else {
      await this.stopRecording(type);
    }
  },

  async startRecording(type) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Firefox fallback: audio/webm;codecs=opus 미지원 환경 처리
      let recMime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(recMime)) {
        recMime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus' : '';
      }
      this.state._recMime = recMime || 'audio/webm';
      const mrOpts = recMime ? { mimeType: recMime } : {};
      this.state.mediaRecorder = new MediaRecorder(stream, mrOpts);
      this.state.audioChunks = [];
      this.state.mediaRecorder.ondataavailable = e => this.state.audioChunks.push(e.data);
      this.state.mediaRecorder.start(100);
      this.state.recording = true;

      // UI
      const btn = document.getElementById('record-btn');
      const icon = document.getElementById('record-icon');
      const timer = document.getElementById('record-timer');
      const hint = document.getElementById('record-hint');
      const wave = document.getElementById('waveform');
      if (btn) btn.classList.add('recording');
      if (icon) { icon.className = 'fas fa-stop'; }
      if (timer) timer.style.display = 'block';
      if (hint) hint.textContent = '녹음 중... 완료 후 다시 클릭';
      if (wave) wave.style.display = 'flex';

      this.state.recordingSeconds = 0;
      this.state.recordingTimer = setInterval(() => {
        this.state.recordingSeconds++;
        const m = Math.floor(this.state.recordingSeconds / 60);
        const s = this.state.recordingSeconds % 60;
        if (timer) timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      }, 1000);
    } catch (e) {
      this.toast('마이크 권한이 필요합니다', 'error');
    }
  },

  async stopRecording(type) {
    clearInterval(this.state.recordingTimer);
    this.state.recording = false;

    const btn = document.getElementById('record-btn');
    const icon = document.getElementById('record-icon');
    const hint = document.getElementById('record-hint');
    const wave = document.getElementById('waveform');
    if (btn) btn.classList.remove('recording');
    if (icon) icon.className = 'fas fa-microphone';
    if (hint) hint.textContent = 'STT 변환 중...';
    if (wave) wave.style.display = 'none';

    this.state.mediaRecorder.stop();
    this.state.mediaRecorder.stream.getTracks().forEach(t => t.stop());

    await new Promise(r => setTimeout(r, 500));
    const actualMime = this.state._recMime || 'audio/webm';
    const blob = new Blob(this.state.audioChunks, { type: actualMime });

    // Base64 변환
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch('/api/stt', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType: actualMime, language: this.state.sttSettings.language })
        });
        const data = await res.json().catch(() => ({}));
        if (data.text && data.text.trim()) {
          const sttResult = document.getElementById('stt-result');
          const sttText = document.getElementById('stt-text');
          if (sttResult) sttResult.style.display = 'block';
          if (sttText) sttText.textContent = data.text;
          if (hint) hint.textContent = 'STT 변환 완료! 다시 녹음하려면 클릭';
          this.toast('🎙️ STT 변환 완료!', 'success');
        } else {
          // 서버가 준 실제 원인 표시 (키 미설정 / 빈 녹음 / Groq 오류 등)
          const reason = data.error || '변환된 텍스트가 비어 있어요 (마이크 입력을 확인해주세요)';
          this.toast('STT 변환 실패: ' + reason, 'error', 5000);
          if (hint) hint.textContent = '버튼을 눌러 다시 녹음';
        }
      } catch (e) {
        this.toast('STT 변환 실패: ' + (e.message || '네트워크 오류'), 'error', 5000);
        if (hint) hint.textContent = '버튼을 눌러 녹음 시작';
      }
    };
    reader.readAsDataURL(blob);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DIARY
  // ══════════════════════════════════════════════════════════════════════════
  renderDiary() {
    return `
    <div class="diary-tabs" id="diary-type-tabs">
      <button class="diary-tab active" onclick="MemoNest.switchDiaryType('나의 일기', this)">📔 나의 일기</button>
      <button class="diary-tab" onclick="MemoNest.switchDiaryType('🐶 크림이 일기', this)">🐶 크림이</button>
      <button class="diary-tab" onclick="MemoNest.switchDiaryType('👶 대붕이 출산일기', this)">👶 대붕이</button>
    </div>
    <div id="diary-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  currentDiaryType: '나의 일기',

  switchDiaryType(type, btn) {
    this.currentDiaryType = type;
    document.querySelectorAll('#diary-type-tabs .diary-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.loadDiary(type);
  },

  async loadDiary(type = '나의 일기') {
    const el = document.getElementById('diary-list');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      const res = await fetch(`/api/diary?dbId=${this.state.dbIds.diary}&type=${encodeURIComponent(type)}`);
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) { el.innerHTML = `<div class="empty-state"><span class="emoji">${type === '🐶 크림이 일기' ? '🐶' : type === '👶 대붕이 출산일기' ? '👶' : '📔'}</span><p>아직 일기가 없어요<br>+ 버튼으로 작성해보세요</p></div>`; return; }
      el.innerHTML = results.map(d => {
        const props = d.properties;
        const title = props['제목']?.title?.[0]?.text?.content || '제목 없음';
        const date = props['날짜']?.date?.start || '';
        const mood = props['무드']?.select?.name || '';
        const summary = props['한줄 요약']?.rich_text?.[0]?.text?.content || '';
        return `
        <div class="diary-entry" onclick="window.open('https://notion.so/${d.id.replace(/-/g,'')}','_blank')" style="cursor:pointer">
          <div class="diary-date">${date}</div>
          <div class="diary-summary">${title}</div>
          ${summary ? `<div style="font-size:12px;color:#64748b;margin-bottom:6px">${summary}</div>` : ''}
          ${mood ? `<span style="font-size:18px">${mood.split(' ')[0]}</span>` : ''}
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
  },

  showAddDiary() {
    const type = this.currentDiaryType || '나의 일기';
    const isKrimi = type === '🐶 크림이 일기';
    const isDaebung = type === '👶 대붕이 출산일기';

    this.showModal(`${type} 작성`, `
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="diary-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      ${!isKrimi && !isDaebung ? `
      <div class="form-group">
        <label class="form-label">무드</label>
        <div class="mood-grid" id="mood-grid">
          ${[['😊','행복'],['😐','보통'],['😢','슬픔'],['😡','화남'],['😴','피곤']].map(([e,l]) => `
            <button class="mood-btn" onclick="MemoNest.selectMood('${e} ${l}', this)">
              ${e}<span class="mood-label">${l}</span>
            </button>`).join('')}
        </div>
        <input type="hidden" id="diary-mood" value="">
      </div>
      <div class="form-group">
        <label class="form-label">날씨</label>
        <select class="form-select" id="diary-weather">
          <option value="">선택</option>
          <option>☀️ 맑음</option><option>⛅ 흐림</option>
          <option>🌧️ 비</option><option>❄️ 눈</option>
        </select>
      </div>` : ''}
      ${isDaebung ? `
      <div class="form-group">
        <label class="form-label">임신 주수</label>
        <input class="form-input" id="diary-week" placeholder="예: 32주 3일">
      </div>` : ''}
      <div class="form-group">
        <label class="form-label">제목 / 한줄 요약</label>
        <input class="form-input" id="diary-title" placeholder="${isKrimi ? '크림이 오늘의 기록' : isDaebung ? '오늘의 출산 일기' : '오늘 하루 한줄로'}">
      </div>
      <div class="form-group">
        <label class="form-label">내용</label>
        <div style="display:flex;gap:8px;margin-bottom:6px">
          <button class="btn btn-secondary btn-sm" onclick="MemoNest.startVoiceInput('diary-content')">
            <i class="fas fa-microphone"></i> 음성 입력
          </button>
        </div>
        <textarea class="form-textarea" id="diary-content" placeholder="오늘의 일기를 써주세요..." style="min-height:120px"></textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveDiary('${type}')">
        <i class="fas fa-save"></i> 저장하기
      </button>`);
  },

  selectMood(mood, btn) {
    document.querySelectorAll('#mood-grid .mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const el = document.getElementById('diary-mood');
    if (el) el.value = mood;
  },

  async saveDiary(type) {
    const title = document.getElementById('diary-title')?.value?.trim();
    const content = document.getElementById('diary-content')?.value?.trim();
    const date = document.getElementById('diary-date')?.value;
    const mood = document.getElementById('diary-mood')?.value;
    const weather = document.getElementById('diary-weather')?.value;

    if (!content && !title) { this.toast('내용을 입력해주세요', 'error'); return; }

    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...'; btn.disabled = true; }

    try {
      // AI 한줄 요약 + 무드 자동 생성 (내용이 있을 때)
      let aiSummary = title;
      let aiMood = mood;
      if (content && content.length > 10) {
        try {
          if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 분석 중...';
          const aiRes = await fetch('/api/ai/structure', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'diary', text: content })
          });
          const aiData = await aiRes.json();
          if (aiData.summary && !title) aiSummary = aiData.summary;
          if (aiData.mood && !mood) aiMood = aiData.mood;
        } catch(_) {}
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 노션 저장 중...';
      }

      await fetch('/api/diary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.diary, type, date,
          title: title || aiSummary || `${date} ${type}`,
          content, mood: aiMood, weather,
          summary: aiSummary || title
        })
      });
      document.getElementById('app-modal')?.remove();
      this.toast('📔 일기가 노션에 저장됐어요!' + (aiSummary && !title ? ` AI 요약: "${aiSummary}"` : ''), 'success', 4000);
      this.loadDiary(type);
    } catch (e) { this.toast('저장 실패', 'error'); }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // IDEA MEMO
  // ══════════════════════════════════════════════════════════════════════════
  renderIdea() {
    return `
    <div id="idea-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  async loadIdeas() {
    const el = document.getElementById('idea-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/ideas?dbId=${this.state.dbIds.idea}`);
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">💡</span><p>아이디어를 기록해보세요!<br>음성이나 텍스트로 입력하면<br>AI가 자동으로 정리해줘요</p></div>'; return; }
      el.innerHTML = results.map(i => {
        const props = i.properties;
        const title = props['아이디어 제목']?.title?.[0]?.text?.content || '제목 없음';
        const category = props['카테고리']?.select?.name || '';
        const core = props['핵심 내용']?.rich_text?.[0]?.text?.content || '';
        const potential = props['실현 가능성']?.select?.name || '';
        return `
        <div class="card" style="cursor:pointer" onclick="window.open('https://notion.so/${i.id.replace(/-/g,'')}','_blank')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600">💡 ${title}</div>
            ${potential ? `<span class="status-badge ${potential === '높음' ? 'status-done' : potential === '낮음' ? 'status-todo' : 'status-doing'}" style="flex-shrink:0">${potential}</span>` : ''}
          </div>
          ${category ? `<span class="tag">${category}</span>` : ''}
          ${core ? `<p style="font-size:13px;color:#64748b;margin-top:8px;line-height:1.5">${core}</p>` : ''}
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
  },

  showAddIdea() {
    this.showModal('💡 아이디어 메모', `
      <div class="form-group">
        <label class="form-label">아이디어 내용 *</label>
        <div style="display:flex;gap:8px;margin-bottom:6px">
          <button class="btn btn-secondary btn-sm" onclick="MemoNest.startVoiceInput('idea-text')">
            <i class="fas fa-microphone"></i> 음성 입력
          </button>
        </div>
        <textarea class="form-textarea" id="idea-text" placeholder="떠오른 아이디어를 자유롭게 적어주세요.&#10;AI가 자동으로 정리해드릴게요!" style="min-height:120px"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-select" id="idea-category">
            <option>비즈니스</option><option>기술</option>
            <option>라이프</option><option>창작</option><option>기타</option>
          </select>
        </div>
      </div>
      <div class="ai-card" style="margin-bottom:12px">
        <div class="ai-label">🤖 AI가 자동으로</div>
        <div class="ai-content">제목 생성 · 핵심 내용 정리 · 실현 가능성 평가 · 태그 추천</div>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveIdea()">
        <i class="fas fa-magic"></i> AI 정리 & 노션 저장
      </button>`);
  },

  async saveIdea() {
    const rawText = document.getElementById('idea-text')?.value?.trim();
    if (!rawText) { this.toast('아이디어 내용을 입력해주세요', 'error'); return; }
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 처리 중...'; btn.disabled = true; }
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId: this.state.dbIds.idea, rawText, category: document.getElementById('idea-category')?.value })
      });
      const data = await res.json();
      document.getElementById('app-modal')?.remove();
      this.toast('💡 아이디어가 노션에 저장됐어요!', 'success');
      this.loadIdeas();
    } catch (e) { this.toast('저장 실패', 'error'); }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NOVEL MEMO
  // ══════════════════════════════════════════════════════════════════════════
  renderNovel() {
    return `
    <div id="novel-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  async loadNovels() {
    const el = document.getElementById('novel-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/novels?dbId=${this.state.dbIds.novel}`);
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">📖</span><p>소설 소재를 기록해보세요!<br>AI가 시나리오 구조를 잡아드려요</p></div>'; return; }
      el.innerHTML = results.map(n => {
        const props = n.properties;
        const title = props['작품명']?.title?.[0]?.text?.content || '제목 없음';
        const genre = props['장르']?.select?.name || '';
        const status = props['진행 상태']?.select?.name || '';
        const theme = props['핵심 소재']?.rich_text?.[0]?.text?.content || '';
        return `
        <div class="card" style="cursor:pointer" onclick="window.open('https://notion.so/${n.id.replace(/-/g,'')}','_blank')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600">📖 ${title}</div>
            ${status ? `<span class="status-badge status-doing">${status}</span>` : ''}
          </div>
          ${genre ? `<span class="tag">${genre}</span>` : ''}
          ${theme ? `<p style="font-size:13px;color:#64748b;margin-top:8px;line-height:1.5">${theme}</p>` : ''}
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
  },

  showAddNovel() {
    this.showModal('📖 소설 소재 메모', `
      <div class="form-group">
        <label class="form-label">소재 / 아이디어 *</label>
        <div style="display:flex;gap:8px;margin-bottom:6px">
          <button class="btn btn-secondary btn-sm" onclick="MemoNest.startVoiceInput('novel-text')">
            <i class="fas fa-microphone"></i> 음성 입력
          </button>
        </div>
        <textarea class="form-textarea" id="novel-text" placeholder="소설 소재나 시나리오 컨셉을 자유롭게 적어주세요.&#10;AI가 구조화하고 채워야 할 설정을 물어볼게요!" style="min-height:120px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">장르</label>
        <select class="form-select" id="novel-genre">
          <option>로맨스</option><option>미스터리</option><option>SF</option>
          <option>판타지</option><option>현대물</option><option>기타</option>
        </select>
      </div>
      <div class="ai-card" style="margin-bottom:12px">
        <div class="ai-label">🤖 AI가 자동으로</div>
        <div class="ai-content">배경·주인공·테마 분석 후 채워야 할 설정 5가지를 Q&A로 제안해드려요</div>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveNovel()">
        <i class="fas fa-magic"></i> AI 분석 & 노션 저장
      </button>`);
  },

  async saveNovel() {
    const rawText = document.getElementById('novel-text')?.value?.trim();
    if (!rawText) { this.toast('소재 내용을 입력해주세요', 'error'); return; }
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 분석 중...'; btn.disabled = true; }
    try {
      const res = await fetch('/api/novels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId: this.state.dbIds.novel, rawText, genre: document.getElementById('novel-genre')?.value })
      });
      const data = await res.json();
      document.getElementById('app-modal')?.remove();

      if (data.structured?.questions?.length) {
        this.showModal('📖 AI 시나리오 분석 결과', `
          <div class="ai-card" style="margin-bottom:14px">
            <div class="ai-label">🤖 AI 분석</div>
            <div class="ai-content">
              <strong>가제:</strong> ${data.structured.title || ''}<br>
              <strong>배경:</strong> ${data.structured.setting || ''}<br>
              <strong>주인공:</strong> ${data.structured.protagonist || ''}
            </div>
          </div>
          <div class="section-title">❓ 더 채워야 할 설정</div>
          ${data.structured.questions.map((q, i) => `
            <div class="qa-item">
              <div class="qa-question">Q${i+1}. ${q}</div>
              <input class="form-input" style="margin-top:6px;font-size:13px" placeholder="답변을 적어주세요 (선택)">
            </div>`).join('')}
          <div style="margin-top:14px;text-align:center">
            <a href="https://notion.so" target="_blank" class="notion-link">
              <i class="fas fa-external-link-alt"></i> 노션에서 전체 설정 보기
            </a>
          </div>`);
      } else {
        this.toast('📖 소설 소재가 노션에 저장됐어요!', 'success');
      }
      this.loadNovels();
    } catch (e) { this.toast('저장 실패', 'error'); }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SHOPPING LIST
  // ══════════════════════════════════════════════════════════════════════════
  renderShopping() {
    // 뷰 모드: 'list'(기본) | 'group'(카테고리별 그룹화)
    const viewMode = this.load('shoppingViewMode', 'list');
    return `
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-bottom:10px">
      <span style="font-size:12px;color:#6b7280">뷰:</span>
      <button id="shop-view-list" onclick="MemoNest.setShoppingView('list')"
        class="btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}"
        style="padding:4px 10px;font-size:12px">
        <i class="fas fa-list"></i> 목록
      </button>
      <button id="shop-view-group" onclick="MemoNest.setShoppingView('group')"
        class="btn btn-sm ${viewMode === 'group' ? 'btn-primary' : 'btn-secondary'}"
        style="padding:4px 10px;font-size:12px">
        <i class="fas fa-layer-group"></i> 카테고리
      </button>
    </div>
    <div id="shopping-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  setShoppingView(mode) {
    this.save('shoppingViewMode', mode);
    // 뷰 버튼 스타일 업데이트
    const listBtn = document.getElementById('shop-view-list');
    const groupBtn = document.getElementById('shop-view-group');
    if (listBtn) {
      listBtn.className = `btn btn-sm ${mode === 'list' ? 'btn-primary' : 'btn-secondary'}`;
      listBtn.style.cssText = 'padding:4px 10px;font-size:12px';
    }
    if (groupBtn) {
      groupBtn.className = `btn btn-sm ${mode === 'group' ? 'btn-primary' : 'btn-secondary'}`;
      groupBtn.style.cssText = 'padding:4px 10px;font-size:12px';
    }
    this.loadShopping();
  },

  _renderShoppingItem(item) {
    const props = item.properties;
    const name = props['아이템']?.title?.[0]?.text?.content || '아이템';
    const rec = props['구매처 추천']?.rich_text?.[0]?.text?.content || '';
    const bought = props['구매완료']?.checkbox || false;
    const country = props['국가']?.select?.name || '';
    const catEmojis = { '식품': '🥦', '생활용품': '🧴', '가전': '📱', '의류': '👕', '기타': '🛍️' };
    const cat = props['카테고리']?.select?.name || '기타';
    return `
    <div class="shopping-item ${bought ? 'bought' : ''}">
      <span class="item-emoji">${catEmojis[cat] || '🛍️'}</span>
      <div class="item-info" style="flex:1">
        <div class="item-name">${name}</div>
        ${rec ? `<div class="item-rec">${rec.slice(0, 80)}${rec.length > 80 ? '...' : ''}</div>` : ''}
        ${country ? `<span class="tag" style="margin-top:4px;font-size:10px">${country}</span>` : ''}
      </div>
      <button class="btn btn-sm ${bought ? 'btn-secondary' : 'btn-success'}" style="flex-shrink:0"
        onclick="MemoNest.toggleShopping('${item.id}', ${!bought})">
        ${bought ? '↩️' : '✅'}
      </button>
      <button onclick="MemoNest.deleteShopping('${item.id}')"
        style="background:none;border:1px solid #fee2e2;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:#ef4444;flex-shrink:0;margin-left:4px" title="삭제">
        <i class="fas fa-trash"></i>
      </button>
    </div>`;
  },

  async loadShopping() {
    const el = document.getElementById('shopping-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/shopping?dbId=${this.state.dbIds.shopping}`);
      const data = await res.json();
      if (data.object === 'error') {
        el.innerHTML = `<div style="text-align:center;padding:30px;color:#6b7280">
          <p style="font-size:32px">🔗</p>
          <p style="font-weight:600;margin-bottom:8px">노션 DB를 찾을 수 없어요</p>
          <p style="font-size:12px;color:#9ca3af;margin-bottom:16px">${data.message || 'DB ID가 유효하지 않습니다'}</p>
          <button class="btn btn-secondary" onclick="MemoNest.recoverFromApp()">🔄 DB 복원 시도</button>
        </div>`; return;
      }
      const results = data.results || [];
      if (!results.length) {
        el.innerHTML = '<div class="empty-state"><span class="emoji">🛒</span><p>장보기 목록이 비어있어요!<br>+ 버튼으로 추가해보세요</p></div>';
        return;
      }

      const viewMode = this.load('shoppingViewMode', 'list');

      if (viewMode === 'group') {
        // ── 카테고리별 그룹화 뷰 ────────────────────────────────────────
        const catOrder = ['식품', '생활용품', '가전', '의류', '기타'];
        const catEmojis = { '식품': '🥦', '생활용품': '🧴', '가전': '📱', '의류': '👕', '기타': '🛍️' };
        // 그룹 맵 생성
        const groups = {};
        catOrder.forEach(c => { groups[c] = []; });
        results.forEach(item => {
          const cat = item.properties['카테고리']?.select?.name || '기타';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
        });

        // 빈 그룹 제외, 항목 있는 카테고리만 렌더
        const html = catOrder.filter(cat => groups[cat].length > 0).map(cat => {
          const items = groups[cat];
          const total = items.length;
          const done = items.filter(i => i.properties['구매완료']?.checkbox).length;
          const allDone = done === total;
          // 접기/펼치기 상태: 기본 펼침 (미구매 있으면 펼침)
          const collapseKey = `shopCat_${cat}_collapsed`;
          const isCollapsed = this.load(collapseKey, false);
          return `
          <div class="shopping-group" style="margin-bottom:12px;border:1px solid ${allDone ? '#d1fae5' : '#e5e7eb'};border-radius:10px;overflow:hidden">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${allDone ? '#f0fdf4' : '#f9fafb'};cursor:pointer"
              onclick="MemoNest.toggleShoppingGroup('${cat}')">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">${catEmojis[cat] || '🛍️'}</span>
                <span style="font-weight:600;font-size:14px;color:#374151">${cat}</span>
                <span style="font-size:12px;color:#6b7280;background:#e5e7eb;border-radius:10px;padding:1px 7px">${done}/${total}</span>
                ${allDone ? '<span style="font-size:11px;color:#10b981;font-weight:600">✓ 완료</span>' : ''}
              </div>
              <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}" style="color:#9ca3af;font-size:12px"></i>
            </div>
            <div id="shop-group-${cat}" style="display:${isCollapsed ? 'none' : 'block'};padding:0 8px 8px">
              ${items.map(item => this._renderShoppingItem(item)).join('')}
            </div>
          </div>`;
        }).join('');

        // 하단 진행 요약
        const totalAll = results.length;
        const doneAll = results.filter(i => i.properties['구매완료']?.checkbox).length;
        const pct = Math.round(doneAll / totalAll * 100);
        el.innerHTML = html + `
        <div style="margin-top:8px;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;margin-bottom:6px">
            <span>전체 진행률</span><span>${doneAll}/${totalAll} 완료 (${pct}%)</span>
          </div>
          <div style="background:#e5e7eb;border-radius:4px;height:6px;overflow:hidden">
            <div style="background:${pct === 100 ? '#10b981' : '#6366f1'};width:${pct}%;height:100%;border-radius:4px;transition:width 0.4s"></div>
          </div>
        </div>`;
      } else {
        // ── 기본 목록 뷰 ─────────────────────────────────────────────────
        el.innerHTML = results.map(item => this._renderShoppingItem(item)).join('');
      }
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
  },

  toggleShoppingGroup(cat) {
    const key = `shopCat_${cat}_collapsed`;
    const isCollapsed = this.load(key, false);
    this.save(key, !isCollapsed);
    const el = document.getElementById(`shop-group-${cat}`);
    if (el) el.style.display = !isCollapsed ? 'none' : 'block';
    // 화살표 아이콘 토글
    const header = el?.previousElementSibling;
    if (header) {
      const icon = header.querySelector('i.fa-chevron-up, i.fa-chevron-down');
      if (icon) {
        icon.className = `fas fa-chevron-${!isCollapsed ? 'down' : 'up'}`;
        icon.style.cssText = 'color:#9ca3af;font-size:12px';
      }
    }
  },

  async toggleShopping(pageId, checked) {
    try {
      await fetch(`/api/shopping/${pageId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked })
      });
      this.loadShopping();
    } catch (e) { this.toast('업데이트 실패', 'error'); }
  },

  async deleteShopping(pageId) {
    this.showModal('🗑️ 쇼핑 항목 삭제', '이 항목을 삭제할까요?', async () => {
      try {
        await fetch(`/api/shopping/${pageId}`, { method: 'DELETE' });
        document.getElementById('app-modal')?.remove();
        this.toast('🗑️ 삭제됐어요', 'success');
        this.loadShopping();
      } catch (e) { this.toast('삭제 실패', 'error'); }
    });
  },

  showAddShopping() {
    this.showModal('🛒 장보기 추가', `
      <div class="form-group">
        <label class="form-label">아이템 이름 *</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="shop-item" placeholder="예: 딸기, 세제, 에어팟" style="flex:1">
          <button class="btn btn-secondary btn-icon" onclick="MemoNest.startVoiceInput('shop-item')">
            <i class="fas fa-microphone"></i>
          </button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group">
          <label class="form-label">수량</label>
          <input class="form-input" id="shop-qty" placeholder="예: 2개, 1팩">
        </div>
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-select" id="shop-category">
            <option>식품</option><option>생활용품</option>
            <option>가전</option><option>의류</option><option>기타</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">내 위치</label>
        <select class="form-select" id="shop-location">
          <option value="미국">🇺🇸 미국 거주</option>
          <option value="한국">🇰🇷 한국 거주</option>
        </select>
      </div>
      <div class="ai-card" style="margin-bottom:12px">
        <div class="ai-label">🤖 AI가 추천해드려요</div>
        <div class="ai-content">미국/한국 어디서, 온/오프라인 어디서 살지 추천해드려요!</div>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveShopping()">
        <i class="fas fa-magic"></i> AI 추천 & 저장
      </button>`);
  },

  async saveShopping() {
    const item = document.getElementById('shop-item')?.value?.trim();
    if (!item) { this.toast('아이템 이름을 입력해주세요', 'error'); return; }
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 분석 중...'; btn.disabled = true; }
    try {
      const res = await fetch('/api/shopping', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.shopping, item,
          quantity: document.getElementById('shop-qty')?.value,
          category: document.getElementById('shop-category')?.value,
          userLocation: document.getElementById('shop-location')?.value,
        })
      });
      const data = await res.json();
      document.getElementById('app-modal')?.remove();
      if (data.recommendation) {
        this.toast(`🛒 저장 완료! 추천: ${data.recommendation.best_place || ''}`, 'success', 4000);
      } else {
        this.toast('🛒 저장됐어요!', 'success');
      }
      this.loadShopping();
    } catch (e) { this.toast('저장 실패', 'error'); }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE CALENDAR
  // ══════════════════════════════════════════════════════════════════════════

  // OAuth 팝업 창에서 메시지 수신
  _onOAuthMessage(e) {
    if (e.data?.type === 'GCAL_AUTH_SUCCESS') {
      const t = e.data.tokens;
      this.state.googleCalTokens = t;
      this.save('googleCalTokens', t);
      this.toast('✅ Google Calendar 연동 완료!', 'success', 4000);
      // 일정 탭이 열려있으면 캘린더 버튼 갱신
      if (this.state.currentModule === 'schedule') this.render();
    } else if (e.data?.type === 'GCAL_AUTH_ERROR') {
      this.toast('❌ Google 인증 실패: ' + (e.data.error || '알 수 없는 오류'), 'error');
    }
  },

  // Google Calendar 연동 시작 (팝업)
  async connectGoogleCalendar() {
    try {
      const res = await fetch('/api/calendar/auth-url');
      const data = await res.json();
      if (data.error) { this.toast('인증 URL 생성 실패: ' + data.error, 'error'); return; }
      const popup = window.open(data.url, 'gcal_auth', 'width=500,height=650,scrollbars=yes');
      if (!popup) this.toast('팝업이 차단됐어요. 팝업 허용 후 다시 시도해주세요.', 'error');
    } catch(e) { this.toast('오류: ' + e.message, 'error'); }
  },

  // 연동 해제
  disconnectGoogleCalendar() {
    this.state.googleCalTokens = null;
    this.save('googleCalTokens', null);
    this.toast('Google Calendar 연동을 해제했어요.', 'info');
    if (this.state.currentModule === 'schedule') this.render();
  },

  // Notion 일정 → Google Calendar 이벤트 변환
  _scheduleToGCalEvent(sch) {
    const { title, datetime, location, category, reminder, memo } = sch;
    const event = {
      summary: title || '제목 없음',
      description: [
        memo ? `📝 메모: ${memo}` : '',
        category ? `🏷️ 카테고리: ${category}` : '',
        '📌 MemoNest에서 동기화',
      ].filter(Boolean).join('\n'),
    };
    // 날짜/시간 설정
    if (datetime) {
      const dt = new Date(datetime);
      event.start = { dateTime: dt.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      event.end   = { dateTime: new Date(dt.getTime() + 60*60*1000).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    } else {
      const today = new Date().toISOString().split('T')[0];
      event.start = { date: today };
      event.end   = { date: today };
    }
    // 장소
    if (location) {
      const { place, link } = this._parseLocation(location);
      if (place) event.location = place;
      if (link) event.description += `\n🔗 ${link}`;
    }
    // 알림
    if (reminder && reminder !== '없음') {
      const minutesMap = { '10분 전': 10, '1시간 전': 60, '1일 전': 1440 };
      const min = minutesMap[reminder] || 10;
      event.reminders = { useDefault: false, overrides: [{ method: 'popup', minutes: min }] };
    }
    return event;
  },

  // 단일 일정 → Google Calendar 등록
  async addToGoogleCalendar(sid) {
    const sch = this._scheduleCache?.[sid];
    if (!sch) { this.toast('일정 데이터를 찾을 수 없어요.', 'error'); return; }
    const tokens = this.state.googleCalTokens;
    if (!tokens) { this.toast('먼저 Google Calendar를 연동해주세요.', 'error'); return; }

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          issuedAt: tokens.issued_at,
          expiresIn: tokens.expires_in,
          event: this._scheduleToGCalEvent(sch),
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.newTokens) { this.state.googleCalTokens = { ...tokens, ...data.newTokens }; this.save('googleCalTokens', this.state.googleCalTokens); }
      this.toast(`📅 "${sch.title}" Google Calendar에 추가했어요!`, 'success', 4000);
    } catch(e) {
      if (e.message?.includes('401')) { this.toast('구글 인증이 만료됐어요. 다시 연동해주세요.', 'error'); this.state.googleCalTokens = null; this.save('googleCalTokens', null); }
      else this.toast('캘린더 등록 실패: ' + e.message, 'error');
    }
  },

  // 전체 일정 → Google Calendar 일괄 등록
  async syncAllToGoogleCalendar() {
    const tokens = this.state.googleCalTokens;
    if (!tokens) { this.toast('먼저 Google Calendar를 연동해주세요.', 'error'); return; }
    const cache = this._scheduleCache;
    if (!cache || !Object.keys(cache).length) { this.toast('동기화할 일정이 없어요.', 'info'); return; }

    const events = Object.values(cache).map(s => this._scheduleToGCalEvent(s));
    this.toast(`⏳ ${events.length}개 일정을 Google Calendar에 등록 중...`, 'info', 5000);

    try {
      const res = await fetch('/api/calendar/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          issuedAt: tokens.issued_at,
          expiresIn: tokens.expires_in,
          events,
        })
      });
      const data = await res.json();
      if (data.newTokens) { this.state.googleCalTokens = { ...tokens, ...data.newTokens }; this.save('googleCalTokens', this.state.googleCalTokens); }
      this.toast(`✅ ${data.created}개 등록 완료 / ${data.failed}개 실패`, 'success', 5000);
      // 실패 항목 상세 표시
      const failed = (data.results || []).filter(r => !r.success);
      if (failed.length) console.warn('캘린더 등록 실패 항목:', failed);
    } catch(e) {
      this.toast('일괄 등록 실패: ' + e.message, 'error');
    }
  },

  // 캘린더 연동 상태 배너 HTML
  _renderGCalBanner() {
    const t = this.state.googleCalTokens;
    const isConnected = !!(t?.access_token);
    if (isConnected) {
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:10px">
        <span style="font-size:18px">📅</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#16a34a">Google Calendar 연동됨</div>
          <div style="font-size:11px;color:#6b7280">일정 카드의 📅 버튼으로 개별 추가, 아래 버튼으로 전체 동기화</div>
        </div>
        <button onclick="MemoNest.syncAllToGoogleCalendar()" style="white-space:nowrap;background:#16a34a;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer">
          <i class="fas fa-sync-alt"></i> 전체 동기화
        </button>
        <button onclick="MemoNest.disconnectGoogleCalendar()" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:11px;color:#6b7280;cursor:pointer" title="연동 해제">
          <i class="fas fa-unlink"></i>
        </button>
      </div>`;
    } else {
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fafafa;border:1px dashed #d1d5db;border-radius:12px;margin-bottom:10px">
        <span style="font-size:18px">📅</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#374151">Google Calendar 연동</div>
          <div style="font-size:11px;color:#6b7280">일정을 Google Calendar에 자동으로 추가할 수 있어요</div>
        </div>
        <button onclick="MemoNest.connectGoogleCalendar()" style="white-space:nowrap;background:white;border:1.5px solid #4285f4;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;color:#4285f4;cursor:pointer;display:flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" style="flex-shrink:0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google 연동
        </button>
      </div>`;
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SCHEDULE
  // ══════════════════════════════════════════════════════════════════════════
  // ── 카테고리 파스텔 색상 ────────────────────────────────────────────────
  _catStyle: {
    '회의':   { bg:'#ede9fe', border:'#c4b5fd', dot:'#7c3aed', tag:'#6d28d9' },
    '개인':   { bg:'#dcfce7', border:'#86efac', dot:'#16a34a', tag:'#15803d' },
    '이벤트': { bg:'#fef9c3', border:'#fde047', dot:'#ca8a04', tag:'#a16207' },
    '약속':   { bg:'#fee2e2', border:'#fca5a5', dot:'#dc2626', tag:'#b91c1c' },
    '기타':   { bg:'#f1f5f9', border:'#cbd5e1', dot:'#64748b', tag:'#475569' },
  },
  _getCatStyle(cat) {
    return this._catStyle[cat] || this._catStyle['기타'];
  },

  // ── 일정 뷰 상태 ─────────────────────────────────────────────────────────
  _schedView: {
    mode: 'month',       // 'day' | 'week' | 'month'
    anchor: null,        // 현재 기준 Date (null = today)
  },

  renderSchedule() {
    // GCal 배너 + 2분할 레이아웃
    const isPC = this.isPC();
    return `
    ${this._renderTzBar()}
    ${this._renderPushBanner()}
    <div id="sched-todo-due"></div>
    ${this._renderGCalBanner()}
    <div id="schedule-split" style="display:${isPC?'grid':'block'};grid-template-columns:1fr 1fr;gap:16px;min-height:0;${isPC?'':''}">
      <!-- 왼쪽: 캘린더 -->
      <div id="cal-pane" style="min-width:0">
        <div id="cal-container" style="animation:fadeSlide 0.25s ease"></div>
      </div>
      <!-- 오른쪽: 리스트 -->
      <div id="list-pane" style="min-width:0;${isPC?'max-height:calc(100vh - 220px);overflow-y:auto;':''}">
        <div id="schedule-list"><div class="loading"><div class="spinner"></div></div></div>
      </div>
    </div>
    <style>
      @keyframes fadeSlide {
        from { opacity:0; transform:translateY(6px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .cal-day-cell { transition: background 0.15s, transform 0.15s; cursor:pointer; }
      .cal-day-cell:hover { background: rgba(99,102,241,0.08) !important; transform:scale(1.04); }
      .cal-day-cell.selected { background: var(--primary) !important; color:white !important; border-radius:50%; }
      .cal-day-cell.today { font-weight:700; }
      .sch-card-anim { animation: fadeSlide 0.2s ease; }
    </style>`;
  },

  async loadSchedules() {
    const el = document.getElementById('schedule-list');
    if (!el) return;

    // 캘린더 렌더 (데이터 없어도)
    if (!this._scheduleCache) this._scheduleCache = {};

    try {
      const res = await fetch(`/api/schedules?dbId=${this.state.dbIds.schedule}`);
      const data = await res.json();
      if (data.object === 'error') {
        el.innerHTML = `<div style="text-align:center;padding:30px;color:#6b7280">
          <p style="font-size:32px">🔗</p>
          <p style="font-weight:600;margin-bottom:8px">노션 DB를 찾을 수 없어요</p>
          <p style="font-size:12px;color:#9ca3af;margin-bottom:16px">${data.message || 'DB ID가 유효하지 않습니다'}</p>
          <button class="btn btn-secondary" onclick="MemoNest.recoverFromApp()">🔄 DB 복원 시도</button>
        </div>`; return;
      }

      const results = data.results || [];
      this._scheduleCache = {};
      results.forEach(s => {
        const props = s.properties;
        this._scheduleCache[s.id] = {
          title:       props['일정 제목']?.title?.[0]?.text?.content || '제목 없음',
          datetime:    props['날짜/시간']?.date?.start || '',
          endDatetime: props['날짜/시간']?.date?.end || '',
          location:    props['장소']?.rich_text?.[0]?.text?.content || '',
          category:    props['카테고리']?.select?.name || '',
          reminder:    props['알림']?.select?.name || '',
          memo:        props['메모']?.rich_text?.[0]?.text?.content || '',
        };
      });

      // 회의록 연동 상태 로드 → 일정 카드에 "회의록 완료/작성" 구분 표시용
      // (일정 탭에서도 어떤 회의 일정에 회의록이 등록됐는지 알아야 함)
      await this._loadLinkedMeetingIds();

      // 마감 임박/초과 ToDo 배너 (일정 맥락에서 할 일도 함께 인지)
      this._renderScheduleTodoDue();

      // 캘린더 렌더
      this._renderCalendar();

      // 리스트 렌더
      this._renderScheduleList();

    } catch (e) {
      el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패: ' + e.message + '</p>';
    }
  },

  // ── 회의록에 연동된 일정 ID Set 로드 (일정 탭에서 회의록 완료 여부 표시용) ──
  async _loadLinkedMeetingIds() {
    try {
      if (!this.state.dbIds.meeting) { this._meetingScheduleIds = new Set(); return; }
      const res = await fetch(`/api/meetings?dbId=${this.state.dbIds.meeting}`);
      const data = await res.json();
      if (data.object === 'error' || !data.results) { this._meetingScheduleIds = new Set(); return; }
      this._meetingScheduleIds = new Set(
        data.results
          .map(m => m.properties?.['일정 ID']?.rich_text?.[0]?.text?.content || '')
          .filter(Boolean)
      );
    } catch (e) {
      // 실패해도 일정 렌더는 계속 (연동 배지만 생략)
      if (!this._meetingScheduleIds) this._meetingScheduleIds = new Set();
    }
  },

  // ── 일정 화면: 마감 임박/초과 ToDo 배너 (읽기 전용) ───────────────────────
  async _renderScheduleTodoDue() {
    const el = document.getElementById('sched-todo-due');
    if (!el || !this.state.dbIds.todo) return;
    try {
      const res = await fetch(`/api/todos?dbId=${this.state.dbIds.todo}`);
      const data = await res.json();
      const todos = data.results || [];
      const todayStr = new Date().toISOString().split('T')[0];
      // 미완료 & Due Date 있음 & (오늘 이하 마감)
      const due = todos.filter(t => {
        if (t.properties['상태']?.select?.name === '완료') return false;
        const d = t.properties['Due Date']?.date?.start;
        return d && d.slice(0, 10) <= todayStr;
      });
      if (!due.length) { el.innerHTML = ''; return; }
      const overdue = due.filter(t => (t.properties['Due Date']?.date?.start || '').slice(0,10) < todayStr).length;
      const names = due.slice(0, 3).map(t => t.properties['할 일']?.title?.[0]?.text?.content || '').filter(Boolean);
      const more = due.length > 3 ? ` 외 ${due.length - 3}건` : '';
      el.innerHTML = `
      <div onclick="MemoNest.navigate('todo')" style="cursor:pointer;display:flex;align-items:center;gap:10px;padding:10px 14px;background:${overdue ? '#fef2f2' : '#fffbeb'};border:1px solid ${overdue ? '#fecaca' : '#fde68a'};border-radius:12px;margin-bottom:10px">
        <span style="font-size:18px">${overdue ? '⚠️' : '📋'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:${overdue ? '#dc2626' : '#d97706'}">
            오늘까지 할 일 ${due.length}건${overdue ? ` (기한초과 ${overdue}건)` : ''}
          </div>
          <div style="font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${names.join(', ')}${more}</div>
        </div>
        <span style="font-size:11px;color:#6366f1;white-space:nowrap">ToDo ▶</span>
      </div>`;
    } catch (_) { el.innerHTML = ''; }
  },

  // ── 캘린더 렌더 ───────────────────────────────────────────────────────────
  _renderCalendar() {
    const container = document.getElementById('cal-container');
    if (!container) return;

    const mode = this._schedView.mode || 'month';
    const anchor = this._schedView.anchor ? new Date(this._schedView.anchor) : new Date();
    const today = new Date();

    // 이벤트 날짜 Set (빠른 조회용)
    const eventDates = new Set();
    Object.values(this._scheduleCache || {}).forEach(s => {
      if (s.datetime) eventDates.add(s.datetime.slice(0,10));
    });

    // 탭 버튼
    const tabs = ['day','week','month'].map(m => `
      <button onclick="MemoNest._setCalMode('${m}')"
        style="padding:5px 14px;border-radius:20px;border:none;cursor:pointer;font-size:12px;font-weight:600;
               transition:all 0.2s;
               ${mode===m ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(99,102,241,0.3)' : 'background:#f1f5f9;color:#64748b'}">
        ${m==='day'?'일':m==='week'?'주':'월'}
      </button>`).join('');

    let calBody = '';
    if (mode === 'month') {
      calBody = this._renderMonthCal(anchor, today, eventDates);
    } else if (mode === 'week') {
      calBody = this._renderWeekCal(anchor, today, eventDates);
    } else {
      calBody = this._renderDayCal(anchor, today, eventDates);
    }

    // 헤더 레이블
    let headerLabel = '';
    if (mode === 'month') {
      headerLabel = anchor.toLocaleDateString('ko-KR', {year:'numeric', month:'long'});
    } else if (mode === 'week') {
      const weekStart = new Date(anchor);
      weekStart.setDate(anchor.getDate() - anchor.getDay());
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
      headerLabel = `${weekStart.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}`;
    } else {
      headerLabel = anchor.toLocaleDateString('ko-KR', {year:'numeric', month:'long', day:'numeric', weekday:'short'});
    }

    container.innerHTML = `
      <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:14px 14px 10px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;gap:6px">${tabs}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <button onclick="MemoNest._calNavigate(-1)" style="border:1px solid #e2e8f0;background:white;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">‹</button>
            <span style="font-size:13px;font-weight:700;color:#374151;min-width:80px;text-align:center">${headerLabel}</span>
            <button onclick="MemoNest._calNavigate(1)"  style="border:1px solid #e2e8f0;background:white;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">›</button>
            <button onclick="MemoNest._calGoToday()" style="border:1px solid #e2e8f0;background:white;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:11px;color:#6366f1;font-weight:600;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">오늘</button>
          </div>
        </div>
        ${calBody}
      </div>`;
  },

  _renderMonthCal(anchor, today, eventDates) {
    const year = anchor.getFullYear(), month = anchor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const selectedStr = this._schedView.selectedDate;

    const dayLabels = ['일','월','화','수','목','금','토'].map((d,i) =>
      `<div style="text-align:center;font-size:11px;font-weight:700;color:${i===0?'#ef4444':i===6?'#6366f1':'#94a3b8'};padding:4px 0">${d}</div>`
    ).join('');

    let cells = '';
    // 빈 칸
    for (let i=0; i<firstDay; i++) cells += '<div></div>';
    // 날짜 칸
    for (let d=1; d<=daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
      const isSelected = selectedStr === dateStr;
      const hasEvent = eventDates.has(dateStr);
      const dow = (firstDay + d - 1) % 7;
      const color = dow===0?'#ef4444':dow===6?'#6366f1':'#374151';

      cells += `
        <div class="cal-day-cell${isSelected?' selected':''}"
          onclick="MemoNest._calSelectDate('${dateStr}')"
          style="text-align:center;padding:5px 2px;border-radius:50%;position:relative;
                 ${isToday&&!isSelected?'border:2px solid var(--primary)':'border:2px solid transparent'}
                 ${isSelected?'background:var(--primary);color:white':'color:'+color}">
          <span style="font-size:13px;${isToday&&!isSelected?'font-weight:700':''}">${d}</span>
          ${hasEvent ? `<span style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:${isSelected?'white':'var(--primary)'};display:block"></span>` : ''}
        </div>`;
    }

    return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">${dayLabels}${cells}</div>`;
  },

  _renderWeekCal(anchor, today, eventDates) {
    const weekStart = new Date(anchor);
    weekStart.setDate(anchor.getDate() - anchor.getDay());
    const selectedStr = this._schedView.selectedDate;
    const days = [];
    for (let i=0; i<7; i++) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    const dayLabels = ['일','월','화','수','목','금','토'];
    const cells = days.map((d, i) => {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const isToday = d.toDateString() === today.toDateString();
      const isSelected = selectedStr === dateStr;
      const hasEvent = eventDates.has(dateStr);
      const color = i===0?'#ef4444':i===6?'#6366f1':'#374151';
      return `
        <div onclick="MemoNest._calSelectDate('${dateStr}')"
          style="text-align:center;padding:8px 4px;border-radius:10px;cursor:pointer;transition:all 0.15s;
                 ${isSelected?'background:var(--primary);color:white':'background:#f8fafc;color:'+color}
                 ${isToday&&!isSelected?';outline:2px solid var(--primary)':''}
                 position:relative">
          <div style="font-size:10px;font-weight:600;margin-bottom:2px">${dayLabels[i]}</div>
          <div style="font-size:16px;font-weight:700">${d.getDate()}</div>
          ${hasEvent ? `<span style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:${isSelected?'white':'var(--primary)'};display:block"></span>` : ''}
        </div>`;
    }).join('');
    return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cells}</div>`;
  },

  _renderDayCal(anchor, today, eventDates) {
    // 해당 날짜의 시간대별 일정 표시
    const dateStr = `${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}-${String(anchor.getDate()).padStart(2,'0')}`;
    const isToday = anchor.toDateString() === today.toDateString();
    const daySchedules = Object.entries(this._scheduleCache || {}).filter(([,s]) =>
      s.datetime && s.datetime.startsWith(dateStr)
    ).sort(([,a],[,b]) => a.datetime.localeCompare(b.datetime));

    return `
      <div style="text-align:center;padding:6px 0 10px">
        <div style="font-size:24px;font-weight:800;color:${isToday?'var(--primary)':'#374151'}">${anchor.getDate()}</div>
        <div style="font-size:11px;color:#9ca3af">${anchor.toLocaleDateString('ko-KR',{weekday:'long'})}</div>
      </div>
      <div style="max-height:200px;overflow-y:auto">
        ${daySchedules.length ? daySchedules.map(([sid,s]) => {
          const cs = this._getCatStyle(s.category);
          const timeStr = s.datetime ? new Date(s.datetime).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}) : '';
          return `<div style="display:flex;gap:8px;padding:6px 8px;margin-bottom:4px;border-radius:8px;background:${cs.bg};border-left:3px solid ${cs.dot};cursor:pointer"
            onclick="MemoNest.showEditScheduleById('${sid}')">
            <span style="font-size:11px;color:${cs.tag};font-weight:600;white-space:nowrap">${timeStr}</span>
            <span style="font-size:12px;font-weight:600;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title}</span>
          </div>`;
        }).join('') : '<div style="text-align:center;padding:16px;font-size:12px;color:#9ca3af">일정 없음</div>'}
      </div>`;
  },

  _setCalMode(mode) {
    this._schedView.mode = mode;
    this._schedView.selectedDate = null;
    const container = document.getElementById('cal-container');
    if (container) container.style.animation = 'none';
    this._renderCalendar();
    this._renderScheduleList();
    if (container) { container.style.animation = ''; container.offsetHeight; container.style.animation = 'fadeSlide 0.25s ease'; }
  },

  _calNavigate(dir) {
    const mode = this._schedView.mode;
    const anchor = this._schedView.anchor ? new Date(this._schedView.anchor) : new Date();
    if (mode === 'month') anchor.setMonth(anchor.getMonth() + dir);
    else if (mode === 'week') anchor.setDate(anchor.getDate() + dir * 7);
    else anchor.setDate(anchor.getDate() + dir);
    this._schedView.anchor = anchor.toISOString();
    this._schedView.selectedDate = null;
    this._animateCalendar(() => { this._renderCalendar(); this._renderScheduleList(); });
  },

  _calGoToday() {
    this._schedView.anchor = new Date().toISOString();
    this._schedView.selectedDate = new Date().toISOString().slice(0,10);
    this._animateCalendar(() => { this._renderCalendar(); this._renderScheduleList(); });
  },

  _calSelectDate(dateStr) {
    this._schedView.selectedDate = dateStr;
    this._schedView.anchor = new Date(dateStr + 'T12:00:00').toISOString();
    this._renderCalendar();
    this._renderScheduleList();
  },

  _animateCalendar(fn) {
    const container = document.getElementById('cal-container');
    if (!container) { fn(); return; }
    container.style.opacity = '0';
    container.style.transform = 'translateY(8px)';
    setTimeout(() => {
      fn();
      container.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
      setTimeout(() => { container.style.transition = ''; }, 250);
    }, 80);
  },

  // ── 일정 리스트 렌더 (오른쪽 패널) ───────────────────────────────────────
  _renderScheduleList() {
    const el = document.getElementById('schedule-list');
    if (!el) return;

    const mode = this._schedView.mode;
    const anchor = this._schedView.anchor ? new Date(this._schedView.anchor) : new Date();
    const selectedDate = this._schedView.selectedDate;

    const allItems = Object.entries(this._scheduleCache || {});

    // 필터 함수
    let filtered = [];
    let rangeLabel = '';
    if (mode === 'day' || selectedDate) {
      const dateStr = selectedDate || anchor.toISOString().slice(0,10);
      filtered = allItems.filter(([,s]) => s.datetime && s.datetime.startsWith(dateStr));
      rangeLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('ko-KR', {month:'long',day:'numeric',weekday:'short'});
    } else if (mode === 'week') {
      const ws = new Date(anchor); ws.setDate(anchor.getDate() - anchor.getDay());
      const we = new Date(ws); we.setDate(ws.getDate() + 7);
      filtered = allItems.filter(([,s]) => {
        if (!s.datetime) return false;
        const d = new Date(s.datetime); return d >= ws && d < we;
      });
      rangeLabel = `${ws.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})} ~ ${we.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})} 주간`;
    } else {
      // month — 해당 월 전체
      const year = anchor.getFullYear(), month = anchor.getMonth();
      filtered = allItems.filter(([,s]) => {
        if (!s.datetime) return false;
        const d = new Date(s.datetime);
        return d.getFullYear()===year && d.getMonth()===month;
      });
      rangeLabel = anchor.toLocaleDateString('ko-KR',{year:'numeric',month:'long'});
    }

    // 날짜순 정렬
    filtered.sort(([,a],[,b]) => (a.datetime||'').localeCompare(b.datetime||''));

    if (!filtered.length) {
      el.innerHTML = `
        <div style="text-align:center;padding:30px 16px;color:#94a3b8">
          <div style="font-size:28px;margin-bottom:8px">📭</div>
          <div style="font-size:13px">${rangeLabel}의 일정 없음</div>
          <button class="btn btn-primary" onclick="MemoNest.showAddSchedule()" style="margin-top:12px;padding:8px 20px;font-size:13px">
            <i class="fas fa-plus"></i> 일정 추가
          </button>
        </div>`;
      return;
    }

    const now = new Date();
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:#64748b">${rangeLabel} · ${filtered.length}건</div>
      </div>
      ${filtered.map(([sid, s]) => {
        const cs = this._getCatStyle(s.category);
        const dt = s.datetime ? new Date(s.datetime) : null;
        const dtEnd = s.endDatetime ? new Date(s.endDatetime) : null;
        const isUpcoming = dt && dt > now && dt - now < 24*60*60*1000;
        const isPast = dt && dt < now;

        let timeStr = '';
        if (s.datetime) {
          // 선택된 일정 타임존 기준으로 표시
          timeStr = this._fmtSchedTime(s.datetime, true);
          if (s.endDatetime) {
            timeStr += ' ~ ' + this._fmtSchedTime(s.endDatetime, false);
          }
          timeStr += ` <span style="font-size:10px;color:#94a3b8">${this._fmtOffset(this._activeTzOffset())}</span>`;
        }

        const gcalBtn = this.state.googleCalTokens
          ? `<button data-sid="${sid}" onclick="MemoNest.addToGoogleCalendar(this.dataset.sid)" style="background:none;border:1px solid ${cs.border};border-radius:6px;padding:3px 7px;cursor:pointer;font-size:11px;color:${cs.tag}" title="Google Calendar에 추가"><i class="fas fa-calendar-plus"></i></button>`
          : '';
        const isMeeting = s.category === '회의';
        const hasMeetingNote = isMeeting && (this._meetingScheduleIds?.has(sid));
        const meetingNoteBtn = !isMeeting
          ? ''
          : hasMeetingNote
            ? `<span style="display:inline-flex;align-items:center;gap:3px;background:#dcfce7;color:#16a34a;border:1px solid #86efac;border-radius:6px;padding:3px 7px;font-size:11px;font-weight:600" title="회의록 등록 완료">
                <i class="fas fa-check-circle"></i> 회의록</span>`
            : `<button data-sid="${sid}" data-stitle="${s.title.replace(/"/g,'&quot;')}"
                onclick="MemoNest.showAddMeetingModal(this.dataset.sid, this.dataset.stitle)"
                style="background:none;border:1px solid ${cs.border};border-radius:6px;padding:3px 7px;cursor:pointer;font-size:11px;color:${cs.tag}"
                title="회의록 작성"><i class="fas fa-file-alt"></i></button>`;

        return `
        <div class="sch-card-anim" style="margin-bottom:8px;padding:10px 12px;border-radius:12px;
          background:${cs.bg};border:1px solid ${cs.border};
          opacity:${isPast?'0.6':'1'};transition:opacity 0.2s,transform 0.2s;cursor:default">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:${cs.dot};flex-shrink:0;display:inline-block"></span>
                <span style="font-size:14px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title}</span>
                ${isUpcoming ? '<span style="background:#fef3c7;color:#d97706;font-size:10px;padding:1px 6px;border-radius:10px;font-weight:700;flex-shrink:0">⏰D-day</span>' : ''}
              </div>
              ${timeStr ? `<div style="font-size:11px;color:#64748b;margin-bottom:4px"><i class="fas fa-clock" style="margin-right:3px"></i>${timeStr}</div>` : ''}
              <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
                ${s.category ? `<span style="font-size:10px;font-weight:700;color:${cs.tag};background:white;border:1px solid ${cs.border};padding:1px 8px;border-radius:10px">${s.category}</span>` : ''}
                ${s.location ? this._renderLocationBadge(s.location) : ''}
                ${s.reminder && s.reminder!=='없음' ? `<span style="font-size:10px;color:#d97706;background:#fef3c7;border-radius:10px;padding:1px 7px">🔔${s.reminder}</span>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:3px;flex-shrink:0;margin-left:6px">
              ${gcalBtn}${meetingNoteBtn}
              <button data-sid="${sid}" onclick="MemoNest.showEditScheduleById(this.dataset.sid)"
                style="background:none;border:1px solid ${cs.border};border-radius:6px;padding:3px 7px;cursor:pointer;font-size:11px;color:${cs.tag}" title="수정">
                <i class="fas fa-pen"></i></button>
              <button data-sid="${sid}" onclick="MemoNest.deleteSchedule(this.dataset.sid)"
                style="background:none;border:1px solid #fecaca;border-radius:6px;padding:3px 7px;cursor:pointer;font-size:11px;color:#ef4444" title="삭제">
                <i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>`;
      }).join('')}`;
  },

  // 캐시에서 꺼내서 수정 모달 열기 (특수문자 안전)
  showEditScheduleById(pageId) {
    const d = this._scheduleCache?.[pageId];
    if (!d) { this.toast('일정 데이터를 찾을 수 없어요. 새로고침 후 다시 시도해주세요.', 'error'); return; }
    this.showEditSchedule(pageId, d.title, d.datetime, d.location, d.category, d.reminder, d.memo, d.endDatetime);
  },

  showEditSchedule(pageId, title, datetimeRaw, location, category, reminder, memo, endDatetimeRaw) {
    // 시작 Date + 초기 소요시간(분) 산출
    const startDate = datetimeRaw ? new Date(datetimeRaw) : new Date();
    let durationMin = 60;
    if (datetimeRaw && endDatetimeRaw) {
      const diff = Math.round((new Date(endDatetimeRaw).getTime() - new Date(datetimeRaw).getTime())/60000);
      if (diff > 0) durationMin = diff;
    }
    this.showModal('✏️ 일정 수정', `
      <div class="form-group">
        <label class="form-label">일정 제목 *</label>
        <input class="form-input" id="edit-sch-title" value="${title}">
      </div>
      ${this._renderSchedTimeControls('edit-sch', startDate, durationMin)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-select" id="edit-sch-category">
            ${['회의','개인','이벤트','약속','기타'].map(c => `<option value="${c}" ${category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">알림</label>
          <select class="form-select" id="edit-sch-reminder">
            ${['없음','10분 전','1시간 전','1일 전'].map(r => `<option value="${r}" ${reminder===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">📍 장소</label>
        <input class="form-input" id="edit-sch-location" placeholder="강남역 스타벅스 (선택)"
          oninput="MemoNest.onLocationInput('edit-sch-location')">
        <div id="edit-sch-location-hint" style="margin-top:4px;min-height:16px"></div>
      </div>
      <div class="form-group">
        <label class="form-label">🌐 비대면 링크</label>
        <input class="form-input" id="edit-sch-online-link" placeholder="Zoom·Meet·Teams URL (선택)"
          oninput="MemoNest.onLocationInput('edit-sch-online-link')">
        <div id="edit-sch-online-link-hint" style="margin-top:4px;min-height:16px"></div>
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="edit-sch-memo" style="min-height:60px">${memo}</textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveEditSchedule('${pageId}')">
        <i class="fas fa-save"></i> 수정 저장
      </button>`, null);
    // 시작/종료/소요시간 양방향 연동 배선
    this._wireSchedTime('edit-sch');
    // 기존 location 파싱 → 각 필드에 채우기 + hint 표시
    if (location) {
      const { place, link } = this._parseLocation(location);
      setTimeout(() => {
        const locEl = document.getElementById('edit-sch-location');
        const linkEl = document.getElementById('edit-sch-online-link');
        if (locEl && place) { locEl.value = place; this.onLocationInput('edit-sch-location'); }
        if (linkEl && link) { linkEl.value = link; this.onLocationInput('edit-sch-online-link'); }
        // place가 URL인 구버전 데이터 호환: place 자리에 링크만 있던 경우
        if (locEl && !place && this._isUrl(location.trim())) {
          locEl.value = '';
          if (linkEl) { linkEl.value = location.trim(); this.onLocationInput('edit-sch-online-link'); }
        }
      }, 50);
    }
  },

  async saveEditSchedule(pageId) {
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...'; btn.disabled = true; }
    const tzOff = this._readTz('edit-sch');
    const datetimeISO    = this._dateToISO(this._readStartDate('edit-sch'), tzOff);
    const endDatetimeISO = this._dateToISO(this._readEndDate('edit-sch'), tzOff);
    try {
      await fetch(`/api/schedules/${pageId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('edit-sch-title')?.value,
          datetime: datetimeISO,
          endDatetime: endDatetimeISO || null,
          location: this._serializeLocation(
            document.getElementById('edit-sch-location')?.value || '',
            document.getElementById('edit-sch-online-link')?.value || ''
          ),
          category: document.getElementById('edit-sch-category')?.value,
          reminder: document.getElementById('edit-sch-reminder')?.value,
          memo: document.getElementById('edit-sch-memo')?.value || '',
        })
      });
      document.getElementById('app-modal')?.remove();
      this.toast('✅ 일정이 수정됐어요!', 'success');
      this.loadSchedules();
    } catch(e) { this.toast('수정 실패', 'error'); }
  },

  async deleteSchedule(pageId) {
    this.showModal('🗑️ 일정 삭제', '이 일정을 삭제할까요?', async () => {
      try {
        await fetch(`/api/schedules/${pageId}`, { method: 'DELETE' });
        document.getElementById('app-modal')?.remove();
        this.toast('🗑️ 삭제됐어요', 'success');
        this.loadSchedules();
      } catch (e) { this.toast('삭제 실패', 'error'); }
    });
  },

  // ── 현재 로컬 시간 → datetime-local 값 변환 ────────────────────────────────
  getLocalDatetimeStr(date = new Date()) {
    // 브라우저 로컬 시간 기준 YYYY-MM-DDTHH:MM
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 타임존(GMT 오프셋) 관리
  // - 단말 위치(브라우저) 기반 자동 감지가 기본값
  // - 일정 전체화면에서 선택 → state.tzOffset(분) 저장(localStorage)
  // - 일정 등록/수정 시 그 값이 기본값으로 적용, 개별 변경 가능
  // ══════════════════════════════════════════════════════════════════════════

  // 단말(브라우저) 위치 기반 오프셋(분). 예: 한국 +540
  _deviceTzOffset() {
    return -new Date().getTimezoneOffset();
  },

  // 현재 적용 중인 오프셋(분). state 값이 없으면 단말값.
  _activeTzOffset() {
    return (this.state.tzOffset === null || this.state.tzOffset === undefined)
      ? this._deviceTzOffset()
      : this.state.tzOffset;
  },

  // 분 오프셋 → "GMT+09:00" 형식
  _fmtOffset(min) {
    const sign = min >= 0 ? '+' : '-';
    const abs = Math.abs(min);
    const h = Math.floor(abs / 60), m = abs % 60;
    return `GMT${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  },

  // 선택 가능한 오프셋 목록(분). 주요 타임존 위주 (GMT-12 ~ GMT+14, 일부 30/45분).
  _tzOffsetOptions: [
    -720, -660, -600, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60,
    0, 60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 525, 540, 570, 600, 660, 720, 780, 840,
  ],

  // 대표 도시 라벨 (선택 UI 가독성용)
  _tzLabel(min) {
    const named = {
      '-480': '미국 서부(LA)', '-420': '미국 산악', '-360': '미국 중부', '-300': '미국 동부(NY)',
      '0': '런던(UTC)', '60': '파리/베를린', '180': '모스크바',
      '480': '베이징/홍콩', '540': '서울/도쿄', '570': '애들레이드', '600': '시드니',
      '330': '인도', '345': '네팔',
    };
    const base = this._fmtOffset(min);
    return named[String(min)] ? `${base} · ${named[String(min)]}` : base;
  },

  // GMT select 옵션 HTML
  _tzSelectOptions(selectedMin) {
    // 목록에 없는 값(단말 특수 오프셋)도 포함되도록 보정
    const opts = this._tzOffsetOptions.includes(selectedMin)
      ? this._tzOffsetOptions
      : [...this._tzOffsetOptions, selectedMin].sort((a,b)=>a-b);
    return opts.map(m => `<option value="${m}" ${m===selectedMin?'selected':''}>${this._tzLabel(m)}</option>`).join('');
  },

  // 일정 전체화면에서 타임존 변경 → 저장 + 리스트/캘린더 갱신
  setScheduleTz(minStr) {
    const min = parseInt(minStr, 10);
    if (Number.isNaN(min)) return;
    this.state.tzOffset = min;
    this.save('tzOffset', min);
    this.toast(`타임존을 ${this._fmtOffset(min)}(으)로 변경했어요`, 'info');
    // 표시 갱신 (선택 타임존 기준으로 리스트/캘린더 재렌더)
    this._renderCalendar();
    this._renderScheduleList();
  },

  // 일정 상단 타임존 선택 바 HTML
  _renderTzBar() {
    const active = this._activeTzOffset();
    const isAuto = (this.state.tzOffset === null || this.state.tzOffset === undefined);
    return `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px">
      <span style="font-size:13px">🌐</span>
      <span style="font-size:12px;color:#64748b;white-space:nowrap">일정 타임존</span>
      <select class="form-select" id="sched-tz-select" onchange="MemoNest.setScheduleTz(this.value)"
        style="flex:1;min-width:0;padding:6px 8px;font-size:12px">
        ${this._tzSelectOptions(active)}
      </select>
      ${isAuto ? `<span style="font-size:10px;color:#94a3b8;white-space:nowrap">📍 단말 위치 자동</span>` : ''}
    </div>`;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // WEB PUSH 알림 (Android / 데스크톱 / iOS 공통)
  // - Android·데스크톱: 브라우저에서 바로 동작
  // - iOS(16.4+): "홈 화면에 추가"(PWA 설치) 후에만 동작 → 안내 배너 표시
  // ══════════════════════════════════════════════════════════════════════════

  // iOS Safari 여부
  _isIOS() {
    return /iP(hone|ad|od)/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },
  // PWA(홈화면 추가)로 실행 중인지
  _isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  },
  // 웹푸시 지원 환경 여부
  _pushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  // VAPID 공개키(base64url) → Uint8Array
  _urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  },

  // 알림 켜기: 권한 요청 → 구독 → 서버 저장
  async enableNotifications() {
    if (!this._pushSupported()) {
      this.toast('이 브라우저는 웹푸시를 지원하지 않아요.', 'error'); return;
    }
    // iOS 는 홈화면 추가(PWA) 필요
    if (this._isIOS() && !this._isStandalone()) {
      this.showModal('📲 아이폰 알림 설정', `
        <div style="font-size:13px;line-height:1.7;color:#374151">
          아이폰(iOS)에서는 알림을 받으려면 <b>홈 화면에 추가</b>해야 해요.<br><br>
          1. Safari 하단 <b>공유</b> 버튼 <i class="fas fa-arrow-up-from-bracket"></i> 탭<br>
          2. <b>"홈 화면에 추가"</b> 선택<br>
          3. 홈 화면의 <b>MemoNest 아이콘</b>으로 다시 실행<br>
          4. 그 화면에서 다시 <b>알림 켜기</b>
        </div>`, null);
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { this.toast('알림 권한이 거부됐어요.', 'error'); return; }

      const reg = await navigator.serviceWorker.ready;
      // VAPID 공개키 수신
      const vres = await fetch('/api/push/vapid-public');
      const vdata = await vres.json();
      if (!vdata.publicKey) { this.toast('서버 알림 설정(VAPID)이 아직 안 됐어요.', 'error'); return; }

      // 기존 구독 재사용 or 신규
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this._urlB64ToUint8Array(vdata.publicKey),
        });
      }

      // 서버 저장 (parentPageId 는 setup 때 저장한 루트 페이지)
      const res = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPageId: this.load('parentPageId', ''),
          subscription: sub.toJSON(),
          scheduleDbId: this.state.dbIds.schedule || '',
          userAgent: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      this.state.pushEnabled = true;
      this.state.pushDbId = data.pushDbId || null;
      this.save('pushEnabled', true);
      this.save('pushDbId', this.state.pushDbId);
      // 서버가 역추적한 루트 페이지를 저장해두면 다음부터 빠름
      if (data.parentPageId) this.save('parentPageId', data.parentPageId);

      this.toast('🔔 알림을 켰어요! 테스트 알림을 보냈어요.', 'success', 4000);
      // 테스트 발송
      fetch('/api/push/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      }).catch(() => {});

      if (this.state.currentModule === 'schedule') this._renderPushBar?.();
      this.render();
    } catch (e) {
      this.toast('알림 설정 실패: ' + e.message, 'error');
    }
  },

  // 알림 끄기
  async disableNotifications() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pushDbId: this.state.pushDbId, endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
    } catch (_) {}
    this.state.pushEnabled = false;
    this.save('pushEnabled', false);
    this.toast('알림을 껐어요.', 'info');
    this.render();
  },

  // 일정 화면 알림 배너
  _renderPushBanner() {
    if (!this._pushSupported()) return '';
    const on = this.state.pushEnabled;
    const iosNeedInstall = this._isIOS() && !this._isStandalone();
    return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:${on?'#f0fdf4':'#fafafa'};border:1px solid ${on?'#bbf7d0':'#e5e7eb'};border-radius:12px;margin-bottom:10px">
      <span style="font-size:18px">🔔</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:${on?'#16a34a':'#374151'}">
          일정 알림 ${on ? '켜짐' : '꺼짐'}
        </div>
        <div style="font-size:11px;color:#6b7280">
          ${iosNeedInstall
            ? '아이폰은 홈 화면에 추가 후 사용할 수 있어요'
            : '일정 시작 전(알림 설정 기준)에 폰·PC로 알려드려요'}
        </div>
      </div>
      ${on
        ? `<button onclick="MemoNest.disableNotifications()" style="white-space:nowrap;background:none;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;color:#6b7280;cursor:pointer">알림 끄기</button>`
        : `<button onclick="MemoNest.enableNotifications()" style="white-space:nowrap;background:var(--primary);color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer">알림 켜기</button>`}
    </div>`;
  },

  // ── 적용 타임존 기준 GMT 문자열 (모달 라벨용) ─────────────────────────────
  getGMTOffsetStr() {
    return this._fmtOffset(this._activeTzOffset());
  },

  // ── 타임존 이름 반환 ──────────────────────────────────────────────────────
  getTimezoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch { return ''; }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 일정 시간 컨트롤 (날짜 + 시 + 10분단위 분 + 소요시간, 시작/종료/소요 양방향 연동)
  // Outlook 스타일: 분은 10분 단위, 시작 이후로 종료 자동, 소요시간과 상호 연동
  // ══════════════════════════════════════════════════════════════════════════

  // 소요시간 옵션(분). 라벨은 시간/분 혼합 표기
  _durationOptions: [10, 20, 30, 40, 50, 60, 90, 120, 150, 180, 240, 300, 360, 480, 600, 720, 1440],

  _fmtDuration(min) {
    if (min < 60) return `${min}분`;
    if (min % 60 === 0) return `${min/60}시간`;
    return `${Math.floor(min/60)}시간 ${min%60}분`;
  },

  // Date → { date:'YYYY-MM-DD', hour:0-23, min:0-50(10단위) }
  _splitDateParts(d) {
    const pad = n => String(n).padStart(2,'0');
    const min10 = Math.round(d.getMinutes()/10)*10; // 10분 단위 반올림
    let hour = d.getHours();
    let dd = new Date(d);
    if (min10 === 60) { // 반올림으로 60이 되면 다음 시간 00분
      dd.setHours(dd.getHours()+1); hour = dd.getHours();
    }
    const minute = min10 === 60 ? 0 : min10;
    return {
      date: `${dd.getFullYear()}-${pad(dd.getMonth()+1)}-${pad(dd.getDate())}`,
      hour,
      min: minute,
    };
  },

  // 시/분 select 옵션 HTML
  _hourOptions(sel) {
    let h = '';
    for (let i=0;i<24;i++) h += `<option value="${i}" ${i===sel?'selected':''}>${String(i).padStart(2,'0')}시</option>`;
    return h;
  },
  _minuteOptions(sel) {
    let h = '';
    for (let m=0;m<60;m+=10) h += `<option value="${m}" ${m===sel?'selected':''}>${String(m).padStart(2,'0')}분</option>`;
    return h;
  },

  // 시간 컨트롤 HTML 생성 (prefix로 add/edit 구분: 'sch' | 'edit-sch')
  // startDate: Date(시작), durationMin: 초기 소요(분)
  _renderSchedTimeControls(prefix, startDate, durationMin) {
    const s = this._splitDateParts(startDate);
    const dur = durationMin || 60;
    const durSelected = this._durationOptions.includes(dur) ? dur : 60;
    const durOpts = this._durationOptions
      .map(m => `<option value="${m}" ${m===durSelected?'selected':''}>${this._fmtDuration(m)}</option>`)
      .join('');
    const endDate = new Date(startDate.getTime() + durSelected*60000);
    const e = this._splitDateParts(endDate);
    // 모달의 기본 타임존 = 일정 전체화면에 설정된(또는 단말 자동) 값
    const activeTz = this._activeTzOffset();

    const selStyle = 'padding:8px 6px';
    return `
    <div class="form-group">
      <label class="form-label">🌐 타임존 <span style="font-size:11px;color:var(--text-muted)">(기본값: 일정 화면 설정)</span></label>
      <select class="form-select" id="${prefix}-tz" style="${selStyle}">${this._tzSelectOptions(activeTz)}</select>
    </div>
    <div class="form-group">
      <label class="form-label">시작 시간</label>
      <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:6px">
        <input class="form-input" type="date" id="${prefix}-start-date" value="${s.date}" style="${selStyle}">
        <select class="form-select" id="${prefix}-start-hour" style="${selStyle}">${this._hourOptions(s.hour)}</select>
        <select class="form-select" id="${prefix}-start-min" style="${selStyle}">${this._minuteOptions(s.min)}</select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">소요 시간</label>
      <select class="form-select" id="${prefix}-duration">${durOpts}</select>
    </div>
    <div class="form-group">
      <label class="form-label">종료 시간 <span style="font-size:11px;color:var(--text-muted)">(시작·소요와 자동 연동)</span></label>
      <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:6px">
        <input class="form-input" type="date" id="${prefix}-end-date" value="${e.date}" style="${selStyle}">
        <select class="form-select" id="${prefix}-end-hour" style="${selStyle}">${this._hourOptions(e.hour)}</select>
        <select class="form-select" id="${prefix}-end-min" style="${selStyle}">${this._minuteOptions(e.min)}</select>
      </div>
    </div>`;
  },

  // 모달에서 선택된 타임존 오프셋(분). 없으면 활성 타임존.
  _readTz(prefix) {
    const v = document.getElementById(`${prefix}-tz`)?.value;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? this._activeTzOffset() : n;
  },

  // 세 그룹(시작/소요/종료) 값 읽어 Date 객체로
  _readStartDate(prefix) {
    const d = document.getElementById(`${prefix}-start-date`)?.value;
    const h = parseInt(document.getElementById(`${prefix}-start-hour`)?.value || '0', 10);
    const m = parseInt(document.getElementById(`${prefix}-start-min`)?.value || '0', 10);
    if (!d) return null;
    const [y, mo, day] = d.split('-').map(Number);
    return new Date(y, mo-1, day, h, m, 0, 0);
  },
  _readEndDate(prefix) {
    const d = document.getElementById(`${prefix}-end-date`)?.value;
    const h = parseInt(document.getElementById(`${prefix}-end-hour`)?.value || '0', 10);
    const m = parseInt(document.getElementById(`${prefix}-end-min`)?.value || '0', 10);
    if (!d) return null;
    const [y, mo, day] = d.split('-').map(Number);
    return new Date(y, mo-1, day, h, m, 0, 0);
  },
  _setDateParts(prefix, which, dt) {
    const p = this._splitDateParts(dt);
    const dEl = document.getElementById(`${prefix}-${which}-date`);
    const hEl = document.getElementById(`${prefix}-${which}-hour`);
    const mEl = document.getElementById(`${prefix}-${which}-min`);
    if (dEl) dEl.value = p.date;
    if (hEl) hEl.value = String(p.hour);
    if (mEl) mEl.value = String(p.min);
  },

  // 시작/소요/종료 3자 양방향 연동 이벤트 배선
  _wireSchedTime(prefix) {
    const ids = {
      start: [`${prefix}-start-date`, `${prefix}-start-hour`, `${prefix}-start-min`],
      end:   [`${prefix}-end-date`, `${prefix}-end-hour`, `${prefix}-end-min`],
      dur:   `${prefix}-duration`,
    };
    // 시작 or 소요 변경 → 종료 재계산
    const recalcEndFromStartDur = () => {
      const start = this._readStartDate(prefix);
      const dur = parseInt(document.getElementById(ids.dur)?.value || '60', 10);
      if (!start) return;
      this._setDateParts(prefix, 'end', new Date(start.getTime() + dur*60000));
    };
    // 종료 변경 → 소요 재계산 (음수면 시작을 종료-현재소요로 당김)
    const recalcDurFromStartEnd = () => {
      const start = this._readStartDate(prefix);
      const end = this._readEndDate(prefix);
      if (!start || !end) return;
      let diff = Math.round((end.getTime() - start.getTime())/60000);
      if (diff <= 0) {
        // 종료가 시작보다 이르면: 시작을 종료 - (기존 소요)로 이동
        const dur = parseInt(document.getElementById(ids.dur)?.value || '60', 10);
        this._setDateParts(prefix, 'start', new Date(end.getTime() - dur*60000));
        return;
      }
      const durEl = document.getElementById(ids.dur);
      if (durEl) {
        // 정확히 매칭되는 옵션 없으면 가장 가까운 옵션 선택
        if (this._durationOptions.includes(diff)) durEl.value = String(diff);
        else {
          const nearest = this._durationOptions.reduce((a,b)=>Math.abs(b-diff)<Math.abs(a-diff)?b:a);
          durEl.value = String(nearest);
          // 옵션이 실제 diff와 다르면 종료를 옵션에 맞춰 재정렬
          this._setDateParts(prefix, 'end', new Date(start.getTime() + nearest*60000));
        }
      }
    };
    ids.start.forEach(id => document.getElementById(id)?.addEventListener('change', recalcEndFromStartDur));
    document.getElementById(ids.dur)?.addEventListener('change', recalcEndFromStartDur);
    ids.end.forEach(id => document.getElementById(id)?.addEventListener('change', recalcDurFromStartEnd));
  },

  // 절대시각 ISO 문자열을 "선택 타임존" 기준 벽시계 Date로 변환 (표시용)
  // toLocaleString은 브라우저 tz로 표시하므로, 선택 tz를 반영하려면 오프셋만큼 시프트한
  // Date를 만들어 getUTC* 로 읽는다.
  _instantInTz(iso, offsetMin) {
    if (!iso) return null;
    const off = (offsetMin === undefined || offsetMin === null) ? this._activeTzOffset() : offsetMin;
    const utcMs = new Date(iso).getTime();
    return new Date(utcMs + off * 60000); // 이 Date의 getUTC* 가 선택 tz 벽시계값
  },

  // 선택 타임존 기준 날짜/시간 라벨
  _fmtSchedTime(iso, withDate = true) {
    const d = this._instantInTz(iso);
    if (!d) return '';
    const pad = n => String(n).padStart(2,'0');
    const wk = ['일','월','화','수','목','금','토'][d.getUTCDay()];
    const hm = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    if (!withDate) return hm;
    return `${d.getUTCMonth()+1}월 ${d.getUTCDate()}일(${wk}) ${hm}`;
  },

  // 벽시계 Date + 선택 타임존 오프셋(분) → ISO 8601
  // dt의 연/월/일/시/분(사용자가 select로 고른 벽시계 값)을 그대로 쓰고,
  // 오프셋만 선택 타임존(offsetMin)으로 붙인다. (device 오프셋 아님)
  _dateToISO(dt, offsetMin) {
    if (!dt) return null;
    const pad = n => String(n).padStart(2,'0');
    const offset = (offsetMin === undefined || offsetMin === null) ? this._activeTzOffset() : offsetMin;
    const sign = offset >= 0 ? '+' : '-';
    const oh = Math.floor(Math.abs(offset)/60), om = Math.abs(offset)%60;
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00${sign}${pad(oh)}:${pad(om)}`;
  },

  showAddSchedule() {
    const now = new Date();
    const tzName = this.getTimezoneName();

    this.showModal('📅 일정 추가', `
      <div class="form-group">
        <label class="form-label">일정 제목 *</label>
        <input class="form-input" id="sch-title" placeholder="일정 제목">
      </div>
      ${this._renderSchedTimeControls('sch', now, 60)}
      <div style="font-size:11px;color:var(--text-muted);margin-top:-4px;margin-bottom:10px">
        ⏰ 단말 로컬 시간(${tzName}) 기준 저장 · 분은 10분 단위
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-select" id="sch-category">
            <option>회의</option><option>개인</option>
            <option>이벤트</option><option>약속</option><option>기타</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">알림</label>
          <select class="form-select" id="sch-reminder">
            <option>없음</option><option>10분 전</option>
            <option>1시간 전</option><option>1일 전</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">📍 장소</label>
        <input class="form-input" id="sch-location" placeholder="강남역 스타벅스 (선택)"
          oninput="MemoNest.onLocationInput('sch-location')">
        <div id="sch-location-hint" style="margin-top:4px;min-height:16px"></div>
      </div>
      <div class="form-group">
        <label class="form-label">🌐 비대면 링크</label>
        <input class="form-input" id="sch-online-link" placeholder="Zoom·Meet·Teams URL (선택)"
          oninput="MemoNest.onLocationInput('sch-online-link')">
        <div id="sch-online-link-hint" style="margin-top:4px;min-height:16px"></div>
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="sch-memo" placeholder="추가 메모" style="min-height:60px"></textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveSchedule()">
        <i class="fas fa-save"></i> 저장하기
      </button>`);
    // 시작/종료/소요시간 양방향 연동 배선
    this._wireSchedTime('sch');
  },

  async saveSchedule() {
    const title = document.getElementById('sch-title')?.value?.trim();
    if (!title) { this.toast('제목을 입력해주세요', 'error'); return; }
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...'; btn.disabled = true; }

    const startDate = this._readStartDate('sch');
    const endDate   = this._readEndDate('sch');
    const tzOff = this._readTz('sch');
    const datetimeISO    = this._dateToISO(startDate, tzOff);
    const endDatetimeISO = this._dateToISO(endDate, tzOff);

    try {
      await fetch('/api/schedules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.schedule, title,
          datetime: datetimeISO,
          endDatetime: endDatetimeISO || null,
          location: this._serializeLocation(
            document.getElementById('sch-location')?.value || '',
            document.getElementById('sch-online-link')?.value || ''
          ),
          category: document.getElementById('sch-category')?.value,
          reminder: document.getElementById('sch-reminder')?.value,
          memo: document.getElementById('sch-memo')?.value,
        })
      });
      document.getElementById('app-modal')?.remove();
      this.toast('📅 일정이 노션에 저장됐어요!', 'success');
      this.loadSchedules();
    } catch (e) { this.toast('저장 실패', 'error'); }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VOICE INPUT (공통)
  // ══════════════════════════════════════════════════════════════════════════
  async startVoiceInput(targetId) {
    // STT 비활성화 확인
    if (!this.state.sttSettings.enabled) {
      this.toast('STT가 비활성화되어 있어요. 설정에서 켜주세요.', 'info'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Firefox는 audio/webm;codecs=opus 미지원이므로 fallback 처리
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus'
          : '';
      }
      const mrOptions = mimeType ? { mimeType } : {};
      const mr = new MediaRecorder(stream, mrOptions);
      const chunks = [];
      mr.ondataavailable = e => e.data.size > 0 && chunks.push(e.data);

      const btn = document.querySelector(`[onclick*="startVoiceInput('${targetId}')"]`);
      if (btn) {
        btn.innerHTML = `<i class="fas fa-stop"></i> 중지`;
        btn.style.background = '#ef4444';
        btn.style.color = 'white';
        btn.setAttribute('title', `최대 ${this.state.sttSettings.autoStop}초`);
      }

      mr.start(100);

      // 자동 중지 타이머
      const autoStopMs = (this.state.sttSettings.autoStop || 10) * 1000;
      let autoTimer = setTimeout(() => stopRec(), autoStopMs);

      const stopRec = async () => {
        clearTimeout(autoTimer);
        if (mr.state !== 'inactive') mr.stop();
        stream.getTracks().forEach(t => t.stop());
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 변환 중...'; btn.disabled = true; }
        await new Promise(r => setTimeout(r, 400));
        const actualMime = mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: actualMime });
        if (blob.size < 1000) {
          if (btn) { btn.innerHTML = '<i class="fas fa-microphone"></i> 음성 입력'; btn.style.background = ''; btn.style.color = ''; btn.disabled = false; }
          this.toast('녹음이 너무 짧아요. 다시 시도해주세요.', 'info'); return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1];
          try {
            const res = await fetch('/api/stt', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType: actualMime, language: this.state.sttSettings.language })
            });
            const data = await res.json();
            const target = document.getElementById(targetId);
            if (target && data.text) {
              target.value = (target.value ? target.value + '\n' : '') + data.text;
              // textarea 자동 높이 조정
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            } else if (!data.text) {
              this.toast('인식된 음성이 없어요. 다시 말해주세요.', 'info');
            }
            if (btn) { btn.innerHTML = '<i class="fas fa-microphone"></i> 음성 입력'; btn.style.background = ''; btn.style.color = ''; btn.disabled = false; btn.setAttribute('title',''); }
            if (data.text) this.toast('🎙️ 음성 변환 완료!', 'success');
          } catch (e) {
            if (btn) { btn.innerHTML = '<i class="fas fa-microphone"></i> 음성 입력'; btn.style.background = ''; btn.style.color = ''; btn.disabled = false; }
            this.toast('STT 변환 실패: ' + (e.message || '서버 오류'), 'error');
          }
        };
        reader.readAsDataURL(blob);
      };

      if (btn) {
        btn.onclick = stopRec;
      } else {
        // 버튼이 없으면 자동 중지만
      }
    } catch (e) {
      if (e.name === 'NotAllowedError') this.toast('마이크 권한을 허용해주세요', 'error');
      else if (e.name === 'NotFoundError') this.toast('마이크 장치를 찾을 수 없어요', 'error');
      else this.toast('마이크 오류: ' + e.message, 'error');
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SETTINGS (설정창)
  // ══════════════════════════════════════════════════════════════════════════
  showSettings() {
    const s = this.state.sttSettings;
    const userBlock = this.state.currentUser ? `
      <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:10px">👤 로그인 정보</div>
        <div style="display:flex;align-items:center;gap:10px">
          ${this.state.currentUser.avatar ? `<img src="${this.state.currentUser.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" alt="">` : `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:15px;font-weight:700">${(this.state.currentUser.name||this.state.currentUser.email||'?')[0].toUpperCase()}</div>`}
          <div>
            <div style="font-size:14px;font-weight:600">${this.state.currentUser.name || '이름 없음'}</div>
            <div style="font-size:12px;color:#64748b">${this.state.currentUser.email || ''}</div>
          </div>
          <span style="margin-left:auto;background:#dcfce7;color:#16a34a;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600">🔒 Genspark 인증됨</span>
        </div>
      </div>` : `
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:12px;padding:12px;margin-bottom:16px;font-size:13px;color:#92400e">
        ⚠️ 로컬 개발 환경 — 배포 후 Genspark 인증이 활성화됩니다
      </div>`;

    this.showModal('⚙️ 설정', `
      ${userBlock}

      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">🎙️ STT (음성→텍스트) 설정</div>
      
      <div style="background:#f8fafc;border-radius:12px;padding:14px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div>
            <div style="font-size:13px;font-weight:600">STT 기능 사용</div>
            <div style="font-size:11px;color:#64748b">Groq Whisper API 기반</div>
          </div>
          <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
            <input type="checkbox" id="stt-enabled" ${s.enabled ? 'checked' : ''} style="opacity:0;width:0;height:0">
            <span id="stt-toggle" onclick="MemoNest.toggleSTTSetting()" style="position:absolute;top:0;left:0;right:0;bottom:0;background:${s.enabled ? '#6366f1' : '#e2e8f0'};border-radius:24px;transition:0.3s">
              <span style="position:absolute;width:18px;height:18px;background:white;border-radius:50%;top:3px;left:${s.enabled ? '23px' : '3px'};transition:0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></span>
            </span>
          </label>
        </div>
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">인식 언어</label>
          <select class="form-select" id="stt-lang">
            <option value="ko" ${s.language==='ko'?'selected':''}>한국어</option>
            <option value="en" ${s.language==='en'?'selected':''}>English</option>
            <option value="ja" ${s.language==='ja'?'selected':''}>日本語</option>
            <option value="zh" ${s.language==='zh'?'selected':''}>中文</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" id="stt-autostop-label">자동 중지 (초) <span style="color:#94a3b8">${s.autoStop}초</span></label>
          <input type="range" id="stt-autostop" min="5" max="60" value="${s.autoStop}" 
            oninput="const sp=document.querySelector('#stt-autostop-label span');if(sp)sp.textContent=this.value+'초';"
            style="width:100%;accent-color:#6366f1">
        </div>
      </div>

      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">🎤 마이크 환경별 안내</div>
      <div style="background:#f8fafc;border-radius:12px;padding:14px;margin-bottom:14px">
        <div style="display:grid;gap:10px">
          <div style="padding:10px;background:white;border-radius:8px;border:1px solid #e2e8f0">
            <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">💻 PC (Chrome/Edge)</div>
            <div style="font-size:12px;color:#475569">브라우저 주소창 옆 마이크 아이콘 → 허용<br>내장/외장 마이크 모두 자동 감지</div>
          </div>
          <div style="padding:10px;background:white;border-radius:8px;border:1px solid #e2e8f0">
            <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">📱 모바일 (iOS Safari/Android Chrome)</div>
            <div style="font-size:12px;color:#475569">사이트 접근 시 마이크 권한 팝업 → 허용<br>iOS: HTTPS 필수 / Android: Chrome 권장<br>이어폰 마이크도 자동 사용됨</div>
          </div>
          <div style="padding:10px;background:#fef3c7;border-radius:8px;border:1px solid #fde68a">
            <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">⚠️ 주의사항</div>
            <div style="font-size:12px;color:#92400e">Firefox는 audio/webm 미지원으로 STT 오류 가능<br>마이크 권한 거부 시 브라우저 설정에서 재허용 필요<br>녹음 중 탭 전환 시 자동 중지될 수 있음</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-block" style="margin-top:10px" onclick="MemoNest.testMicPermission()">
          <i class="fas fa-microphone"></i> 마이크 권한 테스트
        </button>
      </div>

      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">📒 노션 연결</div>
      <div style="background:#f8fafc;border-radius:12px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;color:#475569;margin-bottom:8px">현재 연결된 노션 DB 수: <strong>${Object.keys(this.state.dbIds).length}/7</strong></div>
        <button class="btn btn-secondary btn-block" onclick="MemoNest.resetSetup();document.getElementById('app-modal').remove()">
          <i class="fas fa-redo"></i> 노션 DB 재연결
        </button>
      </div>

      <button class="btn btn-primary btn-block" onclick="MemoNest.saveSettings()">
        <i class="fas fa-save"></i> 설정 저장
      </button>`);
  },

  toggleSTTSetting() {
    const cb = document.getElementById('stt-enabled');
    if (cb) cb.checked = !cb.checked;
    const toggle = document.getElementById('stt-toggle');
    if (toggle) {
      const checked = document.getElementById('stt-enabled')?.checked;
      toggle.style.background = checked ? '#6366f1' : '#e2e8f0';
      const thumb = toggle.querySelector('span');
      if (thumb) thumb.style.left = checked ? '23px' : '3px';
    }
  },

  saveSettings() {
    const enabled = document.getElementById('stt-enabled')?.checked ?? true;
    const language = document.getElementById('stt-lang')?.value || 'ko';
    const autoStop = parseInt(document.getElementById('stt-autostop')?.value || '10');
    this.state.sttSettings = { enabled, language, autoStop };
    this.save('sttSettings', this.state.sttSettings);
    document.getElementById('app-modal')?.remove();
    this.toast('✅ 설정이 저장되었어요', 'success');
  },

  async testMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      this.toast('✅ 마이크 권한이 허용되어 있어요!', 'success');
    } catch (e) {
      if (e.name === 'NotAllowedError') this.toast('❌ 마이크 권한이 거부되어 있어요. 브라우저 설정에서 허용해주세요.', 'error', 5000);
      else if (e.name === 'NotFoundError') this.toast('❌ 마이크 장치를 찾을 수 없어요', 'error');
      else this.toast(`마이크 오류: ${e.message}`, 'error');
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHANGELOG (개발 로그)
  // ══════════════════════════════════════════════════════════════════════════
  showChangelog() {
    const logHtml = this.CHANGELOG.map(entry => `
      <div style="margin-bottom:16px;padding:14px;background:#f8fafc;border-radius:12px;border-left:3px solid var(--primary)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:13px;font-weight:700;color:var(--primary)">v${entry.ver}</span>
          <span style="font-size:11px;color:#94a3b8;background:white;padding:2px 8px;border-radius:20px;border:1px solid #e2e8f0">${entry.date}</span>
        </div>
        <ul style="margin:0;padding-left:16px;font-size:12px;color:#475569;line-height:1.8">
          ${entry.changes.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>`).join('');

    this.showModal(`📋 개발 로그 — MemoNest v${this.VERSION}`, `
      <div style="max-height:60vh;overflow-y:auto;padding-right:4px">
        ${logHtml}
        <div style="margin-top:12px;padding:12px;background:rgba(99,102,241,0.06);border-radius:10px;font-size:12px;color:#64748b;text-align:center">
          <strong>MemoNest</strong> — Notion 연동 스마트 메모앱<br>
          Hono + Cloudflare Pages · Gemini 1.5 Flash · Groq Whisper<br>
          <span style="color:var(--primary)">v${this.VERSION}</span>
        </div>
      </div>`);
  },

  // ── Tag Helper ─────────────────────────────────────────────────────────────
  addTag(event, hiddenId) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const input = event.target;
    const tag = input.value.trim();
    if (!tag) return;
    const hiddenEl = document.getElementById(hiddenId);
    const tags = JSON.parse(hiddenEl?.value || '[]');
    if (tags.includes(tag)) { input.value = ''; return; }
    tags.push(tag);
    if (hiddenEl) hiddenEl.value = JSON.stringify(tags);
    const container = document.getElementById(`${hiddenId}-container`);
    if (container) {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-item';
      tagEl.innerHTML = `${tag}<button onclick="MemoNest.removeTag('${hiddenId}', '${tag}', this)">✕</button>`;
      container.insertBefore(tagEl, input);
    }
    input.value = '';
  },

  removeTag(hiddenId, tag, btn) {
    const hiddenEl = document.getElementById(hiddenId);
    const tags = JSON.parse(hiddenEl?.value || '[]').filter(t => t !== tag);
    if (hiddenEl) hiddenEl.value = JSON.stringify(tags);
    btn.parentElement?.remove();
  },
};

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  MemoNest.init();
  // 창 크기 변경 시 레이아웃 전환
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => MemoNest.render(), 200);
  });
});
