'use server'

import { auth } from '@/auth'
import { sendMessage } from '@/server/di'
import type { ConversationId } from '@me-me-en/domain'

export type MessageDto = {
  id: string
  conversationId: string
  senderId: string
  body: string
  sentAt: string
  readAt: string | null
}

export type SendMessageActionResult =
  | { ok: true; message: MessageDto }
  | { ok: false; error: string }

export const sendMessageAction = async (input: {
  conversationId: ConversationId
  body: string
}): Promise<SendMessageActionResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    const msg = await sendMessage({
      senderId: session.userId,
      conversationId: input.conversationId,
      body: input.body,
    })
    return {
      ok: true,
      message: {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        body: msg.body,
        sentAt: msg.sentAt.toISOString(),
        readAt: msg.readAt?.toISOString() ?? null,
      },
    }
  } catch (e) {
    if (e instanceof Error) return { ok: false, error: e.message }
    return { ok: false, error: '不明なエラー' }
  }
}
