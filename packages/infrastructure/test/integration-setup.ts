import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { prisma } from '../src/prisma/client'

// suite 開始時に migration を適用。何度走らせても idempotent。
beforeAll(() => {
  if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === '') {
    throw new Error(
      'integration tests require DATABASE_URL (e.g. postgresql://meimeitei:meimeitei@localhost:5432/meimeitei)',
    )
  }
  execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
    stdio: 'inherit',
    env: process.env as Record<string, string>,
  })
})

// 各 test の前に全テーブル truncate。テーブル順は外部キーがないのでどの順でも OK。
const TABLES = [
  'user_auth_identities',
  'login_history',
  'presence_events',
  'likes',
  'blocks',
  'messages',
  'posts',
  'conversations',
  'users',
] as const

beforeEach(async () => {
  // RESTART IDENTITY で presence_events.id の autoincrement もリセット
  const stmt = `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
  await prisma.$executeRawUnsafe(stmt)
})

afterAll(async () => {
  await prisma.$disconnect()
})
