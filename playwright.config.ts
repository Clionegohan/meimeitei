import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer設定は削除し、手動起動したサーバーを使用
  // E2Eテスト実行前に以下のコマンドでサーバーを起動すること：
  // フロントエンド: PORT=3002 NEXT_PUBLIC_DISABLE_STRICT_MODE=true pnpm -F frontend dev
  // バックエンド: pnpm -F backend dev
})
