import { test, expect } from '@playwright/test'

test.describe('F002: User Entrance', () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリア（addInitScriptで効率化）
    await page.addInitScript(() => localStorage.clear())
  })

  // AC-1: 空の名前入力時のエラー表示
  test('should show error when name is empty', async ({ page }) => {
    await page.goto('/enter')

    // 送信ボタンをクリック（名前を入力せずに）
    await page.click('button[type="submit"]')

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=名前を入力してください')).toBeVisible()
  })

  // AC-1の変種: スペースのみの場合もエラー
  test('should show error when name is only whitespace', async ({ page }) => {
    await page.goto('/enter')

    // スペースのみを入力
    await page.fill('input[type="text"]', '   ')
    await page.click('button[type="submit"]')

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=名前を入力してください')).toBeVisible()
  })

  // AC-2: 有効な名前での入店成功
  test('should save name and redirect to /bar on valid input', async ({ page }) => {
    await page.goto('/enter')

    // 有効な名前を入力
    await page.fill('input[type="text"]', 'Alice')
    await page.click('button[type="submit"]')

    // /barにリダイレクトされることを確認
    await expect(page).toHaveURL('/bar')

    // localStorageに保存されていることを確認
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe('Alice')
  })

  // AC-3: 20文字超過時のエラー表示
  test('should show error when name exceeds 20 characters', async ({ page }) => {
    await page.goto('/enter')

    // 21文字の名前を入力
    const longName = 'A'.repeat(21)
    await page.fill('input[type="text"]', longName)
    await page.click('button[type="submit"]')

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=名前は20文字以内で入力してください')).toBeVisible()
  })

  // AC-2の境界値テスト: ちょうど20文字
  test('should accept exactly 20 characters', async ({ page }) => {
    await page.goto('/enter')

    // ちょうど20文字の名前を入力
    const exactName = 'A'.repeat(20)
    await page.fill('input[type="text"]', exactName)
    await page.click('button[type="submit"]')

    // /barにリダイレクトされることを確認
    await expect(page).toHaveURL('/bar')

    // localStorageに保存されていることを確認
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe(exactName)
  })

  // AC-8: localStorage永続化
  test('should persist name in localStorage after refresh', async ({ browser }) => {
    // このテストではaddInitScriptを使わずに手動でlocalStorageをクリア
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      // 手動でlocalStorageをクリア
      await page.goto('/enter')
      await page.evaluate(() => localStorage.clear())
      await page.reload()

      // 名前を入力して入店
      await page.fill('input[type="text"]', 'Bob')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/bar')

      // ページをリロード
      await page.reload()

      // localStorageに名前が保持されていることを確認
      const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
      expect(stored).toBe('Bob')
    } finally {
      await context.close()
    }
  })

  // AC-4に関連: 前後の空白がトリミングされる（E2Eレベル）
  test('should trim leading and trailing whitespace', async ({ page }) => {
    await page.goto('/enter')

    // 前後にスペースがある名前を入力
    await page.fill('input[type="text"]', '  Charlie  ')
    await page.click('button[type="submit"]')

    // /barにリダイレクトされることを確認
    await expect(page).toHaveURL('/bar')

    // トリムされた名前がlocalStorageに保存されていることを確認
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe('Charlie')
  })

  // エッジケース: 特殊文字を含む名前
  test('should accept names with special characters', async ({ page }) => {
    await page.goto('/enter')

    // 特殊文字を含む名前を入力
    await page.fill('input[type="text"]', '@#$%')
    await page.click('button[type="submit"]')

    // /barにリダイレクトされることを確認
    await expect(page).toHaveURL('/bar')

    // localStorageに保存されていることを確認
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe('@#$%')
  })

  // エッジケース: 絵文字を含む名前
  test('should accept names with emoji', async ({ page }) => {
    await page.goto('/enter')

    // 絵文字を含む名前を入力
    await page.fill('input[type="text"]', '😀Alice😁')
    await page.click('button[type="submit"]')

    // /barにリダイレクトされることを確認
    await expect(page).toHaveURL('/bar')

    // localStorageに保存されていることを確認
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe('😀Alice😁')
  })

  // UIテスト: エラー表示後に再入力できる
  test('should allow re-entry after error', async ({ page }) => {
    await page.goto('/enter')

    // 最初は空で送信してエラー
    await page.click('button[type="submit"]')
    await expect(page.locator('text=名前を入力してください')).toBeVisible()

    // 有効な名前を入力
    await page.fill('input[type="text"]', 'Dave')

    // エラーメッセージが消えることを確認（入力により）
    // （実装がonChangeでエラーをクリアしている場合）

    // 再送信
    await page.click('button[type="submit"]')

    // 成功してリダイレクト
    await expect(page).toHaveURL('/bar')
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe('Dave')
  })

  // AC-6: WebSocket参加イベントのブロードキャスト
  test('should broadcast user_joined event to other users', async ({ browser }) => {
    // 2つのブラウザコンテキストを作成
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // localStorageをクリア
    await page1.addInitScript(() => localStorage.clear())
    await page2.addInitScript(() => localStorage.clear())

    try {
      // User1が先に入店
      await page1.goto('/enter')
      await page1.fill('input[type="text"]', 'Alice')
      await page1.click('button[type="submit"]')
      await expect(page1).toHaveURL('/bar')
      // ページが完全にロードされるまで待つ
      await expect(page1.locator('h2:has-text("参加者")')).toBeVisible({ timeout: 10000 })

      // User2が入店
      await page2.goto('/enter')
      await page2.fill('input[type="text"]', 'Bob')
      await page2.click('button[type="submit"]')
      await expect(page2).toHaveURL('/bar')
      // ページが完全にロードされるまで待つ
      await expect(page2.locator('h2:has-text("参加者")')).toBeVisible({ timeout: 10000 })

      // User2の画面でまず自分自身が表示されることを確認
      await expect(page2.locator('li:has-text("Bob")')).toBeVisible({ timeout: 10000 })

      // User2の画面でUser1が既に存在することを確認（state_sync）
      // state_syncイベントで既存ユーザー一覧が送信される
      await expect(page2.locator('text=参加者 (2)')).toBeVisible({ timeout: 10000 })
      await expect(page2.locator('li:has-text("Alice")')).toBeVisible()

      // User1の画面で参加者が2人になるまで待つ（user_joinedブロードキャスト）
      await expect(page1.locator('text=参加者 (2)')).toBeVisible({ timeout: 10000 })

      // User1の画面でUser2が表示されることを確認
      await expect(page1.locator('li:has-text("Bob")')).toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  // AC-7: 重複入店の防止
  // 注: このテストはバックエンドのisJoinedフラグを検証するが、
  // フロントエンドからは通常2回目のjoinイベントを送信できない。
  // そのため、Integration Testで検証する方が適切。
  // E2Eレベルでは、「同じ名前で2回入店しようとした場合」をテストする。
  test('should handle duplicate entrance attempt gracefully', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    await page1.addInitScript(() => localStorage.clear())

    try {
      // User1が入店
      await page1.goto('/enter')
      await page1.fill('input[type="text"]', 'Charlie')
      await page1.click('button[type="submit"]')
      await expect(page1).toHaveURL('/bar')

      // 同じブラウザで再度/enterにアクセス（localStorageには既に名前がある）
      await page1.goto('/enter')

      // 既にlocalStorageに名前があるので、再度同じ名前で入店を試みる
      await page1.fill('input[type="text"]', 'Charlie')
      await page1.click('button[type="submit"]')
      await expect(page1).toHaveURL('/bar')

      // エラーが発生せず、正常に/barに遷移できることを確認
      // バックエンド側でisJoinedフラグにより重複ブロードキャストは防止される
      await expect(page1.locator('text=Charlie')).toBeVisible()
    } finally {
      await context1.close()
    }
  })
})
