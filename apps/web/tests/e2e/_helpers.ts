import type { BrowserContext } from '@playwright/test'

// next-auth/jwt is ESM-only; Playwright spec を CommonJS で動かす場合の
// require() 不可エラーを避けるため dynamic import で取り込む。
const loadEncode = async (): Promise<typeof import('next-auth/jwt').encode> => {
  const mod = await import('next-auth/jwt')
  return mod.encode
}

const SESSION_COOKIE_NAME = 'authjs.session-token'

export type SeedUser = {
  id: string
  nickname: string
  tone: string
  email?: string
  providerId: string
}

// E2E 用の authenticated state を 1 ユーザー分用意する。
// 1. /api/test/seed で userRepository + authIdentityRepository に書込
// 2. next-auth/jwt encode で session JWT を作り Playwright context cookie に注入
// 以降 page.goto('/profile') 等は認証済として通る。
export const signInAs = async (
  context: BrowserContext,
  baseURL: string,
  user: SeedUser,
): Promise<void> => {
  const seedRes = await context.request.post(`${baseURL}/api/test/seed`, {
    data: {
      user: {
        id: user.id,
        nickname: user.nickname,
        tone: user.tone,
        email: user.email,
        currentSigns: [],
        presenceVisibility: 'visible',
      },
      providerId: user.providerId,
    },
  })
  if (!seedRes.ok()) {
    throw new Error(`seed failed: ${seedRes.status()} ${await seedRes.text()}`)
  }
  const secret = process.env.AUTH_SECRET
  if (secret === undefined || secret.length === 0) {
    throw new Error('AUTH_SECRET is required for session encoding')
  }
  const encode = await loadEncode()
  const token = await encode({
    token: {
      sub: user.providerId,
      email: user.email,
      userId: user.id,
      providerId: user.providerId,
    },
    secret,
    salt: SESSION_COOKIE_NAME,
  })
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}
