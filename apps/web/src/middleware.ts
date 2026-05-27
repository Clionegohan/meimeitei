import { NextResponse } from 'next/server'
import { isOpen } from '@me-me-en/domain'
import { auth } from '@/auth.edge'

// Combined gate: business hours + authentication.
//
// middleware は edge runtime で動き、auth.edge は callbacks を持たない (Prisma を
// edge bundle に持ち込まないため)。したがって session.userId は常に undefined。
// 「me-me-en User 登録済かどうか」を必要とする redirect は server component
// (apps/web/src/app/(app)/layout.tsx 等) に集約する。middleware は最小限の
// gate (営業時間 + 未認証ブロック) のみを担う。
//
// 1. Outside business hours (22:00-05:00 JST) -> /closed
//    Public exceptions: /closed itself, /api/auth/*, /api/health.
// 2. Inside business hours visiting /closed -> /chats
// 3. Unauthenticated -> /login (except public routes)
// 4. (削除) "Auth but no User" の判定は middleware では行えない。
//    server component layer の (app)/layout.tsx と onboarding/page.tsx が
//    session.userId === undefined を見て onboarding / chats に振り分ける
export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const path = nextUrl.pathname

  const isAuthApi = path.startsWith('/api/auth')
  // /api/test/* は E2E (Playwright) 用の seed endpoint。route handler 側で
  // NODE_ENV !== 'production' && E2E_TEST_ENABLED === 'true' を要求するので、
  // middleware では public 扱いにして素通しする。
  const isTestApi = path.startsWith('/api/test')
  // /dev/* は dev 用の確認 page。page 側で NODE_ENV !== 'production' を強制。
  const isDevPage = path.startsWith('/dev')
  const isLoginPage = path === '/login'
  const isClosedPage = path === '/closed'
  const isHealth = path === '/api/health'
  const isPublic =
    isAuthApi || isTestApi || isDevPage || isLoginPage || isHealth || isClosedPage

  const businessHoursOpen = isOpen(new Date())

  // (1) Business hours gate
  if (!businessHoursOpen) {
    if (isClosedPage || isAuthApi || isTestApi || isDevPage || isHealth) return NextResponse.next()
    const url = nextUrl.clone()
    url.pathname = '/closed'
    return NextResponse.redirect(url)
  }

  // (2) Open but on /closed -> go home
  if (isClosedPage) {
    const url = nextUrl.clone()
    url.pathname = '/chats'
    return NextResponse.redirect(url)
  }

  // (3) Unauth -> login
  if (session === null) {
    if (isPublic) return NextResponse.next()
    const url = nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 認証済 + /login: middleware から /chats へ進める (server side で再評価して
  // onboarding 未完なら /onboarding へ rebounce する)
  if (isLoginPage) {
    const url = nextUrl.clone()
    url.pathname = '/chats'
    return NextResponse.redirect(url)
  }

  // 認証済 + /onboarding: middleware は通す。onboarding/page.tsx が
  // session.userId !== undefined を見て /chats に redirect する。

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
