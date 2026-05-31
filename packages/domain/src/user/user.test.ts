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
      tone: '#50B7F0',
      presenceVisibility: 'invisible',
      currentSigns: ['moon_gazing', 'nothing'],
    })
    expect(u.bio).toContain('深夜に目覚める羊')
    expect(u.tone).toBe('#50B7F0')
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
    expect(() => createUser({ ...baseInput, tone: '#FF0000' as (typeof TONES)[number] })).toThrow(
      ValidationError,
    )
  })
})

describe('SignTag (profile-only, english snake_case)', () => {
  it('exposes 7 sign tags', () => {
    expect(SIGN_TAGS).toEqual([
      'sleepless',
      'reading',
      'having_tea',
      'nightcap',
      'moon_gazing',
      'nothing',
      'staying_up_late',
    ])
  })

  it('isSignTag narrows arbitrary string', () => {
    expect(isSignTag('sleepless')).toBe(true)
    expect(isSignTag('nightcap')).toBe(true)
    expect(isSignTag('eating')).toBe(false)
    expect(isSignTag('眠れない')).toBe(false)
  })

  it('no longer exposes retired tags', () => {
    expect(isSignTag('shiritori')).toBe(false)
    expect(isSignTag('wanting_to_hear')).toBe(false)
  })
})

describe('TONES palette', () => {
  it('exposes the 50 design-defined tones (10 hues × 5 steps)', () => {
    expect(TONES).toEqual([
      '#E8B85A',
      '#F4D452',
      '#F8E7B4',
      '#F7F4BE',
      '#FCFCF2',
      '#F26A4B',
      '#F68B84',
      '#F7BFA2',
      '#F9CECE',
      '#F1E4E2',
      '#9C7E68',
      '#B2A36C',
      '#D8CDB2',
      '#DED2A2',
      '#E8E2D2',
      '#6E8C50',
      '#74C16E',
      '#AAC6AA',
      '#D0E1CD',
      '#EDF6ED',
      '#15637A',
      '#6E9AA0',
      '#5EC3C5',
      '#B4E3DF',
      '#E4F8F6',
      '#6E3A5E',
      '#B25179',
      '#BE809F',
      '#E4BED1',
      '#F7E9F0',
      '#E84B9F',
      '#F36DB1',
      '#F2B8D3',
      '#F5CFE7',
      '#FCEFF6',
      '#0E7EB8',
      '#50B7F0',
      '#86B6D3',
      '#B8DFF2',
      '#DDF0FA',
      '#5A6EC0',
      '#5F79E3',
      '#A8B7ED',
      '#CAD2F3',
      '#E9EDFA',
      '#8B5FC3',
      '#B17FE7',
      '#C8A8E9',
      '#DEC9F1',
      '#F0E7F8',
    ])
  })

  it('has exactly 50 tones', () => {
    expect(TONES).toHaveLength(50)
  })

  it('has no duplicate tones', () => {
    expect(new Set(TONES).size).toBe(TONES.length)
  })

  it('keeps the default tone (生成り) in the palette', () => {
    expect(TONES).toContain('#E8E2D2')
  })
})
