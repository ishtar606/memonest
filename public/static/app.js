// MemoNest - Main Application
// ═══════════════════════════════════════════════════════════════════════════════

const MemoNest = {
  // ── State ──────────────────────────────────────────────────────────────────
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
    this.render();
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

  // ── Render ─────────────────────────────────────────────────────────────────
  render() {
    const app = document.getElementById('app');
    if (!this.state.isSetupDone) {
      app.innerHTML = this.renderSetup();
      return;
    }
    app.innerHTML = `
      ${this.renderHeader()}
      <main class="main-content" id="main-content">
        ${this.renderModule(this.state.currentModule)}
      </main>
      ${this.renderBottomNav()}`;
    this.attachFAB();
    this.afterRender(this.state.currentModule);
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
        <button class="btn btn-primary btn-block" id="setup-init-btn" onclick="MemoNest.initNotion()">
          <i class="fas fa-magic"></i> 노션 DB 자동 생성 시작
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
        <button class="header-btn" onclick="MemoNest.openNotionLink()" title="노션에서 보기">
          <i class="fas fa-external-link-alt"></i>
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
    this.render();
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
      <div style="margin-top:16px">
        <button onclick="MemoNest.resetSetup();document.getElementById('app-modal').remove()"
          style="width:100%;padding:12px;border-radius:10px;border:1px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-size:13px">
          ⚙️ 설정 초기화
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

    return `
    <div class="dashboard-greeting">
      <h2>${greeting}</h2>
      <p>${dateStr}</p>
    </div>
    <div class="module-grid">
      ${[
        { id:'todo', icon:'📋', name:'ToDo', desc:'할 일 관리' },
        { id:'schedule', icon:'📅', name:'일정', desc:'스케줄' },
        { id:'meeting', icon:'🎙️', name:'회의록', desc:'STT+AI' },
        { id:'shopping', icon:'🛒', name:'장보기', desc:'AI 추천' },
        { id:'idea', icon:'💡', name:'아이디어', desc:'AI 정리' },
        { id:'novel', icon:'📖', name:'소설', desc:'시나리오' },
        { id:'diary', icon:'📔', name:'일기', desc:'오늘의 기록' },
        { id:'settings', icon:'⚙️', name:'설정', desc:'노션 연결' },
      ].map(m => `
        <div class="module-card" onclick="${m.id === 'settings' ? 'MemoNest.showMoreMenu()' : `MemoNest.navigate('${m.id}')`}">
          <span class="icon">${m.icon}</span>
          <div class="name">${m.name}</div>
          <div class="count">${m.desc}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">🪺 MemoNest 소개</div>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.6">
        모든 메모는 <strong>노션에 자동으로 저장</strong>됩니다.<br>
        음성 녹음 → STT → AI 구조화까지 한번에! 🤖
      </p>
    </div>`;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TODO
  // ══════════════════════════════════════════════════════════════════════════
  renderTodo() {
    return `
    <div id="todo-filter" style="display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px">
      <button class="diary-tab active" onclick="MemoNest.filterTodos('all', this)">전체</button>
      <button class="diary-tab" onclick="MemoNest.filterTodos('미완료', this)">미완료</button>
      <button class="diary-tab" onclick="MemoNest.filterTodos('진행중', this)">진행중</button>
      <button class="diary-tab" onclick="MemoNest.filterTodos('완료', this)">완료</button>
    </div>
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
          </div>
        </div>
      </div>`;
    }).join('');
  },

  filterTodos(filter, btn) {
    document.querySelectorAll('#todo-filter .diary-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = filter === 'all' ? this.state.todos
      : this.state.todos.filter(t => t.properties['상태']?.select?.name === filter);
    this.renderTodoList(filtered);
  },

  async toggleTodo(pageId, newStatus) {
    try {
      await fetch(`/api/todos/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      this.toast(newStatus === '완료' ? '✅ 완료!', 'success');
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
    return `
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
        const datetime = props['날짜/시간']?.date?.start || '';
        const location = props['장소']?.rich_text?.[0]?.text?.content || '';
        const category = props['카테고리']?.select?.name || '';
        return `
        <div class="card">
          <div style="font-size:15px;font-weight:600;margin-bottom:6px">📅 ${title}</div>
          <div style="font-size:12px;color:#64748b;display:flex;gap:10px;flex-wrap:wrap">
            ${datetime ? `<span><i class="fas fa-clock"></i> ${datetime}</span>` : ''}
            ${location ? `<span><i class="fas fa-map-marker-alt"></i> ${location}</span>` : ''}
            ${category ? `<span class="tag">${category}</span>` : ''}
          </div>
        </div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">로드 실패</p>'; }
  },

  showAddSchedule() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16);
    this.showModal('📅 일정 추가', `
      <div class="form-group">
        <label class="form-label">일정 제목 *</label>
        <input class="form-input" id="sch-title" placeholder="일정 제목">
      </div>
      <div class="form-group">
        <label class="form-label">날짜/시간</label>
        <input class="form-input" type="datetime-local" id="sch-datetime" value="${dateStr}">
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
    try {
      await fetch('/api/schedules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbId: this.state.dbIds.schedule, title,
          datetime: document.getElementById('sch-datetime')?.value,
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: BlobPart[] = [];
      mr.ondataavailable = e => chunks.push(e.data);

      const btn = document.querySelector(`[onclick*="startVoiceInput('${targetId}')"]`) as HTMLButtonElement;
      if (btn) { btn.innerHTML = '<i class="fas fa-stop"></i> 중지'; btn.style.background = '#ef4444'; btn.style.color = 'white'; }

      mr.start(100);

      const stopRec = async () => {
        mr.stop();
        stream.getTracks().forEach(t => t.stop());
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 변환 중...'; }
        await new Promise(r => setTimeout(r, 500));
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/stt', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' })
            });
            const data = await res.json();
            const target = document.getElementById(targetId) as HTMLInputElement | HTMLTextAreaElement;
            if (target && data.text) {
              target.value = (target.value ? target.value + '\n' : '') + data.text;
            }
            if (btn) { btn.innerHTML = '<i class="fas fa-microphone"></i> 음성 입력'; btn.style.background = ''; btn.style.color = ''; }
            this.toast('🎙️ 음성 변환 완료!', 'success');
          } catch (e) {
            if (btn) { btn.innerHTML = '<i class="fas fa-microphone"></i> 음성 입력'; btn.style.background = ''; btn.style.color = ''; }
            this.toast('STT 변환 실패', 'error');
          }
        };
        reader.readAsDataURL(blob);
      };

      if (btn) {
        btn.onclick = stopRec;
      } else {
        setTimeout(stopRec, 5000);
      }
    } catch (e) { this.toast('마이크 권한이 필요합니다', 'error'); }
  },

  // ── Tag Helper ─────────────────────────────────────────────────────────────
  addTag(event: KeyboardEvent, hiddenId: string) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const tag = input.value.trim();
    if (!tag) return;
    const hiddenEl = document.getElementById(hiddenId) as HTMLInputElement;
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

  removeTag(hiddenId: string, tag: string, btn: HTMLButtonElement) {
    const hiddenEl = document.getElementById(hiddenId) as HTMLInputElement;
    const tags = JSON.parse(hiddenEl?.value || '[]').filter((t: string) => t !== tag);
    if (hiddenEl) hiddenEl.value = JSON.stringify(tags);
    btn.parentElement?.remove();
  },
};

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => MemoNest.init());
