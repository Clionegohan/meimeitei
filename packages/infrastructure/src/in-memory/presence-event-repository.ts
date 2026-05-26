import type { PresenceEvent, PresenceEventRepository } from '@me-me-en/domain'

// Append-only in-memory log. listByUserInWindow filters and returns
// ascending by occurredAt. Memory grows unbounded; production swap to a
// Postgres adapter that trims after N days.
export const createInMemoryPresenceEventRepository = (): PresenceEventRepository => {
  const events: PresenceEvent[] = []
  return {
    record: async (event) => {
      events.push(event)
    },
    listByUserInWindow: async (userId, from, to) => {
      const fromMs = from.getTime()
      const toMs = to.getTime()
      const result = events.filter((e) => {
        if (e.userId !== userId) return false
        const t = e.occurredAt.getTime()
        return t >= fromMs && t < toMs
      })
      result.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
      return result
    },
  }
}
