// Clock port — abstracts "current time" so use cases can be tested
// with a fixed clock. Production uses systemClock.
export interface Clock {
  now(): Date
}

export const systemClock: Clock = {
  now: () => new Date(),
}
