import { test, expect, type Page, type BrowserContext } from '@playwright/test'

/**
 * F003: Seat System - E2E Tests
 *
 * Tests coverage:
 * - AC-1: 着席ボタンクリック → 座席状態変化
 * - AC-3: 複数ユーザー間での座席状態同期
 * - AC-4: 着席中のユーザーに🪑アイコン表示
 * - AC-5: ボタンテキストの動的変化
 */

/**
 * Helper: ユーザーを入店させる
 * @param page - Playwright Page
 * @param username - ユーザー名
 */
async function enterBar(page: Page, username: string): Promise<void> {
  await page.goto('/enter')
  await page.fill('input[id="name-input"]', username)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/bar')

  // WebSocket接続を待機（welcome + state_syncイベント受信）
  await page.waitForFunction(
    () => {
      const wsState = (window as any).__wsConnected
      return wsState === true
    },
    { timeout: 5000 }
  ).catch(() => {
    // タイムアウトしても続行（WebSocket接続チェックはベストエフォート）
  })

  // DOM更新を待機
  await page.waitForTimeout(500)
}

test.describe('F003: Seat System', () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリア
    await page.addInitScript(() => localStorage.clear())
  })

  /**
   * AC-1, AC-5: 着席ボタンをクリックすると座席状態が変化する
   *
   * Given: ユーザーが入店済み
   * When: "着席"ボタンをクリック
   * Then:
   * - ボタンテキストが"離席"に変化
   * - 参加者リストに🪑アイコンが表示される
   */
  test('should change seat state when clicking seat button', async ({ page }) => {
    // Given: ユーザーが入店済み
    await enterBar(page, 'テストユーザー')

    // When: 着席ボタンをクリック
    const seatButton = page.locator('button:has-text("着席")')
    await expect(seatButton).toBeVisible()
    await seatButton.click()

    // Then: ボタンテキストが "離席" に変化
    await expect(page.locator('button:has-text("離席")')).toBeVisible({ timeout: 3000 })

    // Then: 参加者リストに🪑アイコンが表示される
    await expect(page.locator('text=テストユーザー 🪑')).toBeVisible()
  })

  /**
   * AC-3: 複数ユーザー間で座席状態が同期される
   *
   * Given: 2人のユーザーが入店
   * When: User1が着席
   * Then: User2の画面でUser1に🪑アイコンが表示される
   */
  test('should sync seat state between multiple users', async ({ browser }) => {
    // Given: 2人のユーザーが入店
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // User1 入店
    await enterBar(page1, 'ユーザー1')

    // User2 入店
    await enterBar(page2, 'ユーザー2')

    // 両方のページで2人の参加者が表示されるまで待機
    await expect(page1.locator('text=参加者 (2)')).toBeVisible({ timeout: 5000 })
    await expect(page2.locator('text=参加者 (2)')).toBeVisible({ timeout: 5000 })

    // When: User1 が着席
    await page1.locator('button:has-text("着席")').click()

    // Then: User1の画面で🪑アイコン表示
    await expect(page1.locator('text=ユーザー1 🪑')).toBeVisible({ timeout: 3000 })

    // Then: User2の画面でUser1に🪑アイコン表示
    await expect(page2.locator('text=ユーザー1 🪑')).toBeVisible({ timeout: 3000 })

    // Cleanup
    await context1.close()
    await context2.close()
  })

  /**
   * AC-4: 着席中のユーザーに🪑アイコンが表示される
   *
   * Given: ユーザーが入店済み
   * When: 着席ボタンをクリック
   * Then: 参加者リストに🪑アイコンが表示される
   */
  test('should display 🪑 icon for seated users', async ({ page }) => {
    // Given: 入店済み
    await enterBar(page, 'テストユーザー')

    // When: 着席
    await page.click('button:has-text("着席")')

    // Then: 参加者リストに🪑アイコン表示
    await expect(page.locator('text=テストユーザー 🪑')).toBeVisible({ timeout: 3000 })

    // "あなた" ラベルも確認
    await expect(page.locator('text=テストユーザー 🪑 (あなた)')).toBeVisible()
  })

  /**
   * AC-5: 離席すると🪑アイコンが消える
   *
   * Given: ユーザーが着席済み
   * When: 離席ボタンをクリック
   * Then:
   * - ボタンテキストが"着席"に変化
   * - 🪑アイコンが消える
   */
  test('should remove 🪑 icon when user leaves seat', async ({ page }) => {
    // Given: 着席済み
    await enterBar(page, 'テストユーザー')
    await page.click('button:has-text("着席")')
    await expect(page.locator('text=テストユーザー 🪑')).toBeVisible({ timeout: 3000 })

    // When: 離席
    await page.click('button:has-text("離席")')

    // Then: ボタンテキストが"着席"に変化
    await expect(page.locator('button:has-text("着席")')).toBeVisible({ timeout: 3000 })

    // Then: 🪑アイコンが消える
    await expect(page.locator('text=テストユーザー 🪑')).not.toBeVisible()

    // "あなた" ラベルは残る
    await expect(page.locator('text=テストユーザー (あなた)')).toBeVisible()
  })

  /**
   * Edge Case: 複数回の着席/離席トグル
   *
   * Given: ユーザーが入店済み
   * When: 着席 → 離席 → 着席を繰り返す
   * Then: 状態が正しく反転する
   */
  test('should toggle seat state multiple times correctly', async ({ page }) => {
    await enterBar(page, 'トグルユーザー')

    // 1回目: 着席
    await page.click('button:has-text("着席")')
    await expect(page.locator('button:has-text("離席")')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=トグルユーザー 🪑')).toBeVisible()

    // 2回目: 離席
    await page.click('button:has-text("離席")')
    await expect(page.locator('button:has-text("着席")')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=トグルユーザー 🪑')).not.toBeVisible()

    // 3回目: 着席
    await page.click('button:has-text("着席")')
    await expect(page.locator('button:has-text("離席")')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=トグルユーザー 🪑')).toBeVisible()
  })

  /**
   * Edge Case: ページリロード後の座席状態復元
   *
   * Given: ユーザーが着席している
   * When: ページをリロード
   * Then: 座席状態が維持される
   */
  test('should restore seat state after page reload', async ({ page }) => {
    await enterBar(page, 'リロードユーザー')

    // 着席
    await page.click('button:has-text("着席")')
    await expect(page.locator('button:has-text("離席")')).toBeVisible({ timeout: 3000 })

    // ページリロード
    await page.reload()

    // localStorageから名前を取得して再入店
    const username = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(username).toBe('リロードユーザー')

    // WebSocket再接続待機
    await page.waitForFunction(
      () => (window as any).__wsConnected === true,
      { timeout: 5000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)

    // 座席状態が復元されている（state_syncイベント）
    // Note: 現在の実装ではstate_syncでseated情報が含まれている
    await expect(page.locator('text=リロードユーザー 🪑')).toBeVisible({ timeout: 3000 })
  })
})
