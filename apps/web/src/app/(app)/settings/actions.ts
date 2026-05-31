'use server'

import { auth, signOut } from '@/auth'
import { deleteAccount, unblockUser } from '@/server/di'
import type { UserId } from '@me-me-en/domain'

export type SettingsResult = { ok: true } | { ok: false; error: string }

// 退苑 (アカウント削除)。成功したら sign-out して /login へ送る。
// signOut は redirect を throw するので try の外で呼ぶ。
export const deleteAccountAction = async (): Promise<SettingsResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    await deleteAccount({ userId: session.userId })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
  await signOut({ redirectTo: '/login' })
  return { ok: true }
}

// お品書きの「遮断した羊」一覧からの解除。
export const unblockFromSettingsAction = async (input: {
  targetId: string
}): Promise<SettingsResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    await unblockUser({
      blockerId: session.userId,
      blockedId: input.targetId as UserId,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}
