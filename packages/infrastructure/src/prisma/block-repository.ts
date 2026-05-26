import type {
  Block,
  BlockId,
  BlockRepository,
  UserId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

type BlockRow = {
  id: string
  blockerId: string
  blockedId: string
  createdAt: Date
}

const toBlock = (row: BlockRow): Block => ({
  id: row.id as BlockId,
  blockerId: row.blockerId as UserId,
  blockedId: row.blockedId as UserId,
  createdAt: row.createdAt,
})

export const createPrismaBlockRepository = (
  prisma: PrismaClient,
): BlockRepository => ({
  findById: async (id) => {
    const row = await prisma.block.findUnique({ where: { id } })
    return row === null ? null : toBlock(row)
  },
  findBy: async (blockerId, blockedId) => {
    const row = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    })
    return row === null ? null : toBlock(row)
  },
  save: async (block) => {
    await prisma.block.upsert({
      where: { id: block.id },
      update: {
        blockerId: block.blockerId,
        blockedId: block.blockedId,
        createdAt: block.createdAt,
      },
      create: {
        id: block.id,
        blockerId: block.blockerId,
        blockedId: block.blockedId,
        createdAt: block.createdAt,
      },
    })
  },
  delete: async (id) => {
    await prisma.block.deleteMany({ where: { id } })
  },
  existsBetween: async (a, b) => {
    const row = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    })
    return row !== null
  },
  listBlockedBy: async (blockerId) => {
    const rows = await prisma.block.findMany({
      where: { blockerId },
      select: { blockedId: true },
    })
    return rows.map((r) => r.blockedId as UserId)
  },
  listBlockersOf: async (blockedId) => {
    const rows = await prisma.block.findMany({
      where: { blockedId },
      select: { blockerId: true },
    })
    return rows.map((r) => r.blockerId as UserId)
  },
})
