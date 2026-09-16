// MemoNest - Main Application
// ═══════════════════════════════════════════════════════════════════════════════

const MemoNest = {
  // ── State ──────────────────────────────────────────────────────────────────
  // ── 앱 버전/개발 로그 ─────────────────────────────────────────────────────
  VERSION: '1.4.4',
  CHANGELOG: [
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
    // Genspark 사용자 정보 로드 (배포 환경)
    await this.loadCurrentUser();
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
      meeting: () => {},
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
      meeting: { icon: 'fa-microphone', action: () => this.navigate('meeting') },
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
      case 'todo': this.loadTodos(); break;
      case 'schedule': this.loadSchedules(); break;
      case 'meeting': this.loadMeetings(); break;
      case 'shopping': this.loadShopping(); break;
      case 'idea': this.loadIdeas(); break;
      case 'novel': this.loadNovels(); break;
      case 'diary': this.loadDiary(); break;
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
      <div style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px">빠른 실행</div>
      <div class="pc-module-grid">
        ${modules.map(m => `
          <div class="module-card" onclick="${m.id === 'settings' ? 'MemoNest.showMoreMenu()' : `MemoNest.navigate('${m.id}')`}">
            <span class="icon">${m.icon}</span>
            <div class="name">${m.name}</div>
            <div class="count">${m.desc}</div>
          </div>`).join('')}
      </div>
      <div class="card" style="margin-top:8px">
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
        <span style="margin-left:auto">Hono · Cloudflare Pages · Notion API</span>
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
    try {
      const res = await fetch(`/api/todos?dbId=${dbId}`);
      const data = await res.json();
      this.state.todos = data.results || [];
      this.renderTodoList(this.state.todos);
    } catch (e) {
      document.getElementById('todo-list').innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>';
    }
  },

  renderTodoList(todos) {
    const el = document.getElementById('todo-list');
    if (!el) return;
    if (!todos.length) {
      el.innerHTML = `<div class="empty-state"><span class="emoji">📋</span><p>할 일이 없어요!<br>+ 버튼으로 추가해보세요</p></div>`; return;
    }
    el.innerHTML = todos.map(todo => {
      const props = todo.properties;
      const title = props['할 일']?.title?.[0]?.text?.content || '제목 없음';
      const status = props['상태']?.select?.name || '미완료';
      const priority = props['우선순위']?.select?.name || '';
      const dueDate = props['Due Date']?.date?.start;
      const tags = props['태그']?.multi_select || [];
      const isDone = status === '완료';
      const isOverdue = dueDate && new Date(dueDate) < new Date() && !isDone;
      const priorityClass = priority.includes('높음') ? 'priority-high' : priority.includes('낮음') ? 'priority-low' : 'priority-mid';

      return `
      <div class="todo-item ${isDone ? 'done' : ''}">
        <div class="todo-checkbox ${isDone ? 'checked' : ''}"
          onclick="MemoNest.toggleTodo('${todo.id}', '${isDone ? '미완료' : '완료'}')">
          ${isDone ? '<i class="fas fa-check" style="font-size:12px"></i>' : ''}
        </div>
        <div class="todo-content">
          <div class="todo-title">${title}</div>
          <div class="todo-meta">
            ${priority ? `<span class="priority-badge ${priorityClass}">${priority}</span>` : ''}
            ${dueDate ? `<span class="todo-due ${isOverdue ? 'overdue' : ''}">
              <i class="fas fa-calendar"></i> ${dueDate}${isOverdue ? ' ⚠️' : ''}
            </span>` : ''}
            <span class="status-badge ${status === '완료' ? 'status-done' : status === '진행중' ? 'status-doing' : status === '보류' ? 'status-hold' : 'status-todo'}">${status}</span>
            ${tags.map(t => `<span class="tag" style="font-size:10px;padding:2px 7px">#${t.name}</span>`).join('')}
          </div>
        </div>
      </div>`;
    }).join('');
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
          const isDone = status === '완료';
          return `<div class="todo-item ${isDone ? 'done' : ''}">
            <div class="todo-checkbox ${isDone ? 'checked' : ''}" onclick="MemoNest.toggleTodo('${todo.id}', '${isDone ? '미완료' : '완료'}')">
              ${isDone ? '<i class="fas fa-check" style="font-size:12px"></i>' : ''}
            </div>
            <div class="todo-content"><div class="todo-title">${title}</div>
              <span class="status-badge ${isDone ? 'status-done' : 'status-todo'}">${status}</span>
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
      this.toast(newStatus === '완료' ? '✅ 완료!' : '↩️ 미완료로 변경', 'success');
      this.loadTodos();
    } catch (e) { this.toast('업데이트 실패', 'error'); }
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
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveTodo()">
        <i class="fas fa-save"></i> 저장하기
      </button>`);
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
  renderMeeting() {
    return `
    <div class="card" style="margin-bottom:12px">
      <div class="card-title" style="margin-bottom:16px">🎙️ 새 회의록 작성</div>

      <div class="form-group">
        <label class="form-label">고객사 / 프로젝트명</label>
        <input class="form-input" id="meeting-client" placeholder="예: 삼성전자, Project Alpha">
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="meeting-date" value="${new Date().toISOString().split('T')[0]}">
      </div>

      <div class="form-group">
        <label class="form-label">🎙️ 음성 녹음</label>
        <div style="text-align:center;padding:20px;background:#f8fafc;border-radius:14px;border:1.5px dashed #e2e8f0">
          <div class="waveform" id="waveform" style="display:none;justify-content:center;margin-bottom:12px">
            ${Array(7).fill('<div class="wave-bar"></div>').join('')}
          </div>
          <div class="record-timer" id="record-timer" style="display:none">0:00</div>
          <button class="record-btn" id="record-btn" onclick="MemoNest.toggleRecording('meeting')">
            <i class="fas fa-microphone" id="record-icon"></i>
          </button>
          <p style="font-size:12px;color:#94a3b8;margin-top:10px" id="record-hint">버튼을 눌러 녹음 시작</p>
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
        <textarea class="form-textarea" id="meeting-notes" placeholder="회의 중 메모한 내용을 입력하세요&#10;음성 녹취와 합쳐서 AI가 회의록을 정리합니다"></textarea>
      </div>

      <button class="btn btn-primary btn-block" onclick="MemoNest.saveMeeting()">
        <i class="fas fa-magic"></i> AI 회의록 생성 & 노션 저장
      </button>
    </div>

    <div class="section-title">최근 회의록</div>
    <div id="meeting-list"><div class="loading"><div class="spinner"></div></div></div>`;
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
      this.state.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
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
    const blob = new Blob(this.state.audioChunks, { type: 'audio/webm' });

    // Base64 변환
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch('/api/stt', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' })
        });
        const data = await res.json();
        if (data.text) {
          const sttResult = document.getElementById('stt-result');
          const sttText = document.getElementById('stt-text');
          if (sttResult) sttResult.style.display = 'block';
          if (sttText) sttText.textContent = data.text;
          if (hint) hint.textContent = 'STT 변환 완료! 다시 녹음하려면 클릭';
          this.toast('🎙️ STT 변환 완료!', 'success');
        }
      } catch (e) { this.toast('STT 변환 실패', 'error'); if (hint) hint.textContent = '버튼을 눌러 녹음 시작'; }
    };
    reader.readAsDataURL(blob);
  },

  async saveMeeting() {
    const client = document.getElementById('meeting-client')?.value?.trim();
    const date = document.getElementById('meeting-date')?.value;
    const transcript = document.getElementById('stt-text')?.textContent || '';
    const manualNotes = document.getElementById('meeting-notes')?.value || '';

    if (!transcript && !manualNotes) {
      this.toast('녹음하거나 메모를 입력해주세요', 'error'); return;
    }
    const btn = document.querySelector('.btn-primary[onclick*="saveMeeting"]');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI 처리 중...'; btn.disabled = true; }

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId: this.state.dbIds.meeting, transcript, manualNotes, date, client })
      });
      const data = await res.json();
      this.toast('🎉 회의록이 노션에 저장됐어요!', 'success');
      if (data.structured) {
        this.showModal('✅ 회의록 저장 완료', `
          <div class="ai-card">
            <div class="ai-label">📝 AI 요약</div>
            <div class="ai-content">${data.structured.summary || ''}</div>
          </div>
          ${data.structured.action_items?.length ? `
          <div style="margin-top:12px">
            <div class="section-title">✅ 액션 아이템</div>
            ${data.structured.action_items.map(i => `<div style="padding:6px 0;font-size:13px;border-bottom:1px solid #f1f5f9">• ${i}</div>`).join('')}
          </div>` : ''}
          <div style="margin-top:16px;text-align:center">
            <a href="https://notion.so" target="_blank" class="notion-link">
              <i class="fas fa-external-link-alt"></i> 노션에서 전체 회의록 보기
            </a>
          </div>`);
      }
      document.getElementById('meeting-notes').value = '';
      const sttEl = document.getElementById('stt-result');
      if (sttEl) sttEl.style.display = 'none';
      this.loadMeetings();
    } catch (e) {
      this.toast('저장 실패: ' + e.message, 'error');
      if (btn) { btn.innerHTML = '<i class="fas fa-magic"></i> AI 회의록 생성 & 노션 저장'; btn.disabled = false; }
    }
  },

  async loadMeetings() {
    const el = document.getElementById('meeting-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/meetings?dbId=${this.state.dbIds.meeting}`);
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">🎙️</span><p>아직 회의록이 없어요</p></div>'; return; }
      el.innerHTML = results.slice(0, 5).map(m => {
        const props = m.properties;
        const title = props['회의 제목']?.title?.[0]?.text?.content || '제목 없음';
        const date = props['날짜']?.date?.start || '';
        const client = props['고객사/프로젝트']?.rich_text?.[0]?.text?.content || '';
        return `<div class="card" style="cursor:pointer" onclick="window.open('https://notion.so/${m.id.replace(/-/g,'')}','_blank')">
          <div style="font-size:14px;font-weight:600">${title}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">${date} ${client ? `· ${client}` : ''}</div>
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
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
      await fetch('/api/diary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId: this.state.dbIds.diary, type, date, title: title || `${date} ${type}`, content, mood, weather, summary: title })
      });
      document.getElementById('app-modal')?.remove();
      this.toast('📔 일기가 노션에 저장됐어요!', 'success');
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
    return `
    <div id="shopping-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  async loadShopping() {
    const el = document.getElementById('shopping-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/shopping?dbId=${this.state.dbIds.shopping}`);
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">🛒</span><p>장보기 목록이 비어있어요!<br>+ 버튼으로 추가해보세요</p></div>'; return; }
      el.innerHTML = results.map(item => {
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
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
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
  // SCHEDULE
  // ══════════════════════════════════════════════════════════════════════════
  renderSchedule() {
    const gmtStr = this.getGMTOffsetStr();
    const tzName = this.getTimezoneName();
    return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:rgba(99,102,241,0.06);border-radius:12px;border:1px solid rgba(99,102,241,0.15)">
      <span style="font-size:16px">🌐</span>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--primary)">${gmtStr} 기준으로 표시 중</div>
        <div style="font-size:11px;color:var(--text-muted)">${tzName} · 현재 단말 시간대</div>
      </div>
    </div>
    <div id="schedule-list"><div class="loading"><div class="spinner"></div></div></div>`;
  },

  async loadSchedules() {
    const el = document.getElementById('schedule-list');
    if (!el) return;
    try {
      const res = await fetch(`/api/schedules?dbId=${this.state.dbIds.schedule}`);
      const data = await res.json();
      const results = data.results || [];
      if (!results.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">📅</span><p>일정이 없어요!<br>+ 버튼으로 추가해보세요</p></div>'; return; }
      el.innerHTML = results.map(s => {
        const props = s.properties;
        const title = props['일정 제목']?.title?.[0]?.text?.content || '제목 없음';
        const datetimeRaw = props['날짜/시간']?.date?.start || '';
        const location = props['장소']?.rich_text?.[0]?.text?.content || '';
        const category = props['카테고리']?.select?.name || '';
        const reminder = props['알림']?.select?.name || '';

        // 로컬 시간으로 포맷
        let datetimeDisplay = datetimeRaw;
        let isUpcoming = false;
        let isPast = false;
        if (datetimeRaw) {
          try {
            const dt = new Date(datetimeRaw);
            const now = new Date();
            isUpcoming = dt > now && dt - now < 24 * 60 * 60 * 1000;
            isPast = dt < now;
            datetimeDisplay = dt.toLocaleString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric',
              weekday: 'short', hour: '2-digit', minute: '2-digit',
              hour12: false
            });
          } catch(e) {}
        }

        const borderColor = isUpcoming ? '#f59e0b' : isPast ? '#e2e8f0' : '#e2e8f0';
        const badge = isUpcoming ? `<span style="background:#fef3c7;color:#d97706;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600">⏰ 오늘 예정</span>`
          : isPast ? `<span style="background:#f1f5f9;color:#94a3b8;font-size:11px;padding:2px 8px;border-radius:20px">지난 일정</span>` : '';

        return `
        <div class="card" style="border-color:${borderColor}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div style="font-size:15px;font-weight:600">📅 ${title}</div>
            ${badge}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            ${datetimeRaw ? `<span style="font-size:12px;color:#475569;display:flex;align-items:center;gap:4px"><i class="fas fa-clock" style="color:var(--primary)"></i> ${datetimeDisplay}</span>` : ''}
            ${location ? `<span style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px"><i class="fas fa-map-marker-alt"></i> ${location}</span>` : ''}
          </div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            ${category ? `<span class="tag">${category}</span>` : ''}
            ${reminder && reminder !== '없음' ? `<span class="tag" style="background:rgba(245,158,11,0.1);color:#d97706">🔔 ${reminder}</span>` : ''}
          </div>
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
  },

  // ── 현재 로컬 시간 → datetime-local 값 변환 ────────────────────────────────
  getLocalDatetimeStr(date = new Date()) {
    // 브라우저 로컬 시간 기준 YYYY-MM-DDTHH:MM
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  // ── 현재 단말 GMT 오프셋 문자열 반환 ──────────────────────────────────────
  getGMTOffsetStr() {
    const offset = -new Date().getTimezoneOffset(); // 분 단위
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `GMT${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  },

  // ── 타임존 이름 반환 ──────────────────────────────────────────────────────
  getTimezoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch { return ''; }
  },

  showAddSchedule() {
    const now = new Date();
    const localStr = this.getLocalDatetimeStr(now);
    const gmtStr = this.getGMTOffsetStr();
    const tzName = this.getTimezoneName();

    this.showModal('📅 일정 추가', `
      <div class="form-group">
        <label class="form-label">일정 제목 *</label>
        <input class="form-input" id="sch-title" placeholder="일정 제목">
      </div>
      <div class="form-group">
        <label class="form-label">
          날짜/시간
          <span style="font-size:11px;font-weight:400;color:var(--primary);margin-left:6px;background:rgba(99,102,241,0.1);padding:2px 8px;border-radius:20px">
            🌐 ${gmtStr} · ${tzName}
          </span>
        </label>
        <input class="form-input" type="datetime-local" id="sch-datetime" value="${localStr}">
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
          ⏰ 현재 단말 로컬 시간 기준으로 저장됩니다
        </div>
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
        <label class="form-label">장소</label>
        <input class="form-input" id="sch-location" placeholder="장소 (선택)">
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="sch-memo" placeholder="추가 메모" style="min-height:60px"></textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="MemoNest.saveSchedule()">
        <i class="fas fa-save"></i> 저장하기
      </button>`);
  },

  async saveSchedule() {
    const title = document.getElementById('sch-title')?.value?.trim();
    if (!title) { this.toast('제목을 입력해주세요', 'error'); return; }
    const btn = document.querySelector('#app-modal .btn-primary');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...'; btn.disabled = true; }

    // 로컬 시간 → ISO 8601 (타임존 오프셋 포함)
    const datetimeVal = document.getElementById('sch-datetime')?.value; // YYYY-MM-DDTHH:MM
    let datetimeISO = datetimeVal;
    if (datetimeVal) {
      const offset = -new Date().getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const h = Math.floor(Math.abs(offset) / 60);
      const m = Math.abs(offset) % 60;
      const tzStr = `${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      datetimeISO = `${datetimeVal}:00${tzStr}`; // 노션 API는 오프셋 포함 ISO 지원
    }

    try {
      await fetch('/api/schedules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.schedule, title,
          datetime: datetimeISO,
          location: document.getElementById('sch-location')?.value,
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
          <label class="form-label">자동 중지 (초) <span style="color:#94a3b8">${s.autoStop}초</span></label>
          <input type="range" id="stt-autostop" min="5" max="60" value="${s.autoStop}" 
            oninput="document.querySelector('[for=stt-autostop] span, label .form-label span')?.remove(); this.previousElementSibling.querySelector('span').textContent=this.value+'초'"
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
