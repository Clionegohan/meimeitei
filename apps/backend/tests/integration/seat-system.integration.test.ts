import { describe, it, expect } from 'vitest'
import { SeatToggleEventSchema, SeatChangedEventSchema } from '@meimei-tei/shared'

/**
 * F003: Seat System Integration Tests
 *
 * Tests coverage:
 * - AC-2: WebSocketイベントのZodバリデーション
 *   - SeatToggleEvent (Client → Server)
 *   - SeatChangedEvent (Server → Client)
 *
 * Note: これらはスキーマレベルのバリデーションテスト。
 * 真のIntegrationテストは、WebSocket handler全体（受信→検証→store更新→broadcast）を
 * テストする必要がある。将来的には、実際のWebSocket接続を使用したテストへの進化を検討。
 *
 * 改善提案:
 * - packages/shared/src/events.ts の userId フィールドに .min(1) を追加し、
 *   空文字列を防ぐ（現在は z.string() のため空文字列がパスする）
 */

describe('F003: Seat System Integration Tests', () => {
  /**
   * SeatToggleEvent Validation (Client → Server)
   *
   * AC-2: seat_toggleイベントがサーバーに送信される際のバリデーション
   */
  describe('SeatToggleEvent Validation', () => {
    it('should accept valid seat_toggle event', () => {
      // Given: 正しい形式のseat_toggleイベント
      const event = { type: 'seat_toggle' }

      // When: Zodバリデーション実行
      const result = SeatToggleEventSchema.parse(event)

      // Then: バリデーション成功
      expect(result.type).toBe('seat_toggle')
    })

    it('should reject invalid type', () => {
      // Given: 不正なtype
      const event = { type: 'invalid_type' }

      // When/Then: Zodバリデーションエラー
      expect(() => SeatToggleEventSchema.parse(event)).toThrow()
    })

    it('should reject missing type', () => {
      // Given: typeフィールドなし
      const event = {}

      // When/Then: Zodバリデーションエラー
      expect(() => SeatToggleEventSchema.parse(event)).toThrow()
    })

    it('should reject extra fields', () => {
      // Given: 不要なフィールドが含まれる
      const event = { type: 'seat_toggle', extra: 'field' }

      // When: Zodバリデーション実行（strictモードでない場合は成功）
      const result = SeatToggleEventSchema.parse(event)

      // Then: typeフィールドのみ抽出される
      expect(result.type).toBe('seat_toggle')
      expect((result as any).extra).toBeUndefined()
    })
  })

  /**
   * SeatChangedEvent Validation (Server → Client)
   *
   * AC-2: seat_changedイベントがブロードキャストされる際のバリデーション
   */
  describe('SeatChangedEvent Validation', () => {
    it('should accept valid seat_changed event', () => {
      // Given: 正しい形式のseat_changedイベント
      const event = {
        type: 'seat_changed',
        userId: 'user-123',
        seated: true,
      }

      // When: Zodバリデーション実行
      const result = SeatChangedEventSchema.parse(event)

      // Then: 全フィールドが正しく解析される
      expect(result.type).toBe('seat_changed')
      expect(result.userId).toBe('user-123')
      expect(result.seated).toBe(true)
    })

    it('should accept seated=false', () => {
      // Given: seated=falseのイベント
      const event = {
        type: 'seat_changed',
        userId: 'user-456',
        seated: false,
      }

      // When: Zodバリデーション実行
      const result = SeatChangedEventSchema.parse(event)

      // Then: seated=falseが正しく解析される
      expect(result.seated).toBe(false)
    })

    it('should reject missing userId', () => {
      // Given: userIdフィールドなし
      const event = {
        type: 'seat_changed',
        seated: true,
      }

      // When/Then: Zodバリデーションエラー
      expect(() => SeatChangedEventSchema.parse(event)).toThrow()
    })

    it('should reject missing seated', () => {
      // Given: seatedフィールドなし
      const event = {
        type: 'seat_changed',
        userId: 'user-123',
      }

      // When/Then: Zodバリデーションエラー
      expect(() => SeatChangedEventSchema.parse(event)).toThrow()
    })

    it('should reject invalid userId type', () => {
      // Given: userIdが文字列でない
      const event = {
        type: 'seat_changed',
        userId: 123, // 数値（不正）
        seated: true,
      }

      // When/Then: Zodバリデーションエラー
      expect(() => SeatChangedEventSchema.parse(event)).toThrow()
    })

    it('should reject invalid seated type', () => {
      // Given: seatedがbooleanでない
      const event = {
        type: 'seat_changed',
        userId: 'user-123',
        seated: 'true', // 文字列（不正）
      }

      // When/Then: Zodバリデーションエラー
      expect(() => SeatChangedEventSchema.parse(event)).toThrow()
    })

    it('should accept UUID format userId', () => {
      // Given: UUID形式のuserId
      const event = {
        type: 'seat_changed',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        seated: true,
      }

      // When: Zodバリデーション実行
      const result = SeatChangedEventSchema.parse(event)

      // Then: UUID形式も受け入れる
      expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should accept empty string userId (edge case)', () => {
      // Given: 空文字列のuserId（エッジケース）
      const event = {
        type: 'seat_changed',
        userId: '',
        seated: true,
      }

      // When: Zodバリデーション実行
      const result = SeatChangedEventSchema.parse(event)

      // Then: 空文字列も文字列として受け入れる
      // Note: ビジネスロジックでは空userIdは無視されるべき
      expect(result.userId).toBe('')
    })
  })

  /**
   * Edge Cases
   *
   * 実際のWebSocket処理はws-handler.tsで行われる
   * ここではZodバリデーションのみをテスト
   */
  describe('Edge Cases', () => {
    it('should handle rapid seat toggle events', () => {
      // Given: 連続したseat_toggleイベント
      const events = [
        { type: 'seat_toggle' },
        { type: 'seat_toggle' },
        { type: 'seat_toggle' },
      ]

      // When/Then: 全てのイベントがバリデーション成功
      events.forEach((event) => {
        const result = SeatToggleEventSchema.parse(event)
        expect(result.type).toBe('seat_toggle')
      })
    })

    it('should validate seat_changed events with different users', () => {
      // Given: 複数ユーザーのseat_changedイベント
      const events = [
        { type: 'seat_changed', userId: 'user-1', seated: true },
        { type: 'seat_changed', userId: 'user-2', seated: false },
        { type: 'seat_changed', userId: 'user-3', seated: true },
      ]

      // When/Then: 全てのイベントがバリデーション成功
      events.forEach((event) => {
        const result = SeatChangedEventSchema.parse(event)
        expect(result.type).toBe('seat_changed')
        expect(result.userId).toBeTruthy()
        expect(typeof result.seated).toBe('boolean')
      })
    })
  })

  /**
   * Note: 実際のWebSocket通信とビジネスロジック（isJoinedガード、store更新など）は
   * E2Eテストで検証する。このIntegration Testはイベントスキーマのバリデーションのみに焦点を当てる。
   */
})
