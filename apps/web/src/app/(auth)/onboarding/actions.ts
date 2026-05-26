'use server'

import { auth } from '@/auth'
import { registerUser } from '@/server/di'
import { bindIdentity } from '@/server/auth/session-bridge'

export type RegisterUserActionResult =
  | { ok: true }
  | { ok: false; error: string }

export const registerUserAction = async (input: {
  nickname: string
}): Promise<RegisterUserActionResult> => {
  const session = await auth()
  if (session === null) {
    return { ok: false, error: 'ログインが必要です' }
  }
  // providerId (Google sub) は jwt callback で initial sign-in 時に焼き付けられる。
  // session を経由して取り出し、AuthIdentity の uniqueness key として使う。
  const providerId = session.providerId
  if (typeof providerId !== 'string' || providerId.length === 0) {
    return { ok: false, error: 'OAuth 識別子が取得できません。再ログインしてください' }
  }
  const email = typeof session.user?.email === 'string' ? session.user.email : null

  try {
    const user = await registerUser({ nickname: input.nickname })
    await bindIdentity('google', providerId, email, user.id)
    return { ok: true }
  } catch (e) {
    if (e instanceof Error) return { ok: false, error: e.message }
    return { ok: false, error: '不明なエラー' }
  }
}
