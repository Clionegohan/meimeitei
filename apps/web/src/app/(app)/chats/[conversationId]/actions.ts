'use server'

import { auth } from '@/auth'
import { sendMessage } from '@/server/di'
import { broadcastToConversation } from '@/server/realtime/io-bridge'
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
    const dto: MessageDto = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      sentAt: msg.sentAt.toISOString(),
      readAt: msg.readAt?.toISOString() ?? null,
    }
    // Realtime fan-out to everyone in the conv room (including the sender's
    // other tabs). The sender's current tab also receives, then de-dupes by id.
    broadcastToConversation(input.conversationId, 'message:new', dto)
    return { ok: true, message: dto }
  } catch (e) {
    if (e instanceof Error) return { ok: false, error: e.message }
    return { ok: false, error: '不明なエラー' }
  }
}
