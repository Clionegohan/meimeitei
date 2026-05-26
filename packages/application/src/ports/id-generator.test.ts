import { describe, expect, it } from 'vitest'
import { systemIdGenerator } from './id-generator'

describe('systemIdGenerator', () => {
  it('returns a non-empty string for each entity method', () => {
    expect(typeof systemIdGenerator.user()).toBe('string')
    expect(systemIdGenerator.user().length).toBeGreaterThan(0)
    expect(typeof systemIdGenerator.conversation()).toBe('string')
    expect(typeof systemIdGenerator.message()).toBe('string')
    expect(typeof systemIdGenerator.post()).toBe('string')
    expect(typeof systemIdGenerator.like()).toBe('string')
    expect(typeof systemIdGenerator.block()).toBe('string')
  })

  it('produces unique ids across consecutive calls', () => {
    const a = systemIdGenerator.user()
    const b = systemIdGenerator.user()
    expect(a).not.toBe(b)
  })

  it('returns a uuid-shaped string (36 chars, 4 hyphens)', () => {
    const id = systemIdGenerator.user()
    expect(id.length).toBe(36)
    expect((id.match(/-/g) ?? []).length).toBe(4)
  })
})
