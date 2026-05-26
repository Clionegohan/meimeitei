import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { listConversations, listMessages } from '@/server/di'
import type { ConversationId } from '@me-me-en/domain'
import { ThreadView } from './thread-view'

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const { conversationId: rawId } = await params
  const conversationId = rawId as ConversationId

  // Confirm the viewer is a participant. listMessages would also throw, but we
  // want a 404 for an unknown conversation rather than a server error.
  const myConversations = await listConversations({ userId: session.userId })
  const found = myConversations.find((c) => c.id === conversationId)
  if (!found) notFound()

  const messages = await listMessages({
    viewerId: session.userId,
    conversationId,
  })

  const initial = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    sentAt: m.sentAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  }))

  return (
    <ThreadView
      conversationId={conversationId}
      initialMessages={initial}
      myUserId={session.userId}
    />
  )
}
