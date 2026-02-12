import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isOpen } from '../business-hours'

/**
 * F001: Business Hours Check - Unit Tests
 *
 * Tests coverage:
 * - AC-3: 境界値（開店）22:00:00 JST -> OPEN判定
 * - AC-4: 境界値（閉店）04:00:00 JST -> CLOSED判定
 * - Edge cases: 各時刻帯での判定
 *
 * テスト方法:
 * - TEST_JST_HOUR 環境変数を使って時刻をモック
 * - 実際のDate()は使わず、環境変数で制御
 */

describe('F001: Business Hours Check - isOpen()', () => {
  // 環境変数のバックアップ
  let originalTestJstHour: string | undefined
  let originalSkipCheck: string | undefined

  beforeEach(() => {
    // 環境変数をバックアップ
    originalTestJstHour = process.env.TEST_JST_HOUR
    originalSkipCheck = process.env.SKIP_BUSINESS_HOURS_CHECK

    // テスト前にクリア
    delete process.env.TEST_JST_HOUR
    delete process.env.SKIP_BUSINESS_HOURS_CHECK
  })

  afterEach(() => {
    // 環境変数を復元
    if (originalTestJstHour !== undefined) {
      process.env.TEST_JST_HOUR = originalTestJstHour
    } else {
      delete process.env.TEST_JST_HOUR
    }
    if (originalSkipCheck !== undefined) {
      process.env.SKIP_BUSINESS_HOURS_CHECK = originalSkipCheck
    } else {
      delete process.env.SKIP_BUSINESS_HOURS_CHECK
    }
  })

  describe('AC-3: 境界値テスト（開店）', () => {
    /**
     * AC-3: 22:00:00 JST -> OPEN判定
     *
     * Given: 現在時刻が22:00:00 JST（ちょうど開店時刻）
     * When: isOpen()を呼び出す
     * Then: trueを返す（OPEN判定）
     */
    it('should return true at exactly 22:00 JST (opening time)', () => {
      // Given: 時刻を22時に設定
      process.env.TEST_JST_HOUR = '22'

      // When: isOpen()を呼び出す
      const result = isOpen()

      // Then: OPEN判定（true）
      expect(result).toBe(true)
    })
  })

  describe('AC-4: 境界値テスト（閉店）', () => {
    /**
     * AC-4: 04:00:00 JST -> CLOSED判定
     *
     * Given: 現在時刻が04:00:00 JST（ちょうど閉店時刻）
     * When: isOpen()を呼び出す
     * Then: falseを返す（CLOSED判定）
     */
    it('should return false at exactly 04:00 JST (closing time)', () => {
      // Given: 時刻を4時に設定
      process.env.TEST_JST_HOUR = '4'

      // When: isOpen()を呼び出す
      const result = isOpen()

      // Then: CLOSED判定（false）
      expect(result).toBe(false)
    })
  })

  describe('営業時間内（22:00-04:00 JST）', () => {
    /**
     * 23時 -> OPEN判定
     *
     * Given: 現在時刻が23:00 JST
     * When: isOpen()を呼び出す
     * Then: trueを返す
     */
    it('should return true at 23:00 JST', () => {
      process.env.TEST_JST_HOUR = '23'
      expect(isOpen()).toBe(true)
    })

    /**
     * 0時（深夜）-> OPEN判定
     *
     * Given: 現在時刻が00:00 JST
     * When: isOpen()を呼び出す
     * Then: trueを返す
     */
    it('should return true at 00:00 JST (midnight)', () => {
      process.env.TEST_JST_HOUR = '0'
      expect(isOpen()).toBe(true)
    })

    /**
     * 1時 -> OPEN判定
     *
     * Given: 現在時刻が01:00 JST
     * When: isOpen()を呼び出す
     * Then: trueを返す
     */
    it('should return true at 01:00 JST', () => {
      process.env.TEST_JST_HOUR = '1'
      expect(isOpen()).toBe(true)
    })

    /**
     * 2時 -> OPEN判定
     *
     * Given: 現在時刻が02:00 JST
     * When: isOpen()を呼び出す
     * Then: trueを返す
     */
    it('should return true at 02:00 JST', () => {
      process.env.TEST_JST_HOUR = '2'
      expect(isOpen()).toBe(true)
    })

    /**
     * 3時 -> OPEN判定
     *
     * Given: 現在時刻が03:00 JST
     * When: isOpen()を呼び出す
     * Then: trueを返す
     */
    it('should return true at 03:00 JST', () => {
      process.env.TEST_JST_HOUR = '3'
      expect(isOpen()).toBe(true)
    })
  })

  describe('営業時間外（04:00-22:00 JST）', () => {
    /**
     * 5時 -> CLOSED判定
     *
     * Given: 現在時刻が05:00 JST
     * When: isOpen()を呼び出す
     * Then: falseを返す
     */
    it('should return false at 05:00 JST', () => {
      process.env.TEST_JST_HOUR = '5'
      expect(isOpen()).toBe(false)
    })

    /**
     * 12時（正午）-> CLOSED判定
     *
     * Given: 現在時刻が12:00 JST
     * When: isOpen()を呼び出す
     * Then: falseを返す
     */
    it('should return false at 12:00 JST (noon)', () => {
      process.env.TEST_JST_HOUR = '12'
      expect(isOpen()).toBe(false)
    })

    /**
     * 18時 -> CLOSED判定
     *
     * Given: 現在時刻が18:00 JST
     * When: isOpen()を呼び出す
     * Then: falseを返す
     */
    it('should return false at 18:00 JST', () => {
      process.env.TEST_JST_HOUR = '18'
      expect(isOpen()).toBe(false)
    })

    /**
     * 21時（開店1時間前）-> CLOSED判定
     *
     * Given: 現在時刻が21:00 JST
     * When: isOpen()を呼び出す
     * Then: falseを返す
     */
    it('should return false at 21:00 JST (one hour before opening)', () => {
      process.env.TEST_JST_HOUR = '21'
      expect(isOpen()).toBe(false)
    })
  })

  describe('SKIP_BUSINESS_HOURS_CHECK 環境変数', () => {
    /**
     * バイパス有効時は常にOPEN
     *
     * Given: SKIP_BUSINESS_HOURS_CHECK='true'
     * When: isOpen()を呼び出す（営業時間外の時刻でも）
     * Then: trueを返す
     */
    it('should return true when SKIP_BUSINESS_HOURS_CHECK is "true"', () => {
      // 営業時間外の時刻を設定
      process.env.TEST_JST_HOUR = '12'
      process.env.SKIP_BUSINESS_HOURS_CHECK = 'true'

      expect(isOpen()).toBe(true)
    })

    /**
     * バイパス無効時は通常判定
     *
     * Given: SKIP_BUSINESS_HOURS_CHECK='false'
     * When: isOpen()を呼び出す（営業時間外）
     * Then: 通常の判定結果（false）を返す
     */
    it('should use normal logic when SKIP_BUSINESS_HOURS_CHECK is "false"', () => {
      process.env.TEST_JST_HOUR = '12'
      process.env.SKIP_BUSINESS_HOURS_CHECK = 'false'

      expect(isOpen()).toBe(false)
    })
  })

  describe('TEST_JST_HOUR 環境変数のバリデーション', () => {
    /**
     * 無効な値（非数値）-> エラー
     *
     * Given: TEST_JST_HOUR='invalid'
     * When: isOpen()を呼び出す
     * Then: エラーをスロー
     */
    it('should throw error for invalid TEST_JST_HOUR (non-numeric)', () => {
      process.env.TEST_JST_HOUR = 'invalid'

      expect(() => isOpen()).toThrow(
        'Invalid TEST_JST_HOUR: "invalid". Must be a number between 0-23.'
      )
    })

    /**
     * 無効な値（範囲外: 負数）-> エラー
     *
     * Given: TEST_JST_HOUR='-1'
     * When: isOpen()を呼び出す
     * Then: エラーをスロー
     */
    it('should throw error for TEST_JST_HOUR less than 0', () => {
      process.env.TEST_JST_HOUR = '-1'

      expect(() => isOpen()).toThrow(
        'Invalid TEST_JST_HOUR: "-1". Must be a number between 0-23.'
      )
    })

    /**
     * 無効な値（範囲外: 24以上）-> エラー
     *
     * Given: TEST_JST_HOUR='24'
     * When: isOpen()を呼び出す
     * Then: エラーをスロー
     */
    it('should throw error for TEST_JST_HOUR greater than 23', () => {
      process.env.TEST_JST_HOUR = '24'

      expect(() => isOpen()).toThrow(
        'Invalid TEST_JST_HOUR: "24". Must be a number between 0-23.'
      )
    })

    /**
     * 有効な境界値（0）-> 正常動作
     *
     * Given: TEST_JST_HOUR='0'
     * When: isOpen()を呼び出す
     * Then: エラーなし、正常に判定
     */
    it('should accept TEST_JST_HOUR=0 as valid', () => {
      process.env.TEST_JST_HOUR = '0'

      expect(() => isOpen()).not.toThrow()
      expect(isOpen()).toBe(true) // 0時は営業中
    })

    /**
     * 有効な境界値（23）-> 正常動作
     *
     * Given: TEST_JST_HOUR='23'
     * When: isOpen()を呼び出す
     * Then: エラーなし、正常に判定
     */
    it('should accept TEST_JST_HOUR=23 as valid', () => {
      process.env.TEST_JST_HOUR = '23'

      expect(() => isOpen()).not.toThrow()
      expect(isOpen()).toBe(true) // 23時は営業中
    })
  })

  describe('Real Date Path (getJSTHour)', () => {
    /**
     * Real Date使用時のテスト
     *
     * Why: TEST_JST_HOUR未設定時のgetJSTHour()パスをテスト
     * Method: vi.useFakeTimers()でDateをモック
     */

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true when UTC time is 13:00 (JST 22:00)', () => {
      // UTC 13:00 = JST 22:00 (開店時刻)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-12T13:00:00Z'))

      expect(isOpen()).toBe(true)
    })

    it('should return true when UTC time is 18:00 (JST 03:00)', () => {
      // UTC 18:00 = JST 03:00（営業中）
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-12T18:00:00Z'))

      expect(isOpen()).toBe(true)
    })

    it('should return false when UTC time is 10:00 (JST 19:00)', () => {
      // UTC 10:00 = JST 19:00（営業時間外）
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-12T10:00:00Z'))

      expect(isOpen()).toBe(false)
    })

    it('should return false when UTC time is 19:00 (JST 04:00 - closing time)', () => {
      // UTC 19:00 = JST 04:00（閉店時刻、境界値）
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-12T19:00:00Z'))

      expect(isOpen()).toBe(false)
    })

    it('should return false when UTC time is 20:00 (JST 05:00)', () => {
      // UTC 20:00 = JST 05:00（閉店後）
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-12T20:00:00Z'))

      expect(isOpen()).toBe(false)
    })

    it('should handle UTC to JST conversion correctly at midnight', () => {
      // UTC 15:00 = JST 00:00（深夜、営業中）
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-12T15:00:00Z'))

      expect(isOpen()).toBe(true)
    })
  })
})
