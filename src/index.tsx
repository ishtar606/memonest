import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  NOTION_API_KEY: string
  GEMINI_API_KEY: string
  GROQ_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())
app.use('/static/*', serveStatic({ root: './' }))

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
async function geminiRequest(apiKey: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    }
  )
  const data: any = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ─── Groq STT Helper ─────────────────────────────────────────────────────────
async function groqSTT(apiKey: string, audioBase64: string, mimeType: string) {
  // Groq Whisper API
  const binaryStr = atob(audioBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  const formData = new FormData()
  formData.append('file', blob, 'audio.webm')
  formData.append('model', 'whisper-large-v3')
  formData.append('language', 'ko')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  })
  const data: any = await res.json()
  return data.text || ''
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Notion DB 초기화 ─────────────────────────────────────────────────────────
app.post('/api/notion/init', async (c) => {
  const { parentPageId } = await c.req.json()
  const apiKey = c.env.NOTION_API_KEY

  const databases: Record<string, any> = {}

  // 1. ToDo DB
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

  // 2. Schedule DB
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

  // 3. Meeting Notes DB
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
      '생성일': { created_time: {} },
    }
  })
  databases.meeting = meetingDB.id

  // 4. Shopping List DB
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

  // 5. Idea Memo DB
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

  // 6. Novel Memo DB
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

  // 7. Diary DB
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

  return c.json({ success: true, databases })
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
  const { status } = await c.req.json()

  const data = await notionRequest(apiKey, `/pages/${pageId}`, 'PATCH', {
    properties: {
      '상태': { select: { name: status } }
    }
  })
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
  const { dbId, transcript, manualNotes, date, client } = await c.req.json()

  const combined = `음성 녹취:\n${transcript || ''}\n\n수기 메모:\n${manualNotes || ''}`

  // AI 회의록 구조화
  const structured = await geminiRequest(geminiKey,
    `다음 회의 내용을 전문적인 회의록으로 구조화해줘.
날짜: ${date}
고객사/프로젝트: ${client || '미지정'}

내용:
${combined}

반환 형식 (JSON만):
{
  "title": "회의 제목",
  "summary": "회의 요약 (3-5문장)",
  "agenda": ["안건1", "안건2"],
  "discussion": "주요 논의 내용",
  "action_items": ["액션아이템1", "액션아이템2"],
  "tags": ["태그1", "태그2"]
}`
  )

  let parsed: any = {}
  try {
    const jsonMatch = structured.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    parsed = { title: `${client} 회의 ${date}`, summary: combined.slice(0, 200), agenda: [], discussion: combined, action_items: [], tags: [] }
  }

  const properties: any = {
    '회의 제목': { title: [{ text: { content: parsed.title || `${client} 회의` } }] },
    '날짜': { date: { start: date } },
    '고객사/프로젝트': { rich_text: [{ text: { content: client || '' } }] },
    '요약': { rich_text: [{ text: { content: parsed.summary || '' } }] },
    '액션 아이템': { rich_text: [{ text: { content: (parsed.action_items || []).join('\n') } }] },
  }
  if (parsed.tags?.length) properties['태그'] = { multi_select: parsed.tags.map((t: string) => ({ name: t })) }

  const children: any[] = [
    { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '📝 회의 요약' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: parsed.summary || '' } }] } },
    { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '📌 안건' } }] } },
    ...(parsed.agenda || []).map((item: string) => ({
      object: 'block', type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: [{ text: { content: item } }] }
    })),
    { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '💬 주요 논의' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: parsed.discussion || '' } }] } },
    { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '✅ 액션 아이템' } }] } },
    ...(parsed.action_items || []).map((item: string) => ({
      object: 'block', type: 'to_do',
      to_do: { rich_text: [{ text: { content: item } }], checked: false }
    })),
    { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: '🎙️ 원본 녹취' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: transcript || '' } }] } },
  ]

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
  const { dbId, title, datetime, location, category, reminder, memo } = await c.req.json()

  const properties: any = {
    '일정 제목': { title: [{ text: { content: title } }] },
    '날짜/시간': { date: { start: datetime } },
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
  const { audioBase64, mimeType } = await c.req.json()

  try {
    const text = await groqSTT(groqKey, audioBase64, mimeType || 'audio/webm')
    return c.json({ text })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── AI 구조화 API ────────────────────────────────────────────────────────────
app.post('/api/ai/structure', async (c) => {
  const geminiKey = c.env.GEMINI_API_KEY
  const { type, text } = await c.req.json()

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

// ─── Main App HTML ─────────────────────────────────────────────────────────────
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>MemoNest 🪺</title>
  <meta name="theme-color" content="#6366f1">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="manifest" href="/static/manifest.json">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen">
  <div id="app"></div>
  <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
