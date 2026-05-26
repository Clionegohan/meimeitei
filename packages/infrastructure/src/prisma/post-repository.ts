import type {
  NightId,
  Post,
  PostId,
  PostRepository,
  UserId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

type PostRow = {
  id: string
  authorId: string
  body: string
  postedAt: Date
  nightId: string
  deletedAt: Date | null
}

const toPost = (row: PostRow): Post => ({
  id: row.id as PostId,
  authorId: row.authorId as UserId,
  body: row.body,
  postedAt: row.postedAt,
  nightId: row.nightId as NightId,
  deletedAt: row.deletedAt,
})

export const createPrismaPostRepository = (
  prisma: PrismaClient,
): PostRepository => ({
  findById: async (id) => {
    const row = await prisma.post.findUnique({ where: { id } })
    return row === null ? null : toPost(row)
  },
  save: async (post) => {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        authorId: post.authorId,
        body: post.body,
        postedAt: post.postedAt,
        nightId: post.nightId,
        deletedAt: post.deletedAt,
      },
      create: {
        id: post.id,
        authorId: post.authorId,
        body: post.body,
        postedAt: post.postedAt,
        nightId: post.nightId,
        deletedAt: post.deletedAt,
      },
    })
  },
  list: async (q) => {
    const rows = await prisma.post.findMany({
      where: {
        ...(q.nightId === undefined ? {} : { nightId: q.nightId }),
        ...(q.authorId === undefined ? {} : { authorId: q.authorId }),
        ...(q.before === undefined ? {} : { postedAt: { lt: q.before } }),
      },
      orderBy: { postedAt: 'desc' },
      ...(q.limit === undefined ? {} : { take: q.limit }),
    })
    return rows.map(toPost)
  },
})
