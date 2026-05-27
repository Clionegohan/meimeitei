'use server'

import { auth } from '@/auth'
import { startConversationDirect, updateProfile } from '@/server/di'
import type {
  FavoriteMoon,
  PresenceVisibility,
  SignTag,
  Tone,
  UserId,
} from '@me-me-en/domain'

export type UpdateProfileResult = { ok: true } | { ok: false; error: string }

export const updateProfileAction = async (input: {
  nickname?: string
  bio?: string
  tone?: Tone
  presenceVisibility?: PresenceVisibility
  currentSigns?: readonly SignTag[]
  // 「好きな月」: null で「未設定に戻す」、未指定 (undefined) で変更なし
  favoriteMoon?: FavoriteMoon | null
}): Promise<UpdateProfileResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    const patch: {
      nickname?: string
      bio?: string
      tone?: Tone
      presenceVisibility?: PresenceVisibility
      currentSigns?: readonly SignTag[]
      favoriteMoon?: FavoriteMoon | null
    } = {}
    if (input.nickname !== undefined) patch.nickname = input.nickname
    if (input.bio !== undefined) patch.bio = input.bio
    if (input.tone !== undefined) patch.tone = input.tone
    if (input.presenceVisibility !== undefined)
      patch.presenceVisibility = input.presenceVisibility
    if (input.currentSigns !== undefined) patch.currentSigns = input.currentSigns
    if (input.favoriteMoon !== undefined) patch.favoriteMoon = input.favoriteMoon
    await updateProfile({ userId: session.userId, patch })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}

export type DirectMessageResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string }

export const startDirectMessageAction = async (input: {
  partnerId: string
}): Promise<DirectMessageResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    const conv = await startConversationDirect({
      initiatorId: session.userId,
      partnerId: input.partnerId as UserId,
    })
    return { ok: true, conversationId: conv.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}
