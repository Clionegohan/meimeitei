import { describe, expect, it } from 'vitest'
import { ValidationError } from '../shared/errors'
import type { UserId } from '../shared/id'
import { createUser, isSignTag, SIGN_TAGS, type User } from './user'

const baseInput = {
  id: 'u1' as UserId,
  nickname: '月見羊',
  sealCharacter: '月',
  joinedAt: new Date('2025-08-03T13:00:00Z'),
}

describe('createUser', () => {
  it('creates a user with defaults', () => {
    const u: User = createUser(baseInput)
    expect(u.id).toBe('u1')
    expect(u.nickname).toBe('月見羊')
    expect(u.bio).toBe('')
    expect(u.tone).toBe('#E8E2D2')
    expect(u.sealCharacter).toBe('月')
    expect(u.presenceVisibility).toBe('visible')
    expect(u.currentSigns).toEqual([])
    expect(u.joinedAt.toISOString()).toBe('2025-08-03T13:00:00.000Z')
  })

  it('accepts custom optional values', () => {
    const u = createUser({
      ...baseInput,
      bio: '夜更かしの羊。\nほうじ茶と文庫本が好きです。',
      tone: '#D8B890',
      presenceVisibility: 'invisible',
      currentSigns: ['月を眺める', '何でもない'],
    })
    expect(u.bio).toContain('夜更かしの羊')
    expect(u.tone).toBe('#D8B890')
    expect(u.presenceVisibility).toBe('invisible')
    expect(u.currentSigns).toEqual(['月を眺める', '何でもない'])
  })

  it('rejects empty nickname', () => {
    expect(() => createUser({ ...baseInput, nickname: '' })).toThrow(ValidationError)
  })

  it('rejects whitespace-only nickname', () => {
    expect(() => createUser({ ...baseInput, nickname: '   ' })).toThrow(ValidationError)
    expect(() => createUser({ ...baseInput, nickname: '　　' })).toThrow(ValidationError)
  })

  it('rejects empty sealCharacter', () => {
    expect(() => createUser({ ...baseInput, sealCharacter: '' })).toThrow(ValidationError)
  })

  it('rejects multi-character sealCharacter', () => {
    expect(() => createUser({ ...baseInput, sealCharacter: '月見' })).toThrow(ValidationError)
  })

})

describe('SignTag', () => {
  it('exposes the full sign set used in profile and posts', () => {
    expect(SIGN_TAGS).toContain('眠れない')
    expect(SIGN_TAGS).toContain('寝る前に')
    expect(SIGN_TAGS).toContain('独り言')
    expect(SIGN_TAGS).toContain('しりとり')
    expect(SIGN_TAGS).toContain('読書中')
    expect(SIGN_TAGS).toContain('お茶を一杯')
    expect(SIGN_TAGS).toContain('月を眺める')
    expect(SIGN_TAGS).toContain('何でもない')
    expect(SIGN_TAGS).toContain('声を聞きたい')
    expect(SIGN_TAGS).toContain('夜更かし')
    expect(SIGN_TAGS.length).toBe(10)
  })

  it('isSignTag narrows arbitrary string', () => {
    expect(isSignTag('眠れない')).toBe(true)
    expect(isSignTag('not-a-sign')).toBe(false)
    expect(isSignTag('')).toBe(false)
  })
})
