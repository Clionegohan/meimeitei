import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer自動起動は使用しない（手動起動を推奨）
  //
  // 理由1: 環境変数の確実な設定
  //   - E2Eテスト時は NEXT_PUBLIC_DISABLE_STRICT_MODE=true が必須
  //   - webServer.env での環境変数設定が正しく機能しない場合がある
  //   - 手動起動なら環境変数を確実に設定できる
  //
  // 理由2: 複数サーバー起動の複雑性
  //   - backend (3001) と frontend (3002) を並列起動する必要がある
  //   - Playwright webServer配列での複数サーバー起動が不安定
  //   - タイムアウトエラーが頻発（特にNext.jsのビルドに時間がかかる）
  //
  // 理由3: デバッグの容易性
  //   - 手動起動ならサーバーログを直接確認できる
  //   - 問題発生時の切り分けが容易
  //
  // E2Eテスト実行前に以下のコマンドでサーバーを起動すること：
  //   ターミナル1: pnpm -F backend dev
  //   ターミナル2: PORT=3002 NEXT_PUBLIC_DISABLE_STRICT_MODE=true pnpm -F frontend dev
  //   ターミナル3: pnpm test:e2e
})
