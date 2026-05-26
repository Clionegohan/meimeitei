import type {
  Like,
  LikeId,
  LikeRepository,
  PostId,
  PostRepository,
  UserId,
} from '@me-me-en/domain'
import type { PrismaClient } from './client'

type LikeRow = {
  id: string
  postId: string
  userId: string
  addedAt: Date
}

const toLike = (row: LikeRow): Like => ({
  id: row.id as LikeId,
  postId: row.postId as PostId,
  userId: row.userId as UserId,
  addedAt: row.addedAt,
})

// countReceivedByUser は post の author を引く cross-repo query。
// in-memory 版と同じく PostRepository を DI で受け取り、
// 「user が author の post の ID 一覧」→ 「それらの like を count」で求める。
export const createPrismaLikeRepository = (
  prisma: PrismaClient,
  postRepository: PostRepository,
): LikeRepository => ({
  findById: async (id) => {
    const row = await prisma.like.findUnique({ where: { id } })
    return row === null ? null : toLike(row)
  },
  findByPostAndUser: async (postId, userId) => {
    const row = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    })
    return row === null ? null : toLike(row)
  },
  save: async (like) => {
    await prisma.like.upsert({
      where: { id: like.id },
      update: {
        postId: like.postId,
        userId: like.userId,
        addedAt: like.addedAt,
      },
      create: {
        id: like.id,
        postId: like.postId,
        userId: like.userId,
        addedAt: like.addedAt,
      },
    })
  },
  delete: async (id) => {
    await prisma.like.deleteMany({ where: { id } })
  },
  countByPost: async (postId) => {
    return await prisma.like.count({ where: { postId } })
  },
  countReceivedByUser: async (userId) => {
    const posts = await postRepository.list({ authorId: userId })
    const ids = posts.filter((p) => p.deletedAt === null).map((p) => p.id)
    if (ids.length === 0) return 0
    return await prisma.like.count({
      where: { postId: { in: ids as readonly string[] as string[] } },
    })
  },
})
