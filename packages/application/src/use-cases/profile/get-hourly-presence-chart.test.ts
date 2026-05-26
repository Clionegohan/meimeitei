import { describe, expect, it } from 'vitest'
import { createPresenceEvent, type UserId } from '@me-me-en/domain'
import {
  fixedClock,
  inMemoryPresenceEventRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createGetHourlyPresenceChart } from './get-hourly-presence-chart'

const alice = 'u_alice' as UserId

describe('getHourlyPresenceChart', () => {
  it('returns 8 hour buckets in spec order (22, 23, 0..5)', async () => {
    const er = inMemoryPresenceEventRepo()
    const get = createGetHourlyPresenceChart({
      presenceEventRepository: er.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      businessHoursGuard: openGuard,
    })
    const buckets = await get({ userId: alice })
    expect(buckets.map((b) => b.hour)).toEqual([22, 23, 0, 1, 2, 3, 4, 5])
  })

  it('produces zero intensity when there are no events', async () => {
    const er = inMemoryPresenceEventRepo()
    const get = createGetHourlyPresenceChart({
      presenceEventRepository: er.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      businessHoursGuard: openGuard,
    })
    const buckets = await get({ userId: alice })
    for (const b of buckets) expect(b.intensity).toBe(0)
  })

  it('peaks at the JST hour where most online events landed', async () => {
    const er = inMemoryPresenceEventRepo()
    // 02:00 JST (most), 02:30 JST, 23:00 JST
    await er.repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: jst(2026, 5, 26, 2, 0),
      }),
    )
    await er.repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: jst(2026, 5, 26, 2, 30),
      }),
    )
    await er.repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: jst(2026, 5, 25, 23, 0),
      }),
    )

    const get = createGetHourlyPresenceChart({
      presenceEventRepository: er.repo,
      clock: fixedClock(jst(2026, 5, 26, 4, 0)),
      businessHoursGuard: openGuard,
    })
    const buckets = await get({ userId: alice })
    const at2 = buckets.find((b) => b.hour === 2)
    const at23 = buckets.find((b) => b.hour === 23)
    expect(at2?.intensity).toBe(1) // peak normalized to 1
    expect(at23?.intensity).toBeCloseTo(0.5, 3)
  })

  it('ignores offline events', async () => {
    const er = inMemoryPresenceEventRepo()
    await er.repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'offline',
        occurredAt: jst(2026, 5, 26, 2, 0),
      }),
    )
    const get = createGetHourlyPresenceChart({
      presenceEventRepository: er.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })
    const buckets = await get({ userId: alice })
    for (const b of buckets) expect(b.intensity).toBe(0)
  })
})
