import type {
  Conversation,
  ConversationId,
  ConversationRepository,
  PostId,
  UserId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

type ConversationRow = {
  id: string
  participantAId: string
  participantBId: string
  rootPostId: string | null
  openedAt: Date
}

const toConversation = (row: ConversationRow): Conversation => ({
  id: row.id as ConversationId,
  // schema は (participantAId, participantBId) lex-asc に正規化された前提
  // で保存されている。domain の Conversation も正規化済の readonly tuple。
  participantIds: [row.participantAId as UserId, row.participantBId as UserId] as const,
  rootPostId: row.rootPostId === null ? null : (row.rootPostId as PostId),
  openedAt: row.openedAt,
})

const sortPair = (a: UserId, b: UserId): [UserId, UserId] =>
  a < b ? [a, b] : [b, a]

export const createPrismaConversationRepository = (
  prisma: PrismaClient,
): ConversationRepository => ({
  findById: async (id) => {
    const row = await prisma.conversation.findUnique({ where: { id } })
    return row === null ? null : toConversation(row)
  },
  findByPair: async (participants, rootPostId) => {
    const [a, b] = sortPair(participants[0], participants[1])
    const row = await prisma.conversation.findFirst({
      where: {
        participantAId: a,
        participantBId: b,
        rootPostId: rootPostId,
      },
    })
    return row === null ? null : toConversation(row)
  },
  save: async (conv) => {
    const [a, b] = sortPair(conv.participantIds[0], conv.participantIds[1])
    await prisma.conversation.upsert({
      where: { id: conv.id },
      update: {
        participantAId: a,
        participantBId: b,
        rootPostId: conv.rootPostId,
        openedAt: conv.openedAt,
      },
      create: {
        id: conv.id,
        participantAId: a,
        participantBId: b,
        rootPostId: conv.rootPostId,
        openedAt: conv.openedAt,
      },
    })
  },
  listByUser: async (userId) => {
    const rows = await prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      orderBy: { openedAt: 'desc' },
    })
    return rows.map(toConversation)
  },
})
