import type {
  ConversationId,
  Message,
  MessageId,
  MessageRepository,
  UserId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

type MessageRow = {
  id: string
  conversationId: string
  senderId: string
  body: string
  sentAt: Date
  readAt: Date | null
  deletedAt: Date | null
}

const toMessage = (row: MessageRow): Message => ({
  id: row.id as MessageId,
  conversationId: row.conversationId as ConversationId,
  senderId: row.senderId as UserId,
  body: row.body,
  sentAt: row.sentAt,
  readAt: row.readAt,
  deletedAt: row.deletedAt,
})

export const createPrismaMessageRepository = (
  prisma: PrismaClient,
): MessageRepository => ({
  findById: async (id) => {
    const row = await prisma.message.findUnique({ where: { id } })
    return row === null ? null : toMessage(row)
  },
  save: async (msg) => {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: {
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        body: msg.body,
        sentAt: msg.sentAt,
        readAt: msg.readAt,
        deletedAt: msg.deletedAt,
      },
      create: {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        body: msg.body,
        sentAt: msg.sentAt,
        readAt: msg.readAt,
        deletedAt: msg.deletedAt,
      },
    })
  },
  listByConversation: async (q) => {
    const rows = await prisma.message.findMany({
      where: {
        conversationId: q.conversationId,
        ...(q.before === undefined ? {} : { sentAt: { lt: q.before } }),
      },
      orderBy: { sentAt: 'asc' },
      ...(q.limit === undefined ? {} : { take: q.limit }),
    })
    return rows.map(toMessage)
  },
  countByConversationsInWindow: async (ids, from, to) => {
    if (ids.length === 0) return new Map()
    const grouped = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: ids as readonly string[] as string[] },
        sentAt: { gte: from, lt: to },
      },
      _count: { _all: true },
    })
    const counts = new Map<ConversationId, number>()
    // 0 件の conversation も map に含めることで「ids にある全 id を key として持つ」
    // という application 層の期待を満たす。
    for (const id of ids) counts.set(id, 0)
    for (const g of grouped) {
      counts.set(g.conversationId as ConversationId, g._count._all)
    }
    return counts
  },
})
