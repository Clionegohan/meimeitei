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
  test('should persist name in localStorage after refresh', async ({ page }) => {
    await page.goto('/enter')

    // 名前を入力して入店
    await page.fill('input[type="text"]', 'Bob')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    // ページをリロード
    await page.reload()

    // localStorageに名前が保持されていることを確認
    const stored = await page.evaluate(() => localStorage.getItem('meimei_username'))
    expect(stored).toBe('Bob')
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
})
