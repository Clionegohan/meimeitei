import { defineConfig } from '@playwright/test'

// E2E configuration for me-me-en.
// - Boots `pnpm dev` (custom tsx server) and runs tests against it.
// - Auth-protected flows require real OAuth which we can't drive headlessly,
//   so the smoke suite covers public routes only (health + redirect shape).
//   The DM/Timeline realtime flows are exercised by a local manual run
//   (two tabs after `pnpm dev`).
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
        // Auth.js requires AUTH_SECRET; provide a throwaway one for the
        // smoke suite (no real OAuth flow is exercised).
        env: {
          AUTH_SECRET: 'playwright-smoke-secret-do-not-use-in-prod',
        },
      },
})
