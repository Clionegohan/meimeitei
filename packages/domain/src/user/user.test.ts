import { describe, expect, it } from 'vitest'
import { ValidationError } from '../shared/errors'
import type { UserId } from '../shared/id'
import { createUser, isSignTag, SIGN_TAGS, TONES, type User } from './user'

const baseInput = {
  id: 'u1' as UserId,
  nickname: 'tsukimi',
  joinedAt: new Date('2025-08-03T13:00:00Z'),
}

describe('createUser', () => {
  it('creates a user with defaults', () => {
    const u: User = createUser(baseInput)
    expect(u.id).toBe('u1')
    expect(u.nickname).toBe('tsukimi')
    expect(u.bio).toBe('')
    expect(u.tone).toBe('#E8E2D2')
    expect(u.presenceVisibility).toBe('visible')
    expect(u.currentSigns).toEqual([])
    expect(u.joinedAt.toISOString()).toBe('2025-08-03T13:00:00.000Z')
  })

  it('accepts custom optional values', () => {
    const u = createUser({
      ...baseInput,
      bio: '深夜に目覚める羊。\n月とほうじ茶が好き。',
      tone: '#D8B890',
      presenceVisibility: 'invisible',
      currentSigns: ['moon_gazing', 'nothing'],
    })
    expect(u.bio).toContain('深夜に目覚める羊')
    expect(u.tone).toBe('#D8B890')
    expect(u.presenceVisibility).toBe('invisible')
    expect(u.currentSigns).toEqual(['moon_gazing', 'nothing'])
  })

  it('rejects empty nickname', () => {
    expect(() => createUser({ ...baseInput, nickname: '' })).toThrow(ValidationError)
  })

  it('rejects whitespace-only nickname', () => {
    expect(() => createUser({ ...baseInput, nickname: '   ' })).toThrow(ValidationError)
    expect(() => createUser({ ...baseInput, nickname: '　　' })).toThrow(ValidationError)
  })

  it('rejects nickname longer than 20 graphemes', () => {
    const long = 'あ'.repeat(21)
    expect(() => createUser({ ...baseInput, nickname: long })).toThrow(ValidationError)
  })

  it('accepts nickname of exactly 20 graphemes', () => {
    const max = 'あ'.repeat(20)
    const u = createUser({ ...baseInput, nickname: max })
    expect(u.nickname).toBe(max)
  })

  it('rejects bio longer than 200 graphemes', () => {
    const long = 'あ'.repeat(201)
    expect(() => createUser({ ...baseInput, bio: long })).toThrow(ValidationError)
  })

  it('accepts bio of exactly 200 graphemes', () => {
    const max = 'あ'.repeat(200)
    const u = createUser({ ...baseInput, bio: max })
    expect(u.bio).toBe(max)
  })

  it('rejects tone not in the predefined palette', () => {
    expect(() =>
      createUser({ ...baseInput, tone: '#FF0000' as (typeof TONES)[number] }),
    ).toThrow(ValidationError)
  })
})

describe('SignTag (profile-only, english snake_case)', () => {
  it('exposes 8 sign tags', () => {
    expect(SIGN_TAGS).toEqual([
      'sleepless',
      'reading',
      'having_tea',
      'moon_gazing',
      'nothing',
      'wanting_to_hear',
      'shiritori',
      'staying_up_late',
    ])
  })

  it('isSignTag narrows arbitrary string', () => {
    expect(isSignTag('sleepless')).toBe(true)
    expect(isSignTag('eating')).toBe(false)
    expect(isSignTag('眠れない')).toBe(false)
  })
})

describe('TONES palette', () => {
  it('exposes the 6 design-defined tones', () => {
    expect(TONES).toEqual(['#E8E2D2', '#D8B890', '#D8CFB8', '#C8BFA0', '#B8A480', '#E8D2B8'])
  })
})
