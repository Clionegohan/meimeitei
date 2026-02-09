import { test, expect } from '@playwright/test'

test.describe('F006: User Session Management', () => {
  test.beforeEach(async ({ context }) => {
    // localStorage完全クリア（各テスト前に初期化）
    await context.clearCookies()
    await context.addInitScript(() => {
      localStorage.clear()
    })
  })

  test('AC-1: 初回訪問時にuserIdがlocalStorageに保存される', async ({
    page,
  }) => {
    // Given: 初回訪問（localStorageは空）
    await page.goto('/enter')

    // When: 名前入力して入店
    await page.fill('input[id="name-input"]', 'テストユーザー')
    await page.click('button[type="submit"]')

    // Then: /barページに遷移
    await expect(page).toHaveURL('/bar')

    // Then: localStorageに`meimei_userId`が保存される（UUID v4形式）
    const userId = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )
    expect(userId).toBeTruthy()
    // UUID v4形式の正規表現チェック
    expect(userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('AC-2: リロード時に同一ユーザーとして認識される（チャット履歴復元）', async ({
    page,
  }) => {
    // Given: 入店済み
    await page.goto('/enter')
    await page.fill('input[id="name-input"]', 'テストユーザー')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    // userIdを保存
    const originalUserId = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )

    // WebSocket接続を待機
    await page.waitForTimeout(1000)

    // チャットメッセージを送信
    const chatInput = page.locator('input[type="text"]').last()
    await chatInput.fill('テストメッセージ1')
    const sendButton = page.locator('button[type="submit"]').last()
    await sendButton.click()

    // メッセージが表示されることを確認
    await expect(page.locator('text=テストメッセージ1')).toBeVisible()

    // When: ブラウザリロード
    await page.reload()

    // WebSocket再接続を待機
    await page.waitForTimeout(1000)

    // Then: 同じuserIdが保持される
    const reloadedUserId = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )
    expect(reloadedUserId).toBe(originalUserId)

    // Then: チャット履歴が復元される
    await expect(page.locator('text=テストメッセージ1')).toBeVisible()
  })

  test('AC-3: localStorage削除後は新規ユーザーとして扱われる', async ({
    page,
  }) => {
    // Given: 入店済み
    await page.goto('/enter')
    await page.fill('input[id="name-input"]', 'テストユーザー')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    const originalUserId = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )

    // When: localStorage削除
    await page.evaluate(() => localStorage.clear())

    // /enterに戻る
    await page.goto('/enter')

    // 名前入力して再入店
    await page.fill('input[id="name-input"]', 'テストユーザー2')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    // Then: 新しいuserIdが生成される
    const newUserId = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )
    expect(newUserId).toBeTruthy()
    expect(newUserId).not.toBe(originalUserId)

    // UUID v4形式の確認
    expect(newUserId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('Edge Case: 特殊文字を含む名前でもセッション管理が正常動作', async ({
    page,
  }) => {
    // Given: 特殊文字を含む名前で入店
    await page.goto('/enter')
    await page.fill('input[id="name-input"]', '特殊文字🎉テスト')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    // userIdが保存される
    const userId = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )
    expect(userId).toBeTruthy()

    // WebSocket接続を待機
    await page.waitForTimeout(1000)

    // メッセージ送信
    const chatInput = page.locator('input[type="text"]').last()
    await chatInput.fill('メッセージ')
    const sendButton = page.locator('button[type="submit"]').last()
    await sendButton.click()
    await expect(page.locator('text=メッセージ')).toBeVisible()

    // リロード後も履歴が復元される
    await page.reload()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=メッセージ')).toBeVisible()
  })

  test('Edge Case: 境界値（1文字・20文字）でもセッション管理が正常動作', async ({
    page,
  }) => {
    // Given: 1文字の名前で入店
    await page.goto('/enter')
    await page.fill('input[id="name-input"]', 'あ')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    const userId1 = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )
    expect(userId1).toBeTruthy()

    // localStorage削除
    await page.evaluate(() => localStorage.clear())

    // Given: 20文字の名前で入店
    await page.goto('/enter')
    await page.fill('input[id="name-input"]', 'あ'.repeat(20))
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/bar')

    const userId2 = await page.evaluate(() =>
      localStorage.getItem('meimei_userId')
    )
    expect(userId2).toBeTruthy()
    expect(userId2).not.toBe(userId1)
  })
})
