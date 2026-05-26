import { defineConfig } from 'vitest/config'

// Unit test config — in-memory adapter tests only.
// Integration tests (実 Postgres を要求) は __integration__ ディレクトリに置き、
// vitest.integration.config.ts で別 runner として走らせる。
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/__integration__/**', 'node_modules/**', 'prisma/generated/**'],
  },
})
