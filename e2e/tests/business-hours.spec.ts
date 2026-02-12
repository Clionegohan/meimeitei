import { test, expect } from '@playwright/test'

/**
 * F001: Business Hours Check - E2E Tests
 *
 * Tests coverage:
 * - AC-1: 営業時間内（22:00-04:00 JST）-> 入店画面（/enter）にリダイレクト
 * - AC-2: 営業時間外（04:00-22:00 JST）-> CLOSED画面表示
 * - Edge case: バックエンド未起動時 -> CLOSED表示（フォールバック）
 *
 * 前提条件:
 * - バックエンドは TEST_JST_HOUR 環境変数を設定して起動する必要がある
 * - 営業時間内テスト: TEST_JST_HOUR=23 pnpm -F backend dev
 * - 営業時間外テスト: TEST_JST_HOUR=12 pnpm -F backend dev
 *
 * 注意:
 * - E2Eテストでは実際のバックエンドAPIを呼び出すため、
 *   バックエンドの TEST_JST_HOUR 設定に依存する
 * - テスト実行前にバックエンドを適切な TEST_JST_HOUR で起動すること
 */

test.describe('F001: Business Hours Check', () => {
  /**
   * AC-1: 営業時間内アクセスで入店可能
   *
   * Given: バックエンドが TEST_JST_HOUR=23（営業時間内）で起動
   * When: ユーザーがトップページにアクセス
   * Then: 入店画面（/enter）にリダイレクトされる
   *
   * 注意: このテストはバックエンドを TEST_JST_HOUR=23 で起動している場合のみ成功
   */
  test('AC-1: should redirect to /enter during business hours', async ({ page }) => {
    // このテストは SKIP_BUSINESS_HOURS_CHECK=true で起動したバックエンドを使用
    // または TEST_JST_HOUR=23 で起動したバックエンドを使用

    // トップページにアクセス
    await page.goto('/')

    // Loadingが表示され、その後リダイレクトまたはCLOSED表示
    // 営業時間内の場合: /enter にリダイレクト
    // リダイレクトを待機（最大5秒）
    await expect(page).toHaveURL('/enter', { timeout: 10000 })
  })

  /**
   * AC-2: 営業時間外アクセスでCLOSED表示
   *
   * Given: バックエンドが営業時間外のレスポンスを返す
   * When: ユーザーがトップページにアクセス
   * Then: CLOSED画面が表示される
   *
   * 手法: ネットワークモッキングで /api/status を { open: false } に偽装
   */
  test('AC-2: should show CLOSED during non-business hours', async ({ page }) => {
    // /api/status のレスポンスをモック: { open: false }
    await page.route('**/api/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ open: false }),
      })
    })

    // トップページにアクセス
    await page.goto('/')

    // Loadingが表示され、その後CLOSED表示
    await expect(page.locator('text=CLOSED')).toBeVisible({ timeout: 10000 })

    // 営業時間案内が表示される
    await expect(page.locator('text=営業時間: 22:00 - 04:00 (JST)')).toBeVisible()

    // /enter にはリダイレクトされない
    await expect(page).not.toHaveURL('/enter')
  })

  /**
   * Edge Case: バックエンド未起動時のフォールバック
   *
   * Given: バックエンドが起動していない（ネットワークエラー）
   * When: ユーザーがトップページにアクセス
   * Then: CLOSED画面が表示される（フォールバック動作）
   *
   * 手法: ネットワークリクエストをabortしてエラーを発生させる
   */
  test('should show CLOSED when backend is not available (fallback)', async ({ page }) => {
    // /api/status のリクエストをabort（ネットワークエラーをシミュレート）
    await page.route('**/api/status', async (route) => {
      await route.abort('failed')
    })

    // トップページにアクセス
    await page.goto('/')

    // フェッチエラー時はCLOSED表示（フォールバック）
    await expect(page.locator('text=CLOSED')).toBeVisible({ timeout: 10000 })

    // 営業時間案内も表示される
    await expect(page.locator('text=営業時間: 22:00 - 04:00 (JST)')).toBeVisible()
  })

  /**
   * UI要素テスト: CLOSED画面の構成要素
   *
   * Given: 営業時間外
   * When: トップページにアクセス
   * Then: 店名、CLOSED表示、営業時間案内が表示される
   *
   * 手法: ネットワークモッキングで { open: false } を返す
   */
  test('should display proper CLOSED screen elements', async ({ page }) => {
    // /api/status のレスポンスをモック: { open: false }
    await page.route('**/api/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ open: false }),
      })
    })

    await page.goto('/')

    // 店名が表示される
    await expect(page.locator('h1:has-text("めぃめぃ亭")')).toBeVisible({ timeout: 10000 })

    // CLOSED表示
    await expect(page.locator('text=CLOSED')).toBeVisible()

    // 営業時間案内
    await expect(page.locator('text=営業時間: 22:00 - 04:00 (JST)')).toBeVisible()
  })

  /**
   * UI要素テスト: Loading状態
   *
   * Given: ページ読み込み中
   * When: トップページにアクセス直後
   * Then: Loading表示が一瞬表示される
   *
   * 注意: Loadingは一瞬で消えるため、テストが不安定になる可能性あり
   */
  test('should show Loading state initially', async ({ page }) => {
    // ネットワークを遅延させてLoadingを確認
    await page.route('**/api/status', async (route) => {
      // 500ms遅延
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await page.goto('/')

    // Loading表示が見える
    await expect(page.locator('text=Loading...')).toBeVisible()

    // その後、Loading表示が消える（リダイレクトまたはCLOSED表示）
    await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 10000 })
  })
})

/**
 * 補足: E2Eテストの制限事項
 *
 * 1. バックエンドの環境変数を動的に変更できない
 *    - Playwrightからバックエンドプロセスの環境変数を変更することはできない
 *    - 営業時間内/外のテストを同時に実行することはできない
 *
 * 2. 推奨されるテスト方法
 *    - Unit Test: isOpen() のロジックを TEST_JST_HOUR でテスト ✓
 *    - Integration Test: GET /api/status を TEST_JST_HOUR でテスト ✓
 *    - E2E Test: 現在の状態（SKIP_BUSINESS_HOURS_CHECK=true）での基本動作確認
 *
 * 3. 完全なE2Eテストを行う場合
 *    - 営業時間内: TEST_JST_HOUR=23 pnpm -F backend dev
 *    - 営業時間外: TEST_JST_HOUR=12 pnpm -F backend dev
 *    - それぞれ別々に pnpm test:e2e を実行
 */
