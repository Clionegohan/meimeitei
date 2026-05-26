import { NextResponse } from 'next/server'
import { isOpen } from '@me-me-en/domain'
import { auth } from '@/auth.edge'

// Combined gate: business hours + authentication.
//
// 1. Outside business hours (22:00-05:00 JST) -> /closed
//    Public exceptions: /closed itself, /api/auth/*, /api/health.
// 2. Inside business hours visiting /closed -> /chats
// 3. Unauthenticated -> /login (except public routes)
// 4. Authenticated without me-me-en User -> /onboarding
// 5. Authenticated with User visiting /login or /onboarding -> /chats
export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const path = nextUrl.pathname

  const isAuthApi = path.startsWith('/api/auth')
  const isLoginPage = path === '/login'
  const isOnboardingPage = path === '/onboarding'
  const isClosedPage = path === '/closed'
  const isHealth = path === '/api/health'
  const isPublic = isAuthApi || isLoginPage || isHealth || isClosedPage

  const businessHoursOpen = isOpen(new Date())

  // (1) Business hours gate
  if (!businessHoursOpen) {
    if (isClosedPage || isAuthApi || isHealth) return NextResponse.next()
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

  // (4) Auth but no User -> onboarding
  if (session.userId === undefined && !isOnboardingPage && !isPublic) {
    const url = nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // (5) Auth + User on /login or /onboarding -> /chats
  if (session.userId !== undefined && (isLoginPage || isOnboardingPage)) {
    const url = nextUrl.clone()
    url.pathname = '/chats'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
