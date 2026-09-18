import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  NOTION_API_KEY: string
  GEMINI_API_KEY: string
  GROQ_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  // 선택: 배포 도메인 명시 오버라이드 (없으면 요청 Origin 기반 자동 산출)
  APP_BASE_URL?: string
  // Web Push (VAPID) — 값은 Netlify 환경변수로만 주입, 코드 하드코딩 금지
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string   // 예: mailto:you@example.com
}

const app = new Hono<{ Bindings: Bindings }>()

// ─── 환경변수 주입 미들웨어 ────────────────────────────────────────────────
// Netlify Functions(Node)에서는 시크릿이 process.env로 들어온다.
// 기존 라우트 코드가 c.env.X 형태를 그대로 쓰도록, 값이 비어있으면 process.env로 보충.
// (Cloudflare 등 c.env가 이미 채워진 환경에서는 기존 값이 우선 유지된다.)
app.use('*', async (c, next) => {
  const penv: any = (typeof process !== 'undefined' && process.env) ? process.env : {}
  const keys: (keyof Bindings)[] = [
    'NOTION_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY',
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'APP_BASE_URL',
    'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT',
  ]
  for (const k of keys) {
    if (!(c.env as any)[k] && penv[k]) (c.env as any)[k] = penv[k]
  }
  await next()
})

// ─── Rate Limiter (in-memory, per Worker instance) ────────────────────────────
// Cloudflare Workers는 인스턴스별 메모리 — 분산 rate limit는 D1/KV 필요
// 현재는 Genspark Identity 인증으로 1인 사용자이므로 간단한 in-process 제한으로 충분
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }
  if (entry.count >= maxRequests) return false // blocked
  entry.count++
  return true
}

// ─── Helper: Get Genspark User from headers ────────────────────────────────────
function getGensparkUser(request: Request) {
  const decode = (v: string | null) => { try { return v ? decodeURIComponent(v) : null } catch { return v } }
  const id = decode(request.headers.get('X-Genspark-User-Id'))
  if (!id) return null
  return {
    id,
    email: decode(request.headers.get('X-Genspark-User-Email')),
    name: decode(request.headers.get('X-Genspark-User-Name')),
  }
}

app.use('*', cors())
// 정적 자산(/static/*, /, manifest 등)은 Netlify CDN이 직접 서빙한다.
// 이 Hono 앱은 /api/* 만 처리한다.

// ─── Rate Limit Middleware: AI/STT 엔드포인트 보호 ────────────────────────────
// Gemini: 분당 5회, 일 100회 제한 (무료 한도 훨씬 이내)
// Groq STT: 분당 3회 제한 (무료 25req/분 이내)
app.use('/api/ai/*', async (c, next) => {
  const user = getGensparkUser(c.req.raw)
  const key = `ai:${user?.id || c.req.header('CF-Connecting-IP') || 'unknown'}`
  if (!checkRateLimit(key, 5, 60_000)) {
    return c.json({ error: 'Rate limit exceeded. AI 기능은 분당 5회까지 사용 가능합니다.' }, 429)
  }
  await next()
})

app.use('/api/stt', async (c, next) => {
  const user = getGensparkUser(c.req.raw)
  const key = `stt:${user?.id || c.req.header('CF-Connecting-IP') || 'unknown'}`
  if (!checkRateLimit(key, 3, 60_000)) {
    return c.json({ error: 'Rate limit exceeded. STT는 분당 3회까지 사용 가능합니다.', text: '' }, 429)
  }
  await next()
})

// ─── Body Size Guard: 오디오 업로드 크기 제한 (5MB) ──────────────────────────
app.use('/api/stt', async (c, next) => {
  const contentLength = parseInt(c.req.header('Content-Length') || '0')
  if (contentLength > 5 * 1024 * 1024) {
    return c.json({ error: '오디오 파일이 너무 큽니다 (최대 5MB)', text: '' }, 413)
  }
  await next()
})

// ─── Notion API Helper ───────────────────────────────────────────────────────
async function notionRequest(apiKey: string, endpoint: string, method = 'GET', body?: any) {
  const res = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

// ─── Gemini API Helper ────────────────────────────────────────────────────────
// gemini-1.5-flash 는 deprecated(v1beta 404). 안정 버전을 우선 쓰고, 과부하(503)/쿼터(429)
// 시에는 짧은 백오프 재시도 + 대체 모델로 폴백한다.
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']

async function geminiRequest(apiKey: string, prompt: string): Promise<string> {
  if (!apiKey) {
    console.error('[Gemini] API Key is missing')
    return ''
  }
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  for (let m = 0; m < GEMINI_MODELS.length; m++) {
    const model = GEMINI_MODELS[m]
    // 각 모델당 과부하 시 최대 2회까지 재시도
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
            }),
            signal: controller.signal,
          }
        )
        clearTimeout(timeoutId)

        if (res.status === 503 || res.status === 429) {
          // 과부하/쿼터 → 백오프 후 재시도, 재시도 소진 시 다음 모델로
          console.warn(`[Gemini] ${model} ${res.status} (attempt ${attempt + 1})`)
          await sleep(600 * (attempt + 1))
          continue
        }
        if (!res.ok) {
          const errText = await res.text()
          console.error(`[Gemini] ${model} HTTP ${res.status}: ${errText.slice(0, 200)}`)
          break // 이 모델은 안 됨 → 다음 모델
        }
        const data: any = await res.json()
        if (data.error) {
          console.error('[Gemini] API error:', JSON.stringify(data.error).slice(0, 200))
          break
        }
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (txt) return txt
        break // 빈 응답이면 다음 모델 시도
      } catch (e: any) {
        if (e?.name === 'AbortError') console.error(`[Gemini] ${model} timeout`)
        else console.error(`[Gemini] ${model} fetch error:`, e?.message)
        await sleep(400)
      }
    }
  }
  return ''
}

// ─── Groq STT Helper ─────────────────────────────────────────────────────────
async function groqSTT(apiKey: string, audioBase64: string, mimeType: string, language = 'ko') {
  if (!apiKey) throw new Error('GROQ_API_KEY가 설정되지 않았습니다')
  // Groq Whisper API
  const binaryStr = atob(audioBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  if (bytes.length < 1024) {
    // 사실상 빈/무음 녹음 (Groq가 거부하거나 빈 결과 반환)
    throw new Error('녹음이 너무 짧거나 비어 있어요 (마이크 입력을 확인해주세요)')
  }
  const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
  const blob = new Blob([bytes], { type: mimeType })
  const formData = new FormData()
  formData.append('file', blob, `audio.${ext}`)
  formData.append('model', 'whisper-large-v3')
  formData.append('language', language)
  formData.append('response_format', 'json')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  })
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    const msg = data?.error?.message || `Groq STT 오류 (HTTP ${res.status})`
    console.error('[Groq STT]', msg)
    throw new Error(msg)
  }
  return data.text || ''
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Notion DB 초기화 (기존 DB 감지 후 재사용) ───────────────────────────────
app.post('/api/notion/init', async (c) => {
  const { parentPageId } = await c.req.json()
  const apiKey = c.env.NOTION_API_KEY

  // 1단계: 루트 페이지의 기존 자식 DB 목록 조회
  const childrenRes = await notionRequest(apiKey, `/blocks/${parentPageId}/children?page_size=100`)
  const existingDBs: Record<string, string> = {}

  const dbTitleMap: Record<string, string> = {
    '📋 ToDo Manager':      'todo',
    '📅 Schedule Manager':  'schedule',
    '🎙️ Meeting Notes':     'meeting',
    '🛒 Shopping List':     'shopping',
    '💡 Idea Memo':         'idea',
    '📖 Novel Memo':        'novel',
    '📔 Diary':             'diary',
  }

  if (childrenRes.results) {
    for (const block of childrenRes.results) {
      if (block.type === 'child_database') {
        const dbTitle = block.child_database?.title || ''
        const key = dbTitleMap[dbTitle]
        if (key && !existingDBs[key]) {
          // 첫 번째 매칭 DB만 사용 (이중생성 방지: 가장 오래된 것 우선)
          existingDBs[key] = block.id.replace(/-/g, '')
        }
      }
    }
  }

  const databases: Record<string, any> = {}
  const DB_KEYS = ['todo','schedule','meeting','shopping','idea','novel','diary']

  // 2단계: 이미 존재하는 DB는 재사용, 없는 것만 생성
  const missing = DB_KEYS.filter(k => !existingDBs[k])

  // 기존 DB ID 복사
  for (const k of DB_KEYS) {
    if (existingDBs[k]) databases[k] = existingDBs[k]
  }

  if (missing.length === 0) {
    // 모든 DB 이미 존재 → 그냥 반환
    return c.json({ success: true, databases, reused: true, message: '기존 DB를 재사용합니다' })
  }

  // 3단계: 없는 DB만 생성
  if (missing.includes('todo')) {
    const todoDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '📋' },
      title: [{ type: 'text', text: { content: '📋 ToDo Manager' } }],
      properties: {
        '할 일': { title: {} },
        '상태': { select: { options: [
          { name: '미완료', color: 'red' },
          { name: '진행중', color: 'yellow' },
          { name: '완료', color: 'green' },
          { name: '보류', color: 'gray' }
        ]}},
        '우선순위': { select: { options: [
          { name: '높음 🔴', color: 'red' },
          { name: '중간 🟡', color: 'yellow' },
          { name: '낮음 🟢', color: 'green' }
        ]}},
        'Due Date': { date: {} },
        '태그': { multi_select: { options: [] } },
        '반복': { select: { options: [
          { name: '없음', color: 'default' },
          { name: '매일', color: 'blue' },
          { name: '매주', color: 'purple' },
          { name: '매월', color: 'pink' }
        ]}},
        '메모': { rich_text: {} },
        '생성일': { created_time: {} },
      }
    })
    databases.todo = todoDB.id
  }

  if (missing.includes('schedule')) {
    const scheduleDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '📅' },
      title: [{ type: 'text', text: { content: '📅 Schedule Manager' } }],
      properties: {
        '일정 제목': { title: {} },
        '날짜/시간': { date: {} },
        '장소': { rich_text: {} },
        '카테고리': { select: { options: [
          { name: '회의', color: 'blue' },
          { name: '개인', color: 'green' },
          { name: '이벤트', color: 'pink' },
          { name: '약속', color: 'orange' },
          { name: '기타', color: 'gray' }
        ]}},
        '알림': { select: { options: [
          { name: '없음', color: 'default' },
          { name: '10분 전', color: 'blue' },
          { name: '1시간 전', color: 'yellow' },
          { name: '1일 전', color: 'red' }
        ]}},
        '메모': { rich_text: {} },
        '생성일': { created_time: {} },
      }
    })
    databases.schedule = scheduleDB.id
  }

  if (missing.includes('meeting')) {
    const meetingDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '🎙️' },
      title: [{ type: 'text', text: { content: '🎙️ Meeting Notes' } }],
      properties: {
        '회의 제목': { title: {} },
        '날짜': { date: {} },
        '고객사/프로젝트': { rich_text: {} },
        '참석자': { rich_text: {} },
        '태그': { multi_select: { options: [] } },
        '요약': { rich_text: {} },
        '액션 아이템': { rich_text: {} },
        '일정 ID': { rich_text: {} },   // 연동된 일정 페이지 ID
        '생성일': { created_time: {} },
      }
    })
    databases.meeting = meetingDB.id
  }

  if (missing.includes('shopping')) {
    const shoppingDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '🛒' },
      title: [{ type: 'text', text: { content: '🛒 Shopping List' } }],
      properties: {
        '아이템': { title: {} },
        '수량': { rich_text: {} },
        '구매처 추천': { rich_text: {} },
        '국가': { select: { options: [
          { name: '🇺🇸 미국', color: 'blue' },
          { name: '🇰🇷 한국', color: 'red' },
          { name: '🌐 온라인', color: 'purple' }
        ]}},
        '카테고리': { select: { options: [
          { name: '식품', color: 'green' },
          { name: '생활용품', color: 'yellow' },
          { name: '가전', color: 'blue' },
          { name: '의류', color: 'pink' },
          { name: '기타', color: 'gray' }
        ]}},
        '구매완료': { checkbox: {} },
        '태그': { multi_select: { options: [] } },
        '생성일': { created_time: {} },
      }
    })
    databases.shopping = shoppingDB.id
  }

  if (missing.includes('idea')) {
    const ideaDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '💡' },
      title: [{ type: 'text', text: { content: '💡 Idea Memo' } }],
      properties: {
        '아이디어 제목': { title: {} },
        '카테고리': { select: { options: [
          { name: '비즈니스', color: 'blue' },
          { name: '기술', color: 'green' },
          { name: '라이프', color: 'yellow' },
          { name: '창작', color: 'pink' },
          { name: '기타', color: 'gray' }
        ]}},
        '핵심 내용': { rich_text: {} },
        '태그': { multi_select: { options: [] } },
        '실현 가능성': { select: { options: [
          { name: '높음', color: 'green' },
          { name: '중간', color: 'yellow' },
          { name: '낮음', color: 'red' },
          { name: '미평가', color: 'gray' }
        ]}},
        '생성일': { created_time: {} },
      }
    })
    databases.idea = ideaDB.id
  }

  if (missing.includes('novel')) {
    const novelDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '📖' },
      title: [{ type: 'text', text: { content: '📖 Novel Memo' } }],
      properties: {
        '작품명': { title: {} },
        '장르': { select: { options: [
          { name: '로맨스', color: 'pink' },
          { name: '미스터리', color: 'purple' },
          { name: 'SF', color: 'blue' },
          { name: '판타지', color: 'green' },
          { name: '현대물', color: 'yellow' },
          { name: '기타', color: 'gray' }
        ]}},
        '배경': { rich_text: {} },
        '주인공': { rich_text: {} },
        '핵심 소재': { rich_text: {} },
        '진행 상태': { select: { options: [
          { name: '아이디어', color: 'gray' },
          { name: '기획중', color: 'yellow' },
          { name: '집필중', color: 'blue' },
          { name: '완성', color: 'green' }
        ]}},
        '태그': { multi_select: { options: [] } },
        '생성일': { created_time: {} },
      }
    })
    databases.novel = novelDB.id
  }

  if (missing.includes('diary')) {
    const diaryDB = await notionRequest(apiKey, '/databases', 'POST', {
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '📔' },
      title: [{ type: 'text', text: { content: '📔 Diary' } }],
      properties: {
        '제목': { title: {} },
        '날짜': { date: {} },
        '일기 종류': { select: { options: [
          { name: '나의 일기', color: 'blue' },
          { name: '🐶 크림이 일기', color: 'yellow' },
          { name: '👶 대붕이 출산일기', color: 'pink' }
        ]}},
        '무드': { select: { options: [
          { name: '😊 행복', color: 'yellow' },
          { name: '😐 보통', color: 'gray' },
          { name: '😢 슬픔', color: 'blue' },
          { name: '😡 화남', color: 'red' },
          { name: '😴 피곤', color: 'purple' }
        ]}},
        '날씨': { select: { options: [
          { name: '☀️ 맑음', color: 'yellow' },
          { name: '⛅ 흐림', color: 'gray' },
          { name: '🌧️ 비', color: 'blue' },
          { name: '❄️ 눈', color: 'default' }
        ]}},
        '한줄 요약': { rich_text: {} },
        '태그': { multi_select: { options: [] } },
        '생성일': { created_time: {} },
      }
    })
    databases.diary = diaryDB.id
  }

  return c.json({ success: true, databases, reused: false, message: `${missing.length}개 DB 생성됨` })
})

// ─── Notion DB 복원 API (기존 DB ID 자동 탐색 + 빈 중복 DB 자동 정리) ──────────
app.post('/api/notion/recover', async (c) => {
  const { parentPageId } = await c.req.json()
  const apiKey = c.env.NOTION_API_KEY

  const childrenRes = await notionRequest(apiKey, `/blocks/${parentPageId}/children?page_size=100`)
  if (!childrenRes.results) return c.json({ error: '페이지 조회 실패' }, 500)

  const dbTitleMap: Record<string, string> = {
    '📋 ToDo Manager':      'todo',
    '📅 Schedule Manager':  'schedule',
    '🎙️ Meeting Notes':     'meeting',
    '🛒 Shopping List':     'shopping',
    '💡 Idea Memo':         'idea',
    '📖 Novel Memo':        'novel',
    '📔 Diary':             'diary',
  }

  // 1단계: 전체 child_database 수집
  const allFound: Array<{key:string, id:string, title:string, created:string}> = []
  for (const block of childrenRes.results) {
    if (block.type === 'child_database') {
      const dbTitle = block.child_database?.title || ''
      const key = dbTitleMap[dbTitle]
      if (key) {
        allFound.push({ key, id: block.id.replace(/-/g,''), title: dbTitle, created: block.created_time || '' })
      }
    }
  }

  // 2단계: created_time 오름차순 정렬 → 가장 오래된(원본) DB가 앞으로
  allFound.sort((a, b) => a.created.localeCompare(b.created))

  // 3단계: key별로 그룹화
  const grouped: Record<string, Array<{key:string, id:string, title:string, created:string}>> = {}
  for (const item of allFound) {
    if (!grouped[item.key]) grouped[item.key] = []
    grouped[item.key].push(item)
  }

  // 4단계: 중복이 있는 key에 대해 — 원본 제외 나머지의 records 수 확인 후 0건이면 삭제
  const databases: Record<string, string> = {}
  const selectedInfo: Array<{key:string, id:string, title:string, created:string}> = []
  const deleted: Array<{key:string, id:string, title:string, reason:string}> = []
  const skipped: Array<{key:string, id:string, title:string, reason:string}> = []

  for (const key of Object.keys(grouped)) {
    const items = grouped[key]
    // 가장 오래된 것 = 원본 (index 0)
    databases[key] = items[0].id
    selectedInfo.push(items[0])

    // 중복이 있을 때만 나머지 검사
    if (items.length > 1) {
      for (const dup of items.slice(1)) {
        try {
          // records 수 조회 (page_size=1로 최소 요청)
          const queryRes = await notionRequest(apiKey, `/databases/${dup.id}/query`, 'POST', { page_size: 1 })
          const recordCount = queryRes.results?.length ?? 0
          const hasMore = queryRes.has_more ?? false
          const isEmpty = recordCount === 0 && !hasMore

          if (isEmpty) {
            // 빈 중복 DB → Notion 아카이브(삭제)
            await notionRequest(apiKey, `/blocks/${dup.id}`, 'DELETE')
            deleted.push({ key, id: dup.id, title: dup.title, reason: '빈 중복 DB 자동 삭제' })
          } else {
            // 데이터 있는 중복 → 건드리지 않음
            skipped.push({ key, id: dup.id, title: dup.title, reason: `데이터 ${recordCount}건 이상 있어 보존` })
          }
        } catch (_) {
          // 삭제 실패해도 복원은 계속 진행
          skipped.push({ key, id: dup.id, title: dup.title, reason: '삭제 시도 실패 (건너뜀)' })
        }
      }
    }
  }

  const found = Object.keys(databases).length
  return c.json({
    success: true,
    databases,
    found,
    allFound,
    selectedInfo,
    deleted,
    skipped,
    message: `${found}개 DB 복원됨 | 중복 삭제: ${deleted.length}개 | 보존: ${skipped.length}개`
  })
})


// ─── ToDo API ────────────────────────────────────────────────────────────────
app.get('/api/todos', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)

  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ property: 'Due Date', direction: 'ascending' }]
  })
  return c.json(data)
})

app.post('/api/todos', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const { dbId, title, dueDate, priority, tags, memo, repeat } = await c.req.json()

  const properties: any = {
    '할 일': { title: [{ text: { content: title } }] },
    '상태': { select: { name: '미완료' } },
    '우선순위': { select: { name: priority || '중간 🟡' } },
  }
  if (dueDate) properties['Due Date'] = { date: { start: dueDate } }
  if (tags?.length) properties['태그'] = { multi_select: tags.map((t: string) => ({ name: t })) }
  if (memo) properties['메모'] = { rich_text: [{ text: { content: memo } }] }
  if (repeat) properties['반복'] = { select: { name: repeat } }

  const data = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties
  })
  return c.json(data)
})

app.patch('/api/todos/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const body = await c.req.json()

  const properties: any = {}
  if (body.status) properties['상태'] = { select: { name: body.status } }
  if (body.title) properties['할 일'] = { title: [{ text: { content: body.title } }] }
  if (body.priority) properties['우선순위'] = { select: { name: body.priority } }
  if (body.dueDate !== undefined) properties['Due Date'] = body.dueDate ? { date: { start: body.dueDate } } : { date: null }
  if (body.memo !== undefined) properties['메모'] = { rich_text: body.memo ? [{ text: { content: body.memo } }] : [] }

  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { properties })
  return c.json(data)
})

// ToDo 삭제 (Notion 아카이브)
app.delete('/api/todos/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { archived: true })
  return c.json(data)
})

// ─── Diary API ───────────────────────────────────────────────────────────────
app.get('/api/diary', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  const type = c.req.query('type')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)

  const filter = type ? {
    filter: { property: '일기 종류', select: { equals: type } }
  } : {}

  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ property: '날짜', direction: 'descending' }],
    ...filter
  })
  return c.json(data)
})

app.post('/api/diary', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const { dbId, type, date, title, content, mood, weather, summary, tags } = await c.req.json()

  const properties: any = {
    '제목': { title: [{ text: { content: title || `${date} 일기` } }] },
    '날짜': { date: { start: date } },
    '일기 종류': { select: { name: type } },
  }
  if (mood) properties['무드'] = { select: { name: mood } }
  if (weather) properties['날씨'] = { select: { name: weather } }
  if (summary) properties['한줄 요약'] = { rich_text: [{ text: { content: summary } }] }
  if (tags?.length) properties['태그'] = { multi_select: tags.map((t: string) => ({ name: t })) }

  const page = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties,
    children: content ? [{
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content } }] }
    }] : []
  })
  return c.json(page)
})

// ─── Idea Memo API ────────────────────────────────────────────────────────────
app.post('/api/ideas', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const geminiKey = c.env.GEMINI_API_KEY
  const { dbId, rawText, category, tags } = await c.req.json()

  // AI 구조화
  const structured = await geminiRequest(geminiKey,
    `다음 아이디어 메모를 구조화해서 JSON으로 반환해줘.
아이디어: "${rawText}"

반환 형식 (JSON만, 다른 텍스트 없이):
{
  "title": "아이디어 핵심 제목 (15자 이내)",
  "core": "핵심 아이디어 한줄 요약",
  "details": "상세 내용 정리 (2-3문장)",
  "potential": "실현 가능성 평가 (높음/중간/낮음)",
  "tags": ["태그1", "태그2", "태그3"]
}`
  )

  let parsed: any = {}
  try {
    const jsonMatch = structured.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    parsed = { title: rawText.slice(0, 15), core: rawText, details: rawText, potential: '미평가', tags: [] }
  }

  const properties: any = {
    '아이디어 제목': { title: [{ text: { content: parsed.title || rawText.slice(0, 50) } }] },
    '카테고리': { select: { name: category || '기타' } },
    '핵심 내용': { rich_text: [{ text: { content: parsed.core || rawText } }] },
    '실현 가능성': { select: { name: parsed.potential === '높음' ? '높음' : parsed.potential === '중간' ? '중간' : parsed.potential === '낮음' ? '낮음' : '미평가' } },
  }

  const allTags = [...(tags || []), ...(parsed.tags || [])]
  if (allTags.length) properties['태그'] = { multi_select: allTags.map((t: string) => ({ name: t })) }

  const page = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties,
    children: [{
      object: 'block', type: 'heading_2',
      heading_2: { rich_text: [{ text: { content: '💡 원본 메모' } }] }
    }, {
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ text: { content: rawText } }] }
    }, {
      object: 'block', type: 'heading_2',
      heading_2: { rich_text: [{ text: { content: '🤖 AI 구조화' } }] }
    }, {
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ text: { content: parsed.details || '' } }] }
    }]
  })
  return c.json({ page, structured: parsed })
})

app.get('/api/ideas', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)
  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ timestamp: 'created_time', direction: 'descending' }]
  })
  return c.json(data)
})

// ─── Meeting Notes API ────────────────────────────────────────────────────────
app.post('/api/meetings', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const geminiKey = c.env.GEMINI_API_KEY
  const { dbId, transcript, manualNotes, date, client, scheduleId } = await c.req.json()

  if (!dbId) return c.json({ error: 'dbId required' }, 400)
  if (!transcript && !manualNotes) return c.json({ error: '내용을 입력해주세요' }, 400)

  const combined = `음성 녹취:\n${transcript || ''}\n\n수기 메모:\n${manualNotes || ''}`

  // AI 회의록 구조화 (실패해도 진행)
  let parsed: any = {}
  try {
    const structured = await geminiRequest(geminiKey,
      `너는 내용 정리 도우미다. 아래 "입력 내용"을 근거로 정리한다.
입력이 회의든, 기사든, 개인 메모든 상관없이 "입력된 내용 자체"를 요약·정리한다. (회의인지 아닌지 판단해서 비우지 마라.)

[규칙]
- summary(요약)와 discussion(주요 내용)은 입력 내용이 있으면 반드시 채운다. 입력을 충실히 요약하라.
- 원문에 없는 사실/결론/수치를 새로 지어내지 마라(창작 금지). 있는 내용을 정리·압축하는 것은 괜찮다.
- 과도한 미사여구·억측을 피하고 원문의 사실을 보존한다.
- agenda(안건)와 action_items(할 일)는 "회의 안건/결정된 다음 행동"이 입력에 실제로 있을 때만 채운다. 없으면 빈 배열로 두고, 억지로 만들지 마라. (기사·일반 메모라면 보통 비어 있는 게 정상이다.)
- 입력 내용이 정말로 비어 있을 때만 summary/discussion을 빈 문자열로 둔다.

날짜: ${date || '(미지정)'}
고객사/프로젝트: ${client || '(미지정)'}

입력 내용:
"""
${combined}
"""

아래 JSON 형식으로만 답하라(다른 텍스트 없이):
{
  "title": "입력을 대표하는 짧은 제목(20자 이내)",
  "summary": "입력 내용의 핵심 요약(3~5문장). 입력이 있으면 반드시 작성",
  "agenda": ["회의 안건이 있을 때만. 없으면 빈 배열"],
  "discussion": "입력 내용을 정리한 본문. 입력이 있으면 반드시 작성",
  "action_items": ["명시된 할 일/결정이 있을 때만. 없으면 빈 배열"],
  "tags": ["내용 기반 핵심 키워드 태그(최대 5개)"]
}`
    )
    const jsonMatch = structured.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    // AI 실패해도 기본값으로 진행
  }
  // AI 결과가 없으면(=AI 실패) 원문을 그대로 보존 (창작하지 않음)
  if (!parsed.title) {
    parsed = {
      title: client ? `${client} 회의 ${date || ''}`.trim() : `회의록 ${date || new Date().toISOString().split('T')[0]}`,
      summary: '',            // AI 실패 시 요약을 지어내지 않음 (원문은 본문에 보존)
      agenda: [],
      discussion: '',
      action_items: [],
      tags: [],
      _aiFailed: true,
    }
  }

  // ── Notion 블록 헬퍼 ──────────────────────────────────────────────────────
  // 긴 텍스트는 2000자 단위로 나눠 여러 rich_text 블록/문단으로 (Notion 2000자 제한)
  const chunk = (s: string, n = 1900) => {
    const out: string[] = []
    for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n))
    return out.length ? out : ['']
  }
  const paragraphs = (text: string) => chunk(text || '').map(t => ({
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: t } }] },
  }))
  // 토글 블록: 제목을 클릭하면 안쪽 내용이 펼쳐짐 (긴 글 접기용)
  const toggle = (title: string, childrenBlocks: any[]) => ({
    object: 'block', type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: title } }],
      children: childrenBlocks.length ? childrenBlocks : paragraphs('(내용 없음)'),
    },
  })

  // DB 속성: 표에서 보기 좋게 "짧은 미리보기"만 넣는다 (전문은 페이지 본문 토글에).
  const previewLine = (s: string, n = 120) => {
    const oneLine = (s || '').replace(/\s+/g, ' ').trim()
    return oneLine.length > n ? oneLine.slice(0, n) + '…' : oneLine
  }
  const actionCount = (parsed.action_items || []).length

  const properties: any = {
    '회의 제목': { title: [{ text: { content: parsed.title || `${client} 회의` } }] },
    '날짜': { date: { start: date || new Date().toISOString().split('T')[0] } },
    '고객사/프로젝트': { rich_text: [{ text: { content: client || '' } }] },
    // 요약 속성 = 한 줄 미리보기 (표에서 잘려도 핵심만 보이게)
    '요약': { rich_text: [{ text: { content: previewLine(parsed.summary) } }] },
    // 액션 아이템 속성 = 개수 요약 (상세는 본문 토글에)
    '액션 아이템': { rich_text: [{ text: { content: actionCount ? `액션 ${actionCount}건 (본문 참조)` : '' } }] },
  }
  if (parsed.tags?.length) properties['태그'] = { multi_select: parsed.tags.slice(0, 5).map((t: string) => ({ name: t.slice(0, 100) })) }
  if (scheduleId) properties['일정 ID'] = { rich_text: [{ text: { content: scheduleId } }] }

  // ── 페이지 본문: 토글 기반 (긴 글은 접었다 펼침) ──────────────────────────
  const children: any[] = []

  if (parsed._aiFailed) {
    children.push({
      object: 'block', type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '⚠️' },
        rich_text: [{ type: 'text', text: { content: 'AI 요약이 일시적으로 실패해 원문만 저장했어요. 잠시 후 다시 시도하면 요약이 생성됩니다.' } }],
      },
    })
  }

  // 요약 (토글, 기본 펼침 느낌으로 heading + 문단)
  children.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: '📝 회의 요약' } }] } })
  children.push(...paragraphs(parsed.summary || '(요약 없음)'))

  // 안건 (토글)
  children.push(toggle('📌 안건 펼쳐보기', (parsed.agenda || []).map((item: string) => ({
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: item } }] },
  }))))

  // 주요 논의 (토글 — 보통 길어서 접기)
  children.push(toggle('💬 주요 논의 펼쳐보기', paragraphs(parsed.discussion || '')))

  // 액션 아이템 (토글 안 체크박스)
  children.push(toggle(`✅ 액션 아이템 펼쳐보기${actionCount ? ` (${actionCount})` : ''}`,
    (parsed.action_items || []).map((item: string) => ({
      object: 'block', type: 'to_do',
      to_do: { rich_text: [{ text: { content: item } }], checked: false },
    }))
  ))

  // 원본 (수기 메모 + 녹취, 각각 토글로 접기)
  if (manualNotes) {
    children.push(toggle('🗒️ 수기 메모 원본', paragraphs(manualNotes)))
  }
  children.push(toggle('🎙️ 음성 녹취 원본', paragraphs(transcript || '')))

  const page = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties,
    children
  })
  return c.json({ page, structured: parsed })
})

app.get('/api/meetings', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)
  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ property: '날짜', direction: 'descending' }]
  })
  return c.json(data)
})

// 회의록 수정
app.patch('/api/meetings/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const body = await c.req.json()
  const properties: any = {}
  if (body.title) properties['회의 제목'] = { title: [{ text: { content: body.title } }] }
  if (body.date) properties['날짜'] = { date: { start: body.date } }
  if (body.client !== undefined) properties['고객사/프로젝트'] = { rich_text: body.client ? [{ text: { content: body.client } }] : [] }
  // 요약/액션 속성은 표 가독성을 위해 "미리보기"만 저장 (전문은 페이지 본문 토글에)
  if (body.summary !== undefined) {
    const oneLine = (body.summary || '').replace(/\s+/g, ' ').trim()
    const preview = oneLine.length > 120 ? oneLine.slice(0, 120) + '…' : oneLine
    properties['요약'] = { rich_text: preview ? [{ text: { content: preview } }] : [] }
  }
  if (body.actions !== undefined) {
    const cnt = (body.actions || '').split('\n').map((s: string) => s.trim()).filter(Boolean).length
    properties['액션 아이템'] = { rich_text: cnt ? [{ text: { content: `액션 ${cnt}건 (본문 참조)` } }] : [] }
  }
  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { properties })
  return c.json(data)
})

// 회의록 재정리 — 기존 페이지의 원본 텍스트를 읽어 AI 재요약 후
// 속성(요약 미리보기/액션 개수/태그)을 갱신하고, 개선된 요약 토글을 본문에 추가(비파괴적)
app.post('/api/meetings/:pageId/reformat', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const geminiKey = c.env.GEMINI_API_KEY
  const pageId = c.req.param('pageId')

  // 1) 페이지 블록에서 원본 텍스트 수집 (문단/토글 내부 포함, 2뎁스까지)
  const collectText = (blocks: any[]): string => {
    let out = ''
    for (const b of blocks) {
      const rt = b?.[b.type]?.rich_text
      if (Array.isArray(rt)) out += rt.map((x: any) => x?.plain_text || x?.text?.content || '').join('') + '\n'
    }
    return out
  }
  const top = await notionRequest(apiKey, `/blocks/${pageId}/children?page_size=100`)
  let combined = collectText(top.results || [])
  // 토글 등 자식이 있는 블록 한 뎁스 더 수집
  for (const b of (top.results || [])) {
    if (b.has_children) {
      try {
        const sub = await notionRequest(apiKey, `/blocks/${b.id}/children?page_size=100`)
        combined += collectText(sub.results || [])
      } catch (_) {}
    }
  }
  combined = combined.trim()
  if (!combined) return c.json({ error: '재정리할 원본 내용을 찾지 못했어요' }, 400)

  // 2) AI 재요약 (신규 저장과 동일한 규칙)
  let parsed: any = {}
  try {
    const structured = await geminiRequest(geminiKey,
      `너는 내용 정리 도우미다. 아래 "입력 내용"을 근거로 정리한다. 입력 종류와 무관하게 입력 자체를 요약·정리하라.
- summary/discussion 은 입력이 있으면 반드시 채운다. 원문 사실 보존, 창작 금지.
- agenda/action_items 는 실제로 있을 때만, 없으면 빈 배열.

입력 내용:
"""
${combined.slice(0, 8000)}
"""

JSON만 반환:
{"title":"짧은 제목","summary":"요약(3~5문장)","agenda":[],"discussion":"본문 정리","action_items":[],"tags":[]}`
    )
    const m = structured.match(/\{[\s\S]*\}/)
    if (m) parsed = JSON.parse(m[0])
  } catch (_) {}
  if (!parsed.summary && !parsed.discussion) {
    return c.json({ error: 'AI 재요약에 실패했어요 (잠시 후 다시 시도)' }, 502)
  }

  // 3) 속성 갱신 (미리보기)
  const previewLine = (s: string, n = 120) => {
    const one = (s || '').replace(/\s+/g, ' ').trim()
    return one.length > n ? one.slice(0, n) + '…' : one
  }
  const actionCount = (parsed.action_items || []).length
  const properties: any = {
    '요약': { rich_text: [{ text: { content: previewLine(parsed.summary) } }] },
    '액션 아이템': { rich_text: [{ text: { content: actionCount ? `액션 ${actionCount}건 (본문 참조)` : '' } }] },
  }
  if (parsed.tags?.length) properties['태그'] = { multi_select: parsed.tags.slice(0, 5).map((t: string) => ({ name: t.slice(0, 100) })) }
  await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { properties })

  // 4) 개선된 요약을 본문에 토글로 추가 (기존 내용 보존, 비파괴적)
  const chunk = (s: string, n = 1900) => { const o: string[] = []; for (let i=0;i<s.length;i+=n) o.push(s.slice(i,i+n)); return o.length?o:[''] }
  const paras = (t: string) => chunk(t||'').map(x => ({ object:'block', type:'paragraph', paragraph:{ rich_text:[{ type:'text', text:{ content:x } }] } }))
  const children: any[] = [
    { object:'block', type:'divider', divider:{} },
    { object:'block', type:'toggle', toggle:{
      rich_text:[{ type:'text', text:{ content:`🔄 재정리된 요약 (${new Date().toISOString().slice(0,10)})` } }],
      children:[
        { object:'block', type:'heading_3', heading_3:{ rich_text:[{ text:{ content:'📝 요약' } }] } },
        ...paras(parsed.summary || ''),
        ...(parsed.discussion ? [{ object:'block', type:'heading_3', heading_3:{ rich_text:[{ text:{ content:'💬 주요 내용' } }] } }, ...paras(parsed.discussion)] : []),
        ...((parsed.action_items||[]).length ? [{ object:'block', type:'heading_3', heading_3:{ rich_text:[{ text:{ content:'✅ 액션 아이템' } }] } }, ...parsed.action_items.map((it:string)=>({ object:'block', type:'to_do', to_do:{ rich_text:[{ text:{ content:it } }], checked:false } }))] : []),
      ],
    } },
  ]
  await notionRequest(apiKey, `/blocks/${pageId}/children`, 'PATCH', { children })

  return c.json({ success: true, structured: parsed })
})

// ─── Shopping List API ────────────────────────────────────────────────────────
app.post('/api/shopping', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const geminiKey = c.env.GEMINI_API_KEY
  const { dbId, item, quantity, category, tags, userLocation } = await c.req.json()

  // AI 구매처 추천
  const recommendation = await geminiRequest(geminiKey,
    `쇼핑 아이템 구매처를 추천해줘.
아이템: ${item}
수량: ${quantity || '1개'}
카테고리: ${category || '일반'}
사용자 위치: ${userLocation || '미국'}

반환 형식 (JSON만):
{
  "recommendation": "구매처 추천 및 이유 (2-3문장)",
  "best_place": "최적 구매처 이름",
  "country": "미국 또는 한국",
  "online_offline": "온라인 또는 오프라인",
  "price_tip": "가격 관련 팁"
}`
  )

  let recParsed: any = {}
  try {
    const jsonMatch = recommendation.match(/\{[\s\S]*\}/)
    if (jsonMatch) recParsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    recParsed = { recommendation: '정보 없음', best_place: '직접 검색', country: userLocation || '미국' }
  }

  const countryMap: any = { '미국': '🇺🇸 미국', '한국': '🇰🇷 한국', '온라인': '🌐 온라인' }
  const properties: any = {
    '아이템': { title: [{ text: { content: item } }] },
    '수량': { rich_text: [{ text: { content: quantity || '1' } }] },
    '구매처 추천': { rich_text: [{ text: { content: recParsed.recommendation || '' } }] },
    '구매완료': { checkbox: false },
    '카테고리': { select: { name: category || '기타' } },
  }

  const country = countryMap[recParsed.country] || '🇺🇸 미국'
  properties['국가'] = { select: { name: country } }
  if (tags?.length) properties['태그'] = { multi_select: tags.map((t: string) => ({ name: t })) }

  const page = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties
  })
  return c.json({ page, recommendation: recParsed })
})

app.get('/api/shopping', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)
  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ timestamp: 'created_time', direction: 'descending' }]
  })
  return c.json(data)
})

app.patch('/api/shopping/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const { checked } = await c.req.json()
  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', {
    properties: { '구매완료': { checkbox: checked } }
  })
  return c.json(data)
})

// 쇼핑 삭제
app.delete('/api/shopping/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { archived: true })
  return c.json(data)
})

// 일정 수정
app.patch('/api/schedules/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const body = await c.req.json()
  const properties: any = {}
  if (body.title) properties['일정 제목'] = { title: [{ text: { content: body.title } }] }
  if (body.datetime) properties['날짜/시간'] = { date: { start: body.datetime, end: body.endDatetime || null } }
  if (body.location !== undefined) properties['장소'] = { rich_text: body.location ? [{ text: { content: body.location } }] : [] }
  if (body.category) properties['카테고리'] = { select: { name: body.category } }
  if (body.reminder) properties['알림'] = { select: { name: body.reminder } }
  if (body.memo !== undefined) properties['메모'] = { rich_text: body.memo ? [{ text: { content: body.memo } }] : [] }
  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { properties })
  return c.json(data)
})

// 일정 삭제
app.delete('/api/schedules/:pageId', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const pageId = c.req.param('pageId')
  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', { archived: true })
  return c.json(data)
})

// ─── Novel Memo API ───────────────────────────────────────────────────────────
app.post('/api/novels', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const geminiKey = c.env.GEMINI_API_KEY
  const { dbId, rawText, genre } = await c.req.json()

  // AI 소설 구조화 + Q&A 생성
  const structured = await geminiRequest(geminiKey,
    `다음 소설 소재를 분석하고 구조화해줘.
소재: "${rawText}"
장르: ${genre || '미정'}

반환 형식 (JSON만):
{
  "title": "작품 가제 (15자 이내)",
  "setting": "배경 설정 요약",
  "protagonist": "주인공 추정 설명",
  "core_theme": "핵심 소재/테마",
  "questions": [
    "추가로 채워야 할 설정 질문 1",
    "추가로 채워야 할 설정 질문 2",
    "추가로 채워야 할 설정 질문 3",
    "추가로 채워야 할 설정 질문 4",
    "추가로 채워야 할 설정 질문 5"
  ]
}`
  )

  let parsed: any = {}
  try {
    const jsonMatch = structured.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    parsed = { title: rawText.slice(0, 15), setting: rawText, protagonist: '미정', core_theme: rawText, questions: [] }
  }

  const properties: any = {
    '작품명': { title: [{ text: { content: parsed.title || rawText.slice(0, 30) } }] },
    '장르': { select: { name: genre || '기타' } },
    '배경': { rich_text: [{ text: { content: parsed.setting || '' } }] },
    '주인공': { rich_text: [{ text: { content: parsed.protagonist || '' } }] },
    '핵심 소재': { rich_text: [{ text: { content: parsed.core_theme || '' } }] },
    '진행 상태': { select: { name: '아이디어' } },
  }

  const page = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties,
    children: [
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '📝 원본 소재' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: rawText } }] } },
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '🤖 AI 분석' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: `배경: ${parsed.setting || ''}\n주인공: ${parsed.protagonist || ''}\n테마: ${parsed.core_theme || ''}` } }] } },
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '❓ 채워야 할 설정' } }] } },
      ...(parsed.questions || []).map((q: string) => ({
        object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: q } }] }
      })),
    ]
  })
  return c.json({ page, structured: parsed })
})

app.get('/api/novels', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)
  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ timestamp: 'created_time', direction: 'descending' }]
  })
  return c.json(data)
})

// ─── Schedule API ─────────────────────────────────────────────────────────────
app.post('/api/schedules', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const { dbId, title, datetime, endDatetime, location, category, reminder, memo } = await c.req.json()

  const properties: any = {
    '일정 제목': { title: [{ text: { content: title } }] },
    '날짜/시간': { date: { start: datetime, end: endDatetime || null } },
    '카테고리': { select: { name: category || '기타' } },
  }
  if (location) properties['장소'] = { rich_text: [{ text: { content: location } }] }
  if (reminder) properties['알림'] = { select: { name: reminder } }
  if (memo) properties['메모'] = { rich_text: [{ text: { content: memo } }] }

  const data = await notionRequest(apiKey, '/pages', 'POST', {
    parent: { database_id: dbId },
    properties
  })
  return c.json(data)
})

app.get('/api/schedules', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const dbId = c.req.query('dbId')
  if (!dbId) return c.json({ error: 'dbId required' }, 400)
  const data = await notionRequest(apiKey, `/databases/${dbId}/query`, 'POST', {
    sorts: [{ property: '날짜/시간', direction: 'ascending' }]
  })
  return c.json(data)
})

// ─── STT API ──────────────────────────────────────────────────────────────────
app.post('/api/stt', async (c) => {
  const groqKey = c.env.GROQ_API_KEY
  const { audioBase64, mimeType, language } = await c.req.json()

  try {
    const text = await groqSTT(groqKey, audioBase64, mimeType || 'audio/webm', language || 'ko')
    return c.json({ text })
  } catch (e: any) {
    return c.json({ error: e.message, text: '' }, 500)
  }
})

// ─── AI 구조화 API ────────────────────────────────────────────────────────────
app.post('/api/ai/structure', async (c) => {
  const geminiKey = c.env.GEMINI_API_KEY
  const { type, text } = await c.req.json()

  // 입력 크기 제한 (10KB 이상이면 거부)
  if (!text || typeof text !== 'string') return c.json({ error: '텍스트가 없습니다' }, 400)
  if (text.length > 10000) return c.json({ error: '입력이 너무 깁니다 (최대 10,000자)' }, 400)

  let prompt = ''
  if (type === 'diary') {
    prompt = `다음 일기 내용을 정리해줘. 한줄 요약과 무드를 분석해서 JSON으로 반환해줘.
내용: "${text}"
반환형식(JSON만): {"summary": "한줄요약", "mood": "😊 행복/😐 보통/😢 슬픔/😡 화남/😴 피곤 중 하나"}`
  } else if (type === 'todo') {
    prompt = `다음 할 일을 분석해서 우선순위와 예상 Due Date를 추천해줘.
할 일: "${text}"
오늘 날짜: ${new Date().toISOString().split('T')[0]}
반환형식(JSON만): {"priority": "높음 🔴/중간 🟡/낮음 🟢 중 하나", "suggested_due": "YYYY-MM-DD", "memo": "간단한 팁"}`
  }

  const result = await geminiRequest(geminiKey, prompt)
  let parsed: any = {}
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
  } catch (e) { parsed = {} }

  return c.json(parsed)
})

// ─── Settings API (DB IDs 저장/조회) ─────────────────────────────────────────
// DB IDs는 클라이언트 localStorage에 저장하는 방식 사용

// ═══════════════════════════════════════════════════════════════════════════════
// WEB PUSH (VAPID) — 알림 구독 저장 + 발송
// 구독 정보는 Notion 의 "🔔 Push Subscriptions" DB에 저장 (스택 유지: DB만 사용)
// ═══════════════════════════════════════════════════════════════════════════════

const PUSH_DB_TITLE = '🔔 Push Subscriptions'

// 부모 페이지 아래에 Push 구독 DB가 있으면 id 반환, 없으면 생성
async function ensurePushDb(apiKey: string, parentPageId: string): Promise<string | null> {
  if (!parentPageId) return null
  const children = await notionRequest(apiKey, `/blocks/${parentPageId}/children?page_size=100`)
  if (children.results) {
    for (const block of children.results) {
      if (block.type === 'child_database' && (block.child_database?.title || '') === PUSH_DB_TITLE) {
        return block.id.replace(/-/g, '')
      }
    }
  }
  const created = await notionRequest(apiKey, '/databases', 'POST', {
    parent: { type: 'page_id', page_id: parentPageId },
    icon: { type: 'emoji', emoji: '🔔' },
    title: [{ type: 'text', text: { content: PUSH_DB_TITLE } }],
    properties: {
      'endpoint': { title: {} },            // 구독 endpoint (고유키)
      '구독정보': { rich_text: {} },          // PushSubscription JSON 전체
      '스케줄 DB': { rich_text: {} },         // 이 사용자의 일정 DB id
      '사용기기': { rich_text: {} },          // userAgent
      '활성': { checkbox: {} },
      '생성일': { created_time: {} },
    },
  })
  return created.id ? created.id.replace(/-/g, '') : null
}

// endpoint 로 기존 구독 페이지 검색
async function findPushPage(apiKey: string, pushDbId: string, endpoint: string) {
  const res = await notionRequest(apiKey, `/databases/${pushDbId}/query`, 'POST', {
    filter: { property: 'endpoint', title: { equals: endpoint.slice(0, 2000) } },
    page_size: 1,
  })
  return res.results?.[0] || null
}

// 구독 등록 (upsert)
app.post('/api/push/subscribe', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const { parentPageId, subscription, scheduleDbId, userAgent } = await c.req.json()
  if (!subscription?.endpoint) return c.json({ error: 'subscription required' }, 400)

  // parentPageId 가 없으면(과거에 setup한 경우 등) scheduleDbId 의 부모 페이지에서 역추적
  let rootPageId = parentPageId
  if (!rootPageId && scheduleDbId) {
    try {
      const db = await notionRequest(apiKey, `/databases/${scheduleDbId}`)
      if (db?.parent?.type === 'page_id' && db.parent.page_id) {
        rootPageId = db.parent.page_id.replace(/-/g, '')
      }
    } catch (_) { /* 무시하고 아래에서 에러 처리 */ }
  }
  if (!rootPageId) {
    return c.json({ error: '루트 페이지를 찾을 수 없어요. 설정 화면에서 노션 페이지를 다시 연결해주세요.' }, 400)
  }

  const pushDbId = await ensurePushDb(apiKey, rootPageId)
  if (!pushDbId) return c.json({ error: 'push 구독 DB 생성 실패 (노션 페이지 연결 확인)' }, 400)

  const endpoint = subscription.endpoint
  const props: any = {
    'endpoint': { title: [{ text: { content: endpoint.slice(0, 2000) } }] },
    '구독정보': { rich_text: [{ text: { content: JSON.stringify(subscription).slice(0, 2000) } }] },
    '스케줄 DB': { rich_text: [{ text: { content: scheduleDbId || '' } }] },
    '사용기기': { rich_text: [{ text: { content: (userAgent || '').slice(0, 200) } }] },
    '활성': { checkbox: true },
  }

  const existing = await findPushPage(apiKey, pushDbId, endpoint)
  if (existing) {
    await notionRequest(apiKey, `/pages/${existing.id}`, 'PATCH', { properties: props })
  } else {
    await notionRequest(apiKey, '/pages', 'POST', { parent: { database_id: pushDbId }, properties: props })
  }
  return c.json({ success: true, pushDbId, parentPageId: rootPageId })
})

// 구독 해제
app.post('/api/push/unsubscribe', async (c) => {
  const apiKey = c.env.NOTION_API_KEY
  const { pushDbId, endpoint } = await c.req.json()
  if (!pushDbId || !endpoint) return c.json({ error: 'pushDbId, endpoint required' }, 400)
  const existing = await findPushPage(apiKey, pushDbId, endpoint)
  if (existing) {
    await notionRequest(apiKey, `/pages/${existing.id}`, 'PATCH', { properties: { '활성': { checkbox: false } } })
  }
  return c.json({ success: true })
})

// VAPID 공개키 제공 (프론트 구독 시 필요)
app.get('/api/push/vapid-public', (c) => {
  const key = c.env.VAPID_PUBLIC_KEY
  if (!key) return c.json({ error: 'VAPID not configured' }, 500)
  return c.json({ publicKey: key })
})

// 테스트 발송 (구독 직후 동작 확인용)
app.post('/api/push/test', async (c) => {
  const { subscription } = await c.req.json()
  if (!subscription?.endpoint) return c.json({ error: 'subscription required' }, 400)
  const pub = c.env.VAPID_PUBLIC_KEY, priv = c.env.VAPID_PRIVATE_KEY
  const subj = c.env.VAPID_SUBJECT || 'mailto:admin@memonest.app'
  if (!pub || !priv) return c.json({ error: 'VAPID not configured' }, 500)
  try {
    const webpush = (await import('web-push')).default
    webpush.setVapidDetails(subj, pub, priv)
    await webpush.sendNotification(subscription, JSON.stringify({
      title: '🔔 MemoNest 알림 테스트',
      body: '알림이 정상적으로 도착했어요!',
      url: '/',
    }))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e?.message || 'push failed' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR OAUTH 2.0
// ═══════════════════════════════════════════════════════════════════════════════

const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events'

// ─── Redirect URI 동적 산출 ───────────────────────────────────────────────────
// 하드코딩된 배포 도메인 대신 실제 요청 Origin 기반으로 생성한다.
// 우선순위: APP_BASE_URL 환경변수 > 요청 헤더(Origin/host) 로 계산.
// 반드시 Google Cloud Console "승인된 리디렉션 URI"에 동일 값이 등록돼 있어야 한다.
function getRedirectUri(c: any): string {
  const explicit = (c.env?.APP_BASE_URL || '').replace(/\/+$/, '')
  if (explicit) return `${explicit}/api/calendar/callback`

  // Origin 헤더 우선, 없으면 forwarded proto/host 로 조립
  const origin = c.req.header('Origin')
  if (origin) return `${origin.replace(/\/+$/, '')}/api/calendar/callback`

  const proto = c.req.header('X-Forwarded-Proto') || 'https'
  const host = c.req.header('X-Forwarded-Host') || c.req.header('Host') || ''
  return `${proto}://${host}/api/calendar/callback`
}

// ─── Google OAuth: 인증 URL 생성 ──────────────────────────────────────────────
app.get('/api/calendar/auth-url', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID
  if (!clientId) return c.json({ error: 'GOOGLE_CLIENT_ID not configured' }, 500)

  const redirectUri = getRedirectUri(c)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',    // refresh_token 발급
    prompt: 'consent',         // 항상 동의화면 → refresh_token 재발급 보장
    state: 'memonest_cal',
  })
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return c.json({ url, redirectUri })
})

// ─── Google OAuth: 콜백 처리 + token 저장 (localStorage로 전달) ───────────────
app.get('/api/calendar/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code) {
    return c.html(`<script>
      window.opener?.postMessage({type:'GCAL_AUTH_ERROR', error:'${error || 'no_code'}'}, '*');
      window.close();
    </script>`)
  }

  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET
  const redirectUri = getRedirectUri(c)

  // code → tokens 교환
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })
  const tokens: any = await tokenRes.json()

  if (tokens.error) {
    return c.html(`<script>
      window.opener?.postMessage({type:'GCAL_AUTH_ERROR', error:'${tokens.error}'}, '*');
      window.close();
    </script>`)
  }

  // 토큰을 opener(부모창)로 전달 → localStorage에 저장
  return c.html(`<!DOCTYPE html><html><head><title>인증 완료</title></head><body>
    <p style="font-family:sans-serif;text-align:center;padding:40px">✅ Google Calendar 연동 완료! 창이 자동으로 닫힙니다.</p>
    <script>
      const tokens = ${JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_in: tokens.expires_in || 3600,
        issued_at: Date.now(),
      })};
      window.opener?.postMessage({type:'GCAL_AUTH_SUCCESS', tokens}, '*');
      setTimeout(() => window.close(), 1500);
    </script>
  </body></html>`)
})

// ─── Google token refresh helper ──────────────────────────────────────────────
async function refreshGoogleToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  return res.json() as Promise<any>
}

// ─── Google Calendar: 이벤트 생성 API ─────────────────────────────────────────
app.post('/api/calendar/events', async (c) => {
  const body = await c.req.json()
  const { accessToken, refreshToken, issuedAt, expiresIn, event } = body

  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return c.json({ error: 'Google credentials not configured' }, 500)

  // access_token 만료 여부 확인 (만료 5분 전 갱신)
  let token = accessToken
  let newTokens: any = null
  const now = Date.now()
  const expiresAt = (issuedAt || 0) + (expiresIn || 3600) * 1000
  if (now > expiresAt - 5 * 60 * 1000) {
    if (!refreshToken) return c.json({ error: 'Token expired and no refresh_token. Please re-authenticate.' }, 401)
    const refreshed = await refreshGoogleToken(clientId, clientSecret, refreshToken)
    if (refreshed.error) return c.json({ error: `Token refresh failed: ${refreshed.error}` }, 401)
    token = refreshed.access_token
    newTokens = {
      access_token: refreshed.access_token,
      expires_in: refreshed.expires_in || 3600,
      issued_at: Date.now(),
      refresh_token: refreshToken, // refresh_token은 재발급 안되므로 유지
    }
  }

  // Google Calendar API 이벤트 생성
  const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  const calData: any = await calRes.json()

  if (calData.error) return c.json({ error: calData.error.message, details: calData }, 400)

  return c.json({
    success: true,
    eventId: calData.id,
    htmlLink: calData.htmlLink,
    newTokens, // null이면 갱신 불필요, 있으면 클라이언트가 localStorage 업데이트
  })
})

// ─── Google Calendar: 일정 일괄 등록 (Notion 일정 전체) ──────────────────────
app.post('/api/calendar/bulk', async (c) => {
  const body = await c.req.json()
  const { accessToken, refreshToken, issuedAt, expiresIn, events } = body

  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return c.json({ error: 'Google credentials not configured' }, 500)

  // token 갱신 체크
  let token = accessToken
  let newTokens: any = null
  const now = Date.now()
  const expiresAt = (issuedAt || 0) + (expiresIn || 3600) * 1000
  if (now > expiresAt - 5 * 60 * 1000) {
    if (!refreshToken) return c.json({ error: 'Token expired. Please re-authenticate.' }, 401)
    const refreshed = await refreshGoogleToken(clientId, clientSecret, refreshToken)
    if (refreshed.error) return c.json({ error: `Token refresh failed: ${refreshed.error}` }, 401)
    token = refreshed.access_token
    newTokens = { access_token: refreshed.access_token, expires_in: refreshed.expires_in || 3600, issued_at: Date.now(), refresh_token: refreshToken }
  }

  // 이벤트 순차 등록 (Google API rate limit 배려)
  const results: any[] = []
  for (const event of (events || [])) {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      const data: any = await res.json()
      results.push({ success: !data.error, eventId: data.id, htmlLink: data.htmlLink, title: event.summary, error: data.error?.message })
    } catch (e: any) {
      results.push({ success: false, title: event.summary, error: e.message })
    }
  }

  const successCount = results.filter(r => r.success).length
  return c.json({ success: true, total: events.length, created: successCount, failed: events.length - successCount, results, newTokens })
})

// ─── API 미매칭 폴백 ───────────────────────────────────────────────────────────
// 앱 HTML 셸(index.html)과 정적 자산은 Netlify CDN이 서빙한다.
// 이 함수로는 /api/* 만 유입되므로(netlify.toml redirect), 매칭 안 되면 404 JSON.
app.all('/api/*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404))

export default app
