import { test, expect } from '@playwright/test'
import { signInAs } from './_helpers'

// SP (モバイル幅) のナビ外殻 regression。
// desktop を汚さず md: 以下で SP layout を出す方針 (#30) を守れているかを守る:
//   - md:hidden の下段タブバーがモバイルで「見える」
//   - hidden md:flex のサイドバーがモバイルで「隠れる」
// desktop での逆 (タブ隠れ / サイドバー見える) も同 spec 内で確認する。
const alice = {
  id: 'u_e2e_sp',
  nickname: 'sp (e2e)',
  tone: '#E8E2D2',
  email: 'sp-e2e@example.com',
  providerId: 'google-sub-e2e-sp',
}

test.describe('SP (mobile viewport) のナビ外殻', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ context, baseURL }) => {
    await signInAs(context, baseURL ?? 'http://localhost:3000', alice)
  })

  test('モバイルでは下段タブが見え、サイドバーは隠れる', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page.getByRole('navigation', { name: '下段タブ' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'サイドバー' })).toBeHidden()
  })
})

test.describe('desktop のナビ外殻', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ context, baseURL }) => {
    await signInAs(context, baseURL ?? 'http://localhost:3000', alice)
  })

  test('desktop ではサイドバーが見え、下段タブは隠れる', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page.getByRole('complementary', { name: 'サイドバー' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '下段タブ' })).toBeHidden()
  })
})
