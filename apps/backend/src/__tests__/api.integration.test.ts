import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../app'

/**
 * F001: Business Hours Check - Integration Tests
 *
 * Tests coverage:
 * - GET /api/status エンドポイント
 * - 営業時間内: { open: true }
 * - 営業時間外: { open: false }
 * - レスポンス形式の検証
 *
 * テスト方法:
 * - Honoの app.request() を使用
 * - TEST_JST_HOUR 環境変数で時刻をモック
 */

describe('F001: Business Hours Check - API Integration', () => {
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

  describe('GET /api/status', () => {
    /**
     * 営業時間内（23時）-> { open: true }
     *
     * Given: 現在時刻が23:00 JST（営業時間内）
     * When: GET /api/status をリクエスト
     * Then: ステータス200、{ open: true } を返す
     */
    it('should return { open: true } during business hours (23:00 JST)', async () => {
      // Given: 時刻を23時に設定
      process.env.TEST_JST_HOUR = '23'

      // When: APIリクエスト
      const res = await app.request('/api/status')

      // Then: ステータス200、open: true
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json).toEqual({ open: true })
    })

    /**
     * 営業時間内（0時）-> { open: true }
     *
     * Given: 現在時刻が00:00 JST（営業時間内）
     * When: GET /api/status をリクエスト
     * Then: ステータス200、{ open: true } を返す
     */
    it('should return { open: true } at midnight (00:00 JST)', async () => {
      process.env.TEST_JST_HOUR = '0'

      const res = await app.request('/api/status')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ open: true })
    })

    /**
     * 営業時間内（22時・開店時刻）-> { open: true }
     *
     * Given: 現在時刻が22:00 JST（開店時刻）
     * When: GET /api/status をリクエスト
     * Then: ステータス200、{ open: true } を返す
     */
    it('should return { open: true } at opening time (22:00 JST)', async () => {
      process.env.TEST_JST_HOUR = '22'

      const res = await app.request('/api/status')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ open: true })
    })

    /**
     * 営業時間外（4時・閉店時刻）-> { open: false }
     *
     * Given: 現在時刻が04:00 JST（閉店時刻）
     * When: GET /api/status をリクエスト
     * Then: ステータス200、{ open: false } を返す
     */
    it('should return { open: false } at closing time (04:00 JST)', async () => {
      process.env.TEST_JST_HOUR = '4'

      const res = await app.request('/api/status')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ open: false })
    })

    /**
     * 営業時間外（12時）-> { open: false }
     *
     * Given: 現在時刻が12:00 JST（営業時間外）
     * When: GET /api/status をリクエスト
     * Then: ステータス200、{ open: false } を返す
     */
    it('should return { open: false } outside business hours (12:00 JST)', async () => {
      process.env.TEST_JST_HOUR = '12'

      const res = await app.request('/api/status')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ open: false })
    })

    /**
     * 営業時間外（21時・開店1時間前）-> { open: false }
     *
     * Given: 現在時刻が21:00 JST（開店1時間前）
     * When: GET /api/status をリクエスト
     * Then: ステータス200、{ open: false } を返す
     */
    it('should return { open: false } one hour before opening (21:00 JST)', async () => {
      process.env.TEST_JST_HOUR = '21'

      const res = await app.request('/api/status')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ open: false })
    })

    /**
     * レスポンス形式の検証
     *
     * Given: 任意の時刻
     * When: GET /api/status をリクエスト
     * Then: Content-Type: application/json を返す
     */
    it('should return JSON content type', async () => {
      process.env.TEST_JST_HOUR = '23'

      const res = await app.request('/api/status')

      expect(res.headers.get('Content-Type')).toMatch(/application\/json/)
    })

    /**
     * SKIP_BUSINESS_HOURS_CHECK 有効時の動作
     *
     * Given: SKIP_BUSINESS_HOURS_CHECK='true'、営業時間外
     * When: GET /api/status をリクエスト
     * Then: { open: true } を返す（バイパス有効）
     */
    it('should return { open: true } when SKIP_BUSINESS_HOURS_CHECK is enabled', async () => {
      process.env.TEST_JST_HOUR = '12' // 営業時間外
      process.env.SKIP_BUSINESS_HOURS_CHECK = 'true'

      const res = await app.request('/api/status')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ open: true })
    })
  })

  describe('GET /health', () => {
    /**
     * ヘルスチェックエンドポイント
     *
     * When: GET /health をリクエスト
     * Then: ステータス200、{ status: 'ok' } を返す
     */
    it('should return { status: "ok" }', async () => {
      const res = await app.request('/health')

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ status: 'ok' })
    })
  })

  describe('CORS', () => {
    /**
     * CORSヘッダーの検証
     *
     * When: GET /api/status をリクエスト
     * Then: Access-Control-Allow-Origin ヘッダーが存在する
     */
    it('should include CORS headers', async () => {
      process.env.TEST_JST_HOUR = '23'

      const res = await app.request('/api/status')

      // CORS有効化されている場合、Access-Control-Allow-Originヘッダーが含まれる
      // HonoのCORSミドルウェアはデフォルトで'*'を設定
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })
})
