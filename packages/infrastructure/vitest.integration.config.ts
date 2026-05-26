import { defineConfig } from 'vitest/config'

// Integration test config — 実 Postgres に対する Prisma adapter のテスト。
// 動作には DATABASE_URL と migration 適用済の DB が必要。
//   - local: docker compose up -d → pnpm test:integration
//   - CI:    GitHub Actions の services.postgres 経由
export default defineConfig({
  test: {
    include: ['src/**/__integration__/**/*.test.ts'],
    setupFiles: ['./test/integration-setup.ts'],
    // 同一 DB を共有するため並列実行を直列化する
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 30_000,
  },
})
