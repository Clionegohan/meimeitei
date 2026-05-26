'use server'

import { auth } from '@/auth'
import { registerUser } from '@/server/di'
import { bindEmailToUser } from '@/server/auth/session-bridge'

export type RegisterUserActionResult =
  | { ok: true }
  | { ok: false; error: string }

export const registerUserAction = async (input: {
  nickname: string
}): Promise<RegisterUserActionResult> => {
  const session = await auth()
  if (session === null || typeof session.user?.email !== 'string') {
    return { ok: false, error: 'ログインが必要です' }
  }
  const email = session.user.email

  try {
    const user = await registerUser({ nickname: input.nickname })
    bindEmailToUser(email, user.id)
    return { ok: true }
  } catch (e) {
    if (e instanceof Error) return { ok: false, error: e.message }
    return { ok: false, error: '不明なエラー' }
  }
}
