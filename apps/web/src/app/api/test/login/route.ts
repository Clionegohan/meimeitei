import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import type { SignTag, Tone, UserId } from '@me-me-en/domain'
import { authIdentityRepository, userRepository } from '@/server/di'

// dev / E2E 用 1-click sign-in。OAuth credential を持たないローカル QA で使う。
// 本番では絶対に動かない:
//   - NODE_ENV !== 'production'
//   - E2E_TEST_ENABLED === 'true'
// のどちらかでも欠けたら 403。
//
// 例:
//   http://localhost:3000/api/test/login?nickname=alice
//   http://localhost:3000/api/test/login?id=u_bob&nickname=bob&tone=%23D8B890&to=/timeline
const isE2eAllowed = (): boolean =>
  process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_ENABLED === 'true'

const SESSION_COOKIE_NAME = 'authjs.session-token'
const DEFAULT_TONE: Tone = '#E8E2D2'

export async function GET(req: Request): Promise<NextResponse> {
  if (!isE2eAllowed()) {
    return NextResponse.json(
      { error: 'E2E login is disabled. Set E2E_TEST_ENABLED=true in non-production env.' },
      { status: 403 },
    )
  }
  const url = new URL(req.url)
  const nickname = url.searchParams.get('nickname') ?? 'alice'
  const id = (url.searchParams.get('id') ?? `u_dev_${nickname}`) as UserId
  const tone = (url.searchParams.get('tone') ?? DEFAULT_TONE) as Tone
  const email = url.searchParams.get('email') ?? `${nickname}@local.dev`
  const providerId = url.searchParams.get('providerId') ?? `google-sub-dev-${id}`
  const to = url.searchParams.get('to') ?? '/chats'

  // seed user + auth identity
  await userRepository.save({
    id,
    nickname,
    bio: '',
    tone,
    presenceVisibility: 'visible',
    currentSigns: [] as readonly SignTag[],
    favoriteMoon: null,
    joinedAt: new Date(),
  })
  await authIdentityRepository.upsert({
    provider: 'google',
    providerId,
    email,
    userId: id,
  })

  const secret = process.env.AUTH_SECRET
  if (secret === undefined || secret.length === 0) {
    return NextResponse.json({ error: 'AUTH_SECRET not set' }, { status: 500 })
  }

  const token = await encode({
    token: { sub: providerId, email, userId: id, providerId },
    secret,
    salt: SESSION_COOKIE_NAME,
  })

  // 302 redirect with Set-Cookie。ブラウザ navigation で「ログイン済み」状態が確立する。
  const response = NextResponse.redirect(new URL(to, url.origin), { status: 302 })
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // dev は http なので secure: false
    secure: false,
  })
  return response
}
