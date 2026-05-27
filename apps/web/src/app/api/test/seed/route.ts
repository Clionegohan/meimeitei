import { NextResponse } from 'next/server'
import type { SignTag, Tone, UserId } from '@me-me-en/domain'
import { authIdentityRepository, userRepository } from '@/server/di'

// E2E test 用の seed endpoint。本番では絶対動かない。
// AND 条件:
//   - NODE_ENV !== 'production'
//   - E2E_TEST_ENABLED === 'true'
// この 2 つを満たさない限り 403 で返す。
const isE2eAllowed = (): boolean =>
  process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_ENABLED === 'true'

type SeedUserInput = {
  id: string
  nickname: string
  bio?: string
  tone: string
  presenceVisibility?: 'visible' | 'invisible'
  currentSigns?: readonly string[]
  email?: string | null
  joinedAt?: string
}

type SeedRequestBody = {
  user: SeedUserInput
  providerId: string
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isE2eAllowed()) {
    return NextResponse.json(
      { error: 'E2E seed is disabled. Set E2E_TEST_ENABLED=true in non-production env.' },
      { status: 403 },
    )
  }
  const body = (await req.json()) as SeedRequestBody
  await userRepository.save({
    id: body.user.id as UserId,
    nickname: body.user.nickname,
    bio: body.user.bio ?? '',
    tone: body.user.tone as Tone,
    presenceVisibility: body.user.presenceVisibility ?? 'visible',
    currentSigns: (body.user.currentSigns ?? []) as readonly SignTag[],
    favoriteMoon: null,
    joinedAt: new Date(body.user.joinedAt ?? Date.now()),
  })
  await authIdentityRepository.upsert({
    provider: 'google',
    providerId: body.providerId,
    email: body.user.email ?? null,
    userId: body.user.id as UserId,
  })
  return NextResponse.json({ ok: true })
}
