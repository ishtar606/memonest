// Netlify Functions 엔트리 — Hono 앱을 Netlify Node Function으로 노출
// netlify.toml 의 redirect 로 /api/* 및 OAuth 콜백이 이 함수로 유입된다.
//
// 시크릿(NOTION_API_KEY 등)은 Netlify 환경변수(process.env)로 주입되며,
// src/index.tsx 의 env 주입 미들웨어가 process.env -> c.env 로 채워준다.
// (코드에 시크릿을 하드코딩하지 않는다.)
import { handle } from 'hono/netlify'
import app from '../../src/index'

export default handle(app)

// 이 함수가 처리할 경로. netlify.toml redirect 와 함께 /api/* 전체를 커버.
export const config = {
  path: ['/api/*'],
}
