import type { PresenceEventRepository, UserId } from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type HourlyPresenceBucket = {
  hour: number // JST hour: 22, 23, 0, 1, 2, 3, 4, 5
  intensity: number // 0..1, normalized against the busiest bucket
}

export type GetHourlyPresenceChartDeps = {
  presenceEventRepository: PresenceEventRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type GetHourlyPresenceChartInput = { userId: UserId }

export type GetHourlyPresenceChart = (
  input: GetHourlyPresenceChartInput,
) => Promise<readonly HourlyPresenceBucket[]>

// In-business-hours JST clock buckets, in spec's display order.
const HOURS_JST = [22, 23, 0, 1, 2, 3, 4, 5] as const
const WINDOW_DAYS = 30

const jstHourOf = (utc: Date): number =>
  new Date(utc.getTime() + 9 * 60 * 60 * 1000).getUTCHours()

// Counts `online` events per business-hour bucket, then normalizes by max.
// More elaborate "time spent online" math would track online/offline pairs;
// MVPβ approximation: more 'online' events ≈ higher intensity at that hour.
export const createGetHourlyPresenceChart = (
  deps: GetHourlyPresenceChartDeps,
): GetHourlyPresenceChart => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const now = deps.clock.now()
  const from = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const events = await deps.presenceEventRepository.listByUserInWindow(
    input.userId,
    from,
    now,
  )
  const counts = new Map<number, number>()
  for (const h of HOURS_JST) counts.set(h, 0)
  for (const e of events) {
    if (e.type !== 'online') continue
    const h = jstHourOf(e.occurredAt)
    if (counts.has(h)) counts.set(h, (counts.get(h) ?? 0) + 1)
  }
  const max = Math.max(1, ...Array.from(counts.values()))
  return HOURS_JST.map((h) => ({
    hour: h,
    intensity: (counts.get(h) ?? 0) / max,
  }))
}
