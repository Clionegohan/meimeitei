import type { LikeId, PostId, UserId } from '../shared/id'

// 「Like」は spec の I 行に対応する BE 用語。UI では「燭を寄せる」と表示する。
// 1 ユーザー × 1 投稿 = 1 like の unique 制約は repository / use case 側で担保。
export type Like = {
  readonly id: LikeId
  readonly postId: PostId
  readonly userId: UserId
  readonly addedAt: Date
}

export type CreateLikeInput = {
  id: LikeId
  postId: PostId
  userId: UserId
  addedAt: Date
}

export const createLike = (input: CreateLikeInput): Like => ({
  id: input.id,
  postId: input.postId,
  userId: input.userId,
  addedAt: input.addedAt,
})
