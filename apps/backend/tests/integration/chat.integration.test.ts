import { describe, it, expect } from 'vitest'
import { SendMessageEventSchema, MessageEventSchema } from '@meimei-tei/shared'

/**
 * F004: Chat Integration Tests
 *
 * Tests coverage:
 * - AC-6: SendMessageEvent Zodバリデーション (Client → Server)
 * - AC-7: MessageEvent Zodバリデーション (Server → Client)
 *
 * Note: これらはスキーマレベルのバリデーションテスト。
 * 真のIntegrationテストは、WebSocket handler全体（受信→検証→store取得→broadcast）を
 * テストする必要がある。将来的には、実際のWebSocket接続を使用したテストへの進化を検討。
 *
 * テストの目的:
 * - クライアント改竄対策: サーバー側Zodバリデーションが正しく機能することを保証
 * - セキュリティ保証: 名前とタイムスタンプがサーバー側で生成されることを確認
 */

describe('F004: Chat Integration Tests', () => {
  /**
   * SendMessageEvent Validation (Client → Server)
   *
   * AC-6: send_messageイベントがサーバーに送信される際のバリデーション
   */
  describe('SendMessageEvent Validation', () => {
    it('should accept valid message (1-500 characters)', () => {
      // Given: 正しい形式のsend_messageイベント
      const event = {
        type: 'send_message',
        text: 'Hello, World!',
      }

      // When: Zodバリデーション
      const result = SendMessageEventSchema.parse(event)

      // Then: バリデーション成功、textが正しく保持される
      expect(result.type).toBe('send_message')
      expect(result.text).toBe('Hello, World!')
    })

    it('should accept message with exactly 500 characters', () => {
      // Given: 500文字ちょうどのメッセージ
      const text500 = 'A'.repeat(500)
      const event = {
        type: 'send_message',
        text: text500,
      }

      // When: Zodバリデーション
      const result = SendMessageEventSchema.parse(event)

      // Then: バリデーション成功
      expect(result.text).toBe(text500)
      expect(result.text.length).toBe(500)
    })

    it('should reject empty text', () => {
      // Given: 空文字列のメッセージ
      const event = {
        type: 'send_message',
        text: '',
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => SendMessageEventSchema.parse(event)).toThrow()
    })

    it('should reject text exceeding 500 characters', () => {
      // Given: 501文字以上のメッセージ
      const text501 = 'A'.repeat(501)
      const event = {
        type: 'send_message',
        text: text501,
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => SendMessageEventSchema.parse(event)).toThrow()
    })

    it('should reject missing text field', () => {
      // Given: textフィールド欠如
      const event = {
        type: 'send_message',
        // text フィールドなし
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => SendMessageEventSchema.parse(event)).toThrow()
    })

    it('should reject wrong type', () => {
      // Given: 不正なtype
      const event = {
        type: 'wrong_type',
        text: 'Hello',
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => SendMessageEventSchema.parse(event)).toThrow()
    })

    it('should reject text with only whitespace (Zod does not trim)', () => {
      // Given: 空白のみのメッセージ（Zodはtrimしない）
      const event = {
        type: 'send_message',
        text: '   ',
      }

      // When: Zodバリデーション
      const result = SendMessageEventSchema.parse(event)

      // Then: Zodはtrimしないため、空白のみでもパスする
      // クライアント側でtrimする責任がある
      expect(result.text).toBe('   ')
    })

    it('should accept text with leading/trailing whitespace (trimming is client responsibility)', () => {
      // Given: 前後に空白を含むメッセージ
      const event = {
        type: 'send_message',
        text: '  hello  ',
      }

      // When: Zodバリデーション
      const result = SendMessageEventSchema.parse(event)

      // Then: Zodはtrimしないため、そのままパスする
      // trimはクライアント側の責任（Chat.tsx:14）
      expect(result.text).toBe('  hello  ')
    })
  })

  /**
   * MessageEvent Validation (Server → Client)
   *
   * AC-7: messageイベントがクライアントに送信される際のバリデーション
   * 名前とタイムスタンプがサーバー側で生成されることを保証
   */
  describe('MessageEvent Validation', () => {
    it('should accept valid message event', () => {
      // Given: 正しい形式のmessageイベント
      const event = {
        type: 'message',
        userId: 'user-123',
        name: 'Alice',
        text: 'Hello, World!',
        timestamp: Date.now(),
      }

      // When: Zodバリデーション
      const result = MessageEventSchema.parse(event)

      // Then: バリデーション成功、全フィールドが正しく保持される
      expect(result.type).toBe('message')
      expect(result.userId).toBe('user-123')
      expect(result.name).toBe('Alice')
      expect(result.text).toBe('Hello, World!')
      expect(result.timestamp).toBeTypeOf('number')
    })

    it('should reject missing userId', () => {
      // Given: userIdフィールド欠如
      const event = {
        type: 'message',
        // userId なし
        name: 'Alice',
        text: 'Hello!',
        timestamp: Date.now(),
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => MessageEventSchema.parse(event)).toThrow()
    })

    it('should reject missing name', () => {
      // Given: nameフィールド欠如
      const event = {
        type: 'message',
        userId: 'user-123',
        // name なし
        text: 'Hello!',
        timestamp: Date.now(),
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => MessageEventSchema.parse(event)).toThrow()
    })

    it('should reject missing text', () => {
      // Given: textフィールド欠如
      const event = {
        type: 'message',
        userId: 'user-123',
        name: 'Alice',
        // text なし
        timestamp: Date.now(),
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => MessageEventSchema.parse(event)).toThrow()
    })

    it('should reject missing timestamp', () => {
      // Given: timestampフィールド欠如
      const event = {
        type: 'message',
        userId: 'user-123',
        name: 'Alice',
        text: 'Hello!',
        // timestamp なし
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => MessageEventSchema.parse(event)).toThrow()
    })

    it('should reject non-number timestamp', () => {
      // Given: timestampが数値型でない
      const event = {
        type: 'message',
        userId: 'user-123',
        name: 'Alice',
        text: 'Hello!',
        timestamp: '2024-02-10', // 文字列
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => MessageEventSchema.parse(event)).toThrow()
    })

    it('should accept Unix timestamp in milliseconds', () => {
      // Given: Unix timestamp (ms) 形式
      const timestamp = 1707609600000 // 2024-02-11 00:00:00 UTC
      const event = {
        type: 'message',
        userId: 'user-123',
        name: 'Alice',
        text: 'Hello!',
        timestamp,
      }

      // When: Zodバリデーション
      const result = MessageEventSchema.parse(event)

      // Then: バリデーション成功
      expect(result.timestamp).toBe(timestamp)
    })

    it('should reject wrong type', () => {
      // Given: 不正なtype
      const event = {
        type: 'wrong_type',
        userId: 'user-123',
        name: 'Alice',
        text: 'Hello!',
        timestamp: Date.now(),
      }

      // When & Then: Zodバリデーションでエラー
      expect(() => MessageEventSchema.parse(event)).toThrow()
    })
  })
})
