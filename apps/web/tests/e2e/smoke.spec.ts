import { test, expect } from '@playwright/test'

test.describe('public surface (smoke)', () => {
  test('/api/health returns 200 with status=ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = (await res.json()) as { status?: string; service?: string }
    expect(body.status).toBe('ok')
    expect(body.service).toBe('me-me-en')
  })

  test('unauthenticated root redirects to /login or /closed', async ({ page }) => {
    const response = await page.goto('/')
    // The middleware sends us to /closed (out of business hours) or /login
    // depending on the local clock. Either is acceptable for smoke.
    await expect(page).toHaveURL(/\/(login|closed)/)
    expect(response?.status() ?? 0).toBeLessThan(500)
  })

  test('/login renders the entry copy', async ({ page }) => {
    await page.goto('/login')
    // Either /login itself or the closed page took us here.
    const url = page.url()
    if (/\/closed$/.test(url)) {
      // closed page は <h1>閉 店</h1> (全角スペース入り) を render するため
      // /閉.?店/ で両表記を許容する。
      await expect(page.getByText(/閉.?店/)).toBeVisible()
    } else {
      await expect(page.getByRole('heading', { name: '迷羊苑' })).toBeVisible()
      await expect(page.getByRole('button', { name: '暖簾をくぐる' })).toBeVisible()
    }
  })
})
