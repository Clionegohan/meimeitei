import type {
  LoginHistoryRepository,
  NightId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

// LoginHistory は (userId, nightId) 複合 PK で自然に冪等。
// recordIfFirstOfNight は `INSERT ... ON CONFLICT DO NOTHING` 相当を
// upsert で表現する（update 側は no-op）。
export const createPrismaLoginHistoryRepository = (
  prisma: PrismaClient,
): LoginHistoryRepository => ({
  recordIfFirstOfNight: async (userId, nightId, at) => {
    await prisma.loginHistory.upsert({
      where: { userId_nightId: { userId, nightId } },
      update: {},
      create: { userId, nightId, firstSeenAt: at },
    })
  },
  listNightsByUser: async (userId) => {
    const rows = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { nightId: 'desc' },
      select: { nightId: true },
    })
    return rows.map((r) => r.nightId as NightId)
  },
})
