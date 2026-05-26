import type {
  PresenceEvent,
  PresenceEventRepository,
  PresenceEventType,
  UserId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

type PresenceEventRow = {
  id: bigint
  userId: string
  type: string
  occurredAt: Date
}

const toEvent = (row: PresenceEventRow): PresenceEvent => ({
  userId: row.userId as UserId,
  type: row.type as PresenceEventType,
  occurredAt: row.occurredAt,
})

export const createPrismaPresenceEventRepository = (
  prisma: PrismaClient,
): PresenceEventRepository => ({
  record: async (event) => {
    await prisma.presenceEvent.create({
      data: {
        userId: event.userId,
        type: event.type,
        occurredAt: event.occurredAt,
      },
    })
  },
  listByUserInWindow: async (userId, from, to) => {
    const rows = await prisma.presenceEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: from, lt: to },
      },
      orderBy: { occurredAt: 'asc' },
    })
    return rows.map(toEvent)
  },
})
