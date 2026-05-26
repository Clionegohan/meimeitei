import type {
  SignTag,
  Tone,
  User,
  UserId,
  UserRepository,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

// row → domain entity の hydration。Prisma の `string` columns に対して
// branded 型を再付与する。永続層からの復元なので validation は通さず
// unsafe cast で復元する（書込時に validation 済みである前提）。
const toUser = (row: {
  id: string
  nickname: string
  bio: string
  tone: string
  presenceVisibility: string
  currentSigns: readonly string[]
  joinedAt: Date
}): User => ({
  id: row.id as UserId,
  nickname: row.nickname,
  bio: row.bio,
  tone: row.tone as Tone,
  presenceVisibility: row.presenceVisibility as 'visible' | 'invisible',
  currentSigns: [...row.currentSigns] as readonly SignTag[],
  joinedAt: row.joinedAt,
})

export const createPrismaUserRepository = (
  prisma: PrismaClient,
): UserRepository => ({
  findById: async (id) => {
    const row = await prisma.user.findUnique({ where: { id } })
    return row === null ? null : toUser(row)
  },
  findByNickname: async (nickname) => {
    // nickname に unique 制約は無い (重複可)。最初の 1 件を返す。
    const row = await prisma.user.findFirst({ where: { nickname } })
    return row === null ? null : toUser(row)
  },
  list: async () => {
    const rows = await prisma.user.findMany({ orderBy: { joinedAt: 'asc' } })
    return rows.map(toUser)
  },
  save: async (user) => {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        nickname: user.nickname,
        bio: user.bio,
        tone: user.tone,
        presenceVisibility: user.presenceVisibility,
        currentSigns: [...user.currentSigns],
        joinedAt: user.joinedAt,
      },
      create: {
        id: user.id,
        nickname: user.nickname,
        bio: user.bio,
        tone: user.tone,
        presenceVisibility: user.presenceVisibility,
        currentSigns: [...user.currentSigns],
        joinedAt: user.joinedAt,
      },
    })
  },
})
