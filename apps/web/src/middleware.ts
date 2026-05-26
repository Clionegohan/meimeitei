import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Auth gate (営業時間 / closed handling は Phase 5-2 で middleware 内に追加).
//
// 状態遷移:
//   未ログイン            -> /login にリダイレクト（公開ルート除く）
//   ログイン済 + User なし -> /onboarding に強制
//   ログイン済 + User あり -> そのまま通過
export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const path = nextUrl.pathname

  const isAuthApi = path.startsWith('/api/auth')
  const isLoginPage = path === '/login'
  const isOnboardingPage = path === '/onboarding'
  const isHealth = path === '/api/health'
  const isPublic = isAuthApi || isLoginPage || isHealth

  if (session === null) {
    if (isPublic) return NextResponse.next()
    const url = nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in to Google, but no me-me-en User yet -> force onboarding.
  if (session.userId === undefined && !isOnboardingPage && !isPublic) {
    const url = nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Logged in with me-me-en User -> if visiting /login or /onboarding, send home.
  if (session.userId !== undefined && (isLoginPage || isOnboardingPage)) {
    const url = nextUrl.clone()
    url.pathname = '/chats'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  // Run on all routes except Next internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
