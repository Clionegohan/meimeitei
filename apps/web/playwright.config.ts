import { defineConfig } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

// .env.local を spec process / webServer 両方に読み込む。AUTH_SECRET を
// 揃えることで session cookie の encode / decode が一致する。
dotenvConfig({ path: '.env.local' })

// E2E configuration for me-me-en.
// - Boots `pnpm dev` (custom tsx server) and runs tests against it
// - 既存 public-surface smoke + session-injection で authenticated state を作る spec
//   (BYPASS_BUSINESS_HOURS / E2E_TEST_ENABLED を渡すと営業時間外 + protected page も触れる)
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        // .env.local の AUTH_SECRET と spec process の AUTH_SECRET を一致させる。
        // 明示的に上書きせず、process.env (= dotenvConfig 後) を継承させる。
        env: {
          AUTH_SECRET:
            process.env.AUTH_SECRET ?? 'playwright-smoke-secret-do-not-use-in-prod',
          BYPASS_BUSINESS_HOURS: process.env.BYPASS_BUSINESS_HOURS ?? '',
          E2E_TEST_ENABLED: process.env.E2E_TEST_ENABLED ?? '',
          DATA_STORE: process.env.DATA_STORE ?? 'memory',
          ...(process.env.DATABASE_URL !== undefined && {
            DATABASE_URL: process.env.DATABASE_URL,
          }),
        },
      },
})
