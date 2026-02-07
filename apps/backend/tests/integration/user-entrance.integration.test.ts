import { describe, it, expect } from 'vitest'
import { JoinEventSchema } from '@meimei-tei/shared'

describe('F002: User Entrance Integration Tests', () => {
  // AC-5: サーバーサイドZodバリデーション
  describe('Server-side Zod Validation', () => {
    it('should reject empty name', () => {
      expect(() =>
        JoinEventSchema.parse({ type: 'join', name: '' })
      ).toThrow()
    })

    it('should reject name with only whitespace', () => {
      expect(() =>
        JoinEventSchema.parse({ type: 'join', name: '   ' })
      ).toThrow()
    })

    it('should reject name exceeding 20 characters', () => {
      const longName = 'A'.repeat(21)
      expect(() =>
        JoinEventSchema.parse({ type: 'join', name: longName })
      ).toThrow()
    })

    it('should accept valid name', () => {
      const result = JoinEventSchema.parse({ type: 'join', name: 'Alice' })
      expect(result.name).toBe('Alice')
    })

    it('should trim whitespace from name', () => {
      const result = JoinEventSchema.parse({ type: 'join', name: '  Alice  ' })
      expect(result.name).toBe('Alice')
    })

    it('should accept exactly 20 characters', () => {
      const exactName = 'A'.repeat(20)
      const result = JoinEventSchema.parse({ type: 'join', name: exactName })
      expect(result.name).toBe(exactName)
    })

    it('should accept names with special characters', () => {
      const result = JoinEventSchema.parse({ type: 'join', name: '@#$%' })
      expect(result.name).toBe('@#$%')
    })

    it('should accept names with emoji', () => {
      const result = JoinEventSchema.parse({ type: 'join', name: '😀Alice😁' })
      expect(result.name).toBe('😀Alice😁')
    })
  })

  // AC-6とAC-7は実際のWebSocket接続を必要とするため、E2Eテストで検証する
  // これにより、実際のユーザーフローをより正確にテストできる
})
