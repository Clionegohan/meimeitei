import { test, expect } from '@playwright/test'
import { signInAs } from './_helpers'

// onboarding 済の user として session cookie 注入で各 protected page を smoke。
// E2E_TEST_ENABLED=true + BYPASS_BUSINESS_HOURS=true 前提 (営業時間外でも触れる)。
test.describe('authenticated (seed + JWT cookie)', () => {
  const alice = {
    id: 'u_e2e_alice',
    nickname: 'alice (e2e)',
    tone: '#E8E2D2',
    email: 'alice-e2e@example.com',
    providerId: 'google-sub-e2e-alice',
  }

  test.beforeEach(async ({ context, baseURL }) => {
    await signInAs(context, baseURL ?? 'http://localhost:3000', alice)
  })

  test('/chats lists conversations (empty state ok)', async ({ page }) => {
    await page.goto('/chats')
    // TopBar の屋号が出る (γ UI: letter-spacing 表現なので text node は「迷羊苑」)
    await expect(page.getByText('迷羊苑').first()).toBeVisible()
  })

  test('/timeline renders the composer + heading', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page.getByRole('heading', { name: '軒先のつぶやき' })).toBeVisible()
  })

  test('/profile renders the onboarded user nickname and 来店帳', async ({ page }) => {
    await page.goto('/profile')
    // γ UI: 「あなたの席」は heading 要素でなく装飾 div。Sidebar の「己」サブラベルにも
    // 同テキストがあるため main 配下に絞る (strict mode 違反回避)。
    await expect(page.getByRole('main').getByText('あなたの席')).toBeVisible()
    await expect(page.getByText('alice (e2e)').first()).toBeVisible()
    await expect(page.getByText('来 店 帳')).toBeVisible()
  })

  test('/profile/[other] shows the other-user profile without owner stats', async ({
    page,
    context,
    baseURL,
  }) => {
    // 別 user を seed (alice の cookie は維持)
    const bob = {
      id: 'u_e2e_bob',
      nickname: 'bob (e2e)',
      tone: '#D8B890',
      email: 'bob-e2e@example.com',
      providerId: 'google-sub-e2e-bob',
    }
    // alice の cookie のまま bob を seed するため /api/test/seed を直接叩く
    const res = await context.request.post(`${baseURL ?? 'http://localhost:3000'}/api/test/seed`, {
      data: {
        user: { id: bob.id, nickname: bob.nickname, tone: bob.tone, email: bob.email },
        providerId: bob.providerId,
      },
    })
    expect(res.ok()).toBe(true)

    await page.goto(`/profile/${bob.id}`)
    await expect(page.getByText('bob (e2e)').first()).toBeVisible()
    // stats セクション (来店帳 / 在席の刻 / 親しい羊) は他者からは見えない
    await expect(page.getByText('来 店 帳')).toHaveCount(0)
  })
})
