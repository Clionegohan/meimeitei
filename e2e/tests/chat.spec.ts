import { test, expect, type Page, type BrowserContext } from '@playwright/test'

/**
 * F004: Chat - E2E Tests
 *
 * Tests coverage:
 * - AC-1: メッセージ送信の基本機能
 * - AC-2: 複数ユーザー間でメッセージが同期される
 * - AC-3, AC-4: 空メッセージは送信されない
 * - AC-3: 長文メッセージの制限
 * - AC-4: 前後空白のトリミング
 * - AC-9: ページリロード後の履歴消失
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

  // 参加者リストが表示されるまで待機（WebSocket接続の確認）
  await expect(page.locator('text=参加者')).toBeVisible({ timeout: 5000 })

  // 入店したユーザー名が参加者リストに表示されるまで待機
  await expect(page.locator(`text=${username}`)).toBeVisible({ timeout: 5000 })
}

test.describe('F004: Chat', () => {
  test('AC-1: メッセージを送信すると表示され、フォームがクリアされる', async ({ page }) => {
    // Given: ユーザーが入店済み
    await enterBar(page, 'Alice')

    // When: メッセージ送信
    const inputSelector = 'input[placeholder*="メッセージを入力"]'
    await page.fill(inputSelector, 'Hello, World!')
    await page.press(inputSelector, 'Enter')

    // Then: メッセージが表示される
    // 送信者名が青色で表示される
    await expect(page.locator('span.text-blue-400:has-text("Alice:")')).toBeVisible({
      timeout: 5000,
    })

    // メッセージ本文が灰色で表示される
    await expect(page.locator('span.text-gray-200:has-text("Hello, World!")')).toBeVisible({
      timeout: 5000,
    })

    // Then: フォームがクリアされる
    await expect(page.locator(inputSelector)).toHaveValue('')
  })

  test('AC-2: 複数ユーザー間でメッセージが同期される', async ({ browser }) => {
    // Given: 2人のユーザーが入店
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    await enterBar(page1, 'Alice')
    await enterBar(page2, 'Bob')

    // When: Aliceがメッセージ送信
    const inputSelector = 'input[placeholder*="メッセージを入力"]'
    await page1.fill(inputSelector, 'Hello, Bob!')
    await page1.press(inputSelector, 'Enter')

    // Then: 両方の画面にメッセージが表示される
    // Page1（送信者）
    await expect(page1.locator('span.text-blue-400:has-text("Alice:")')).toBeVisible({
      timeout: 5000,
    })
    await expect(page1.locator('span.text-gray-200:has-text("Hello, Bob!")')).toBeVisible({
      timeout: 5000,
    })

    // Page2（受信者）
    await expect(page2.locator('span.text-blue-400:has-text("Alice:")')).toBeVisible({
      timeout: 5000,
    })
    await expect(page2.locator('span.text-gray-200:has-text("Hello, Bob!")')).toBeVisible({
      timeout: 5000,
    })

    // Cleanup
    await context1.close()
    await context2.close()
  })

  test('AC-3, AC-4: 空メッセージは送信されない', async ({ page }) => {
    // Given: ユーザーが入店済み
    await enterBar(page, 'Alice')

    // When: 空白のみを送信
    const inputSelector = 'input[placeholder*="メッセージを入力"]'
    await page.fill(inputSelector, '   ')
    await page.press(inputSelector, 'Enter')

    // Then: メッセージは表示されない（送信されない）
    // チャットエリア内に送信者名が表示されていないことを確認
    const chatMessages = page.locator('div.flex-1.overflow-y-auto span.text-blue-400')
    await expect(chatMessages).toHaveCount(0)
  })

  test('AC-3: 長文メッセージの制限（HTML maxLength）', async ({ page }) => {
    // Given: ユーザーが入店済み
    await enterBar(page, 'Alice')

    // When: 501文字以上を入力しようとする
    const inputSelector = 'input[placeholder*="メッセージを入力"]'
    const longText = 'A'.repeat(501)
    await page.fill(inputSelector, longText)

    // Then: HTML5 maxLengthにより500文字にカットされる
    const inputValue = await page.inputValue(inputSelector)
    expect(inputValue.length).toBe(500)

    // 送信してみる
    await page.press(inputSelector, 'Enter')

    // 500文字のメッセージが表示される
    await expect(
      page.locator(`span.text-gray-200:has-text("${'A'.repeat(500)}")`),
    ).toBeVisible({
      timeout: 5000,
    })
  })

  test('AC-4: 前後空白のトリミング', async ({ page }) => {
    // Given: ユーザーが入店済み
    await enterBar(page, 'Alice')

    // When: 前後にスペースを含むメッセージを送信
    const inputSelector = 'input[placeholder*="メッセージを入力"]'
    await page.fill(inputSelector, '  hello world  ')
    await page.press(inputSelector, 'Enter')

    // Then: トリミングされたメッセージが表示される
    await expect(page.locator('span.text-gray-200:has-text("hello world")')).toBeVisible({
      timeout: 5000,
    })

    // 前後のスペースは含まれていない（完全一致）
    const messageText = await page.locator('span.text-gray-200').first().textContent()
    expect(messageText).toBe('hello world')
  })

  test('AC-9: ページリロード後の履歴消失', async ({ page }) => {
    // Given: ユーザーが入店し、メッセージを送信
    await enterBar(page, 'Alice')

    const inputSelector = 'input[placeholder*="メッセージを入力"]'
    await page.fill(inputSelector, 'Test message')
    await page.press(inputSelector, 'Enter')

    // メッセージが表示されることを確認
    await expect(page.locator('span.text-gray-200:has-text("Test message")')).toBeVisible({
      timeout: 5000,
    })

    // When: ページをリロード
    await page.reload()

    // Then: メッセージ履歴が消える（永続化されない）
    // 入店画面にリダイレクトされるはず（sessionStorageがクリアされる）
    await expect(page).toHaveURL('/enter', { timeout: 5000 })
  })
})
