import { describe, expect, it } from 'vitest'
import type { NightId, UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaLoginHistoryRepository } from '../login-history-repository'

const alice = 'u_alice' as UserId

describe('PrismaLoginHistoryRepository (integration)', () => {
  it('recordIfFirstOfNight is idempotent — second call is no-op', async () => {
    const repo = createPrismaLoginHistoryRepository(prisma)
    const at1 = new Date('2026-05-25T22:30:00Z')
    const at2 = new Date('2026-05-25T23:30:00Z')

    await repo.recordIfFirstOfNight(alice, '2026-05-25' as NightId, at1)
    await repo.recordIfFirstOfNight(alice, '2026-05-25' as NightId, at2)

    const row = await prisma.loginHistory.findUnique({
      where: { userId_nightId: { userId: alice, nightId: '2026-05-25' } },
    })
    expect(row?.firstSeenAt.toISOString()).toBe(at1.toISOString())
  })

  it('listNightsByUser returns descending NightIds without duplicates', async () => {
    const repo = createPrismaLoginHistoryRepository(prisma)
    const now = new Date('2026-05-25T22:30:00Z')

    await repo.recordIfFirstOfNight(alice, '2026-05-23' as NightId, now)
    await repo.recordIfFirstOfNight(alice, '2026-05-25' as NightId, now)
    await repo.recordIfFirstOfNight(alice, '2026-05-24' as NightId, now)
    // 重複 (idempotent)
    await repo.recordIfFirstOfNight(alice, '2026-05-24' as NightId, now)

    const nights = await repo.listNightsByUser(alice)
    expect(nights).toEqual(['2026-05-25', '2026-05-24', '2026-05-23'])
  })
})
