// Scheduled Function — 임박 일정 리마인더 웹푸시 발송
// 5분마다 실행. Notion 의 활성 구독 + 각 사용자의 일정 DB 를 조회해서,
// "알림 시각"(일정 시작 - 리마인더분)이 지금부터 다음 5분 창에 들어오면 푸시 발송.
//
// 필요한 Netlify 환경변수:
//   NOTION_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_DB_ID, APP_BASE_URL(선택)
// (PUSH_DB_ID 는 최초 구독 후 /api/push/subscribe 응답의 pushDbId 값을 등록)
import type { Config } from '@netlify/functions'
import webpush from 'web-push'

const NOTION_VERSION = '2022-06-28'

async function notion(path: string, method = 'GET', body?: any) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json() as Promise<any>
}

const REMINDER_MIN: Record<string, number> = {
  '10분 전': 10, '1시간 전': 60, '1일 전': 1440,
}

export default async (req: Request) => {
  const pushDbId = process.env.PUSH_DB_ID
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT || 'mailto:admin@memonest.app'
  if (!pushDbId || !pub || !priv || !process.env.NOTION_API_KEY) {
    console.log('[reminders] 환경변수 미설정 — 스킵')
    return new Response('skip: env not configured')
  }
  webpush.setVapidDetails(subj, pub, priv)

  const now = Date.now()
  const windowMs = 5 * 60 * 1000 // 5분 창

  // 1) 활성 구독 로드
  const subsRes = await notion(`/databases/${pushDbId}/query`, 'POST', {
    filter: { property: '활성', checkbox: { equals: true } },
    page_size: 100,
  })
  const subs = (subsRes.results || []).map((p: any) => {
    let sub: any = null
    try { sub = JSON.parse(p.properties?.['구독정보']?.rich_text?.[0]?.text?.content || 'null') } catch {}
    return {
      pageId: p.id,
      sub,
      scheduleDbId: p.properties?.['스케줄 DB']?.rich_text?.[0]?.text?.content || '',
    }
  }).filter((s: any) => s.sub && s.scheduleDbId)

  if (!subs.length) return new Response('no active subscriptions')

  // 2) 스케줄 DB 별로 일정 조회 (중복 조회 방지 위해 캐시)
  const schedCache: Record<string, any[]> = {}
  async function loadSchedules(dbId: string) {
    if (schedCache[dbId]) return schedCache[dbId]
    const res = await notion(`/databases/${dbId}/query`, 'POST', {
      sorts: [{ property: '날짜/시간', direction: 'ascending' }],
      page_size: 100,
    })
    schedCache[dbId] = res.results || []
    return schedCache[dbId]
  }

  let sent = 0, failed = 0
  const staleEndpoints: string[] = []

  // 반복 규칙에 따라 base 시작시각의 "후보 발생 시각들"을 now 근처(±2일)로 생성
  // (리마인더는 최대 1일 전이므로 이 범위면 충분)
  const occurrenceStarts = (baseIso: string, repeat: string): number[] => {
    const base = new Date(baseIso).getTime()
    if (!repeat || repeat === '없음') return [base]
    const winStart = now - 2 * 86400000
    const winEnd = now + 2 * 86400000
    const out: number[] = []
    if (repeat === '매일' || repeat === '매주' || repeat === '격주') {
      const stepMs = (repeat === '매일' ? 1 : repeat === '매주' ? 7 : 14) * 86400000
      // base 로부터 winStart 이전 가장 가까운 지점부터 전진
      let t = base
      if (t < winStart) {
        const k = Math.ceil((winStart - t) / stepMs)
        t = base + k * stepMs
      }
      let guard = 0
      while (t <= winEnd && guard++ < 40) { out.push(t); t += stepMs }
    } else if (repeat === '매월') {
      const bd = new Date(baseIso)
      for (let m = -2; m <= 2; m++) {
        const d = new Date(bd); d.setMonth(d.getMonth() + m)
        const ts = d.getTime()
        if (ts >= winStart && ts <= winEnd) out.push(ts)
      }
    }
    return out.length ? out : [base]
  }

  for (const s of subs) {
    const schedules = await loadSchedules(s.scheduleDbId)
    for (const sch of schedules) {
      const props = sch.properties
      const startIso = props?.['날짜/시간']?.date?.start
      const reminder = props?.['알림']?.select?.name || ''
      const repeat = props?.['반복']?.select?.name || '없음'
      const title = props?.['일정 제목']?.title?.[0]?.text?.content || '일정'
      const location = props?.['장소']?.rich_text?.[0]?.text?.content || ''
      if (!startIso) continue
      const remMin = REMINDER_MIN[reminder]
      if (!remMin) continue // '없음' 또는 미설정

      // 반복 포함 모든 후보 발생 시각에 대해 알림 창 확인
      for (const startMs of occurrenceStarts(startIso, repeat)) {
        const notifyAt = startMs - remMin * 60 * 1000
        if (notifyAt >= now && notifyAt < now + windowMs) {
          const startLabel = new Date(startMs).toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
          })
          const body = `${startLabel} 시작${location ? ' · ' + location.split('\n')[0] : ''}`
          try {
            await webpush.sendNotification(s.sub, JSON.stringify({
              title: `⏰ ${title}`,
              body: `${reminder} 알림 — ${body}`,
              url: '/',
              tag: `sched-${sch.id}-${startMs}`,
            }))
            sent++
          } catch (e: any) {
            failed++
            if (e?.statusCode === 404 || e?.statusCode === 410) staleEndpoints.push(s.pageId)
          }
        }
      }
    }
  }

  // 3) 만료 구독 비활성화
  for (const pageId of staleEndpoints) {
    try { await notion(`/pages/${pageId}`, 'PATCH', { properties: { '활성': { checkbox: false } } }) } catch {}
  }

  console.log(`[reminders] sent=${sent} failed=${failed} stale=${staleEndpoints.length}`)
  return new Response(`sent=${sent} failed=${failed}`)
}

export const config: Config = {
  schedule: '*/5 * * * *', // 5분마다 (UTC)
}
