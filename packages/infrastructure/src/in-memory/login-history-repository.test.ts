import { describe, expect, it } from 'vitest'
import type { NightId, UserId } from '@me-me-en/domain'
import { createInMemoryLoginHistoryRepository } from './login-history-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const n1 = '2026-05-25' as NightId
const n2 = '2026-05-26' as NightId
const at = (h: number) => new Date(`2026-05-26T0${h}:00:00Z`)

describe('InMemoryLoginHistoryRepository', () => {
  it('records a first login for a night', async () => {
    const repo = createInMemoryLoginHistoryRepository()
    await repo.recordIfFirstOfNight(alice, n1, at(2))
    const nights = await repo.listNightsByUser(alice)
    expect(nights).toEqual([n1])
  })

  it('is idempotent — repeat calls for the same (user, night) do not duplicate', async () => {
    const repo = createInMemoryLoginHistoryRepository()
    await repo.recordIfFirstOfNight(alice, n1, at(2))
    await repo.recordIfFirstOfNight(alice, n1, at(3))
    expect(await repo.listNightsByUser(alice)).toEqual([n1])
  })

  it('lists nights in descending order, deduped', async () => {
    const repo = createInMemoryLoginHistoryRepository()
    await repo.recordIfFirstOfNight(alice, n1, at(2))
    await repo.recordIfFirstOfNight(alice, n2, at(3))
    expect(await repo.listNightsByUser(alice)).toEqual([n2, n1])
  })

  it('returns empty for users with no record', async () => {
    const repo = createInMemoryLoginHistoryRepository()
    await repo.recordIfFirstOfNight(alice, n1, at(2))
    expect(await repo.listNightsByUser(bob)).toEqual([])
  })
})
