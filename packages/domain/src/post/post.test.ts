import { describe, expect, it } from 'vitest'
import { ValidationError } from '../shared/errors'
import type { PostId, UserId } from '../shared/id'
import { createPost, markPostAsDeleted, type Post } from './post'

// helper: build a Date representing the given JST wall clock
const jst = (y: number, m: number, d: number, h: number, min = 0): Date =>
  new Date(Date.UTC(y, m - 1, d, h - 9, min, 0))

const baseInput = {
  id: 'p1' as PostId,
  authorId: 'u1' as UserId,
  body: '眠れない夜。月が綺麗。',
  postedAt: jst(2026, 5, 26, 2, 0), // 02:00 JST belongs to 2026-05-25 night
}

describe('createPost', () => {
  it('creates a post and derives nightId from postedAt', () => {
    const p: Post = createPost(baseInput)
    expect(p.id).toBe('p1')
    expect(p.authorId).toBe('u1')
    expect(p.body).toBe('眠れない夜。月が綺麗。')
    expect(p.nightId).toBe('2026-05-25')
    expect(p.postedAt.toISOString()).toBe(baseInput.postedAt.toISOString())
    expect(p.deletedAt).toBeNull()
  })

  it('derives nightId = today when postedAt is at 22:00 JST', () => {
    const p = createPost({ ...baseInput, postedAt: jst(2026, 5, 25, 22, 0) })
    expect(p.nightId).toBe('2026-05-25')
  })

  it('derives nightId = previous day when postedAt is at 04:59 JST', () => {
    const p = createPost({ ...baseInput, postedAt: jst(2026, 5, 26, 4, 59) })
    expect(p.nightId).toBe('2026-05-25')
  })

  it('rejects postedAt outside business hours (12:00 JST)', () => {
    expect(() =>
      createPost({ ...baseInput, postedAt: jst(2026, 5, 25, 12, 0) }),
    ).toThrow(ValidationError)
  })

  it('rejects postedAt at 05:00 JST (closing edge)', () => {
    expect(() =>
      createPost({ ...baseInput, postedAt: jst(2026, 5, 26, 5, 0) }),
    ).toThrow(ValidationError)
  })

  it('rejects empty body', () => {
    expect(() => createPost({ ...baseInput, body: '' })).toThrow(ValidationError)
  })

  it('rejects whitespace-only body', () => {
    expect(() => createPost({ ...baseInput, body: '   ' })).toThrow(ValidationError)
  })

  it('rejects body longer than 280 graphemes', () => {
    const long = 'あ'.repeat(281)
    expect(() => createPost({ ...baseInput, body: long })).toThrow(ValidationError)
  })

  it('accepts body of exactly 280 graphemes', () => {
    const max = 'あ'.repeat(280)
    const p = createPost({ ...baseInput, body: max })
    expect(p.body).toBe(max)
  })

  it('preserves multiline body', () => {
    const body = '一行目\n二行目\n三行目'
    const p = createPost({ ...baseInput, body })
    expect(p.body).toBe(body)
  })
})

describe('markPostAsDeleted', () => {
  it('returns a new post with deletedAt set', () => {
    const p = createPost(baseInput)
    const deletedAt = jst(2026, 5, 26, 3, 0)
    const p2 = markPostAsDeleted(p, deletedAt)
    expect(p2.deletedAt?.toISOString()).toBe(deletedAt.toISOString())
    expect(p2).not.toBe(p)
    expect(p.deletedAt).toBeNull()
  })

  it('is idempotent — returns the same instance if already deleted', () => {
    const p1 = createPost(baseInput)
    const p2 = markPostAsDeleted(p1, jst(2026, 5, 26, 3, 0))
    const p3 = markPostAsDeleted(p2, jst(2026, 5, 26, 4, 0))
    expect(p3).toBe(p2)
  })
})
