import { PrismaClient } from '../../prisma/generated/index.js'

// プロセス内 PrismaClient singleton。dev HMR で client を作り直さないために
// globalThis に逃がす （Prisma 公式パターン）。
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export type { PrismaClient }
