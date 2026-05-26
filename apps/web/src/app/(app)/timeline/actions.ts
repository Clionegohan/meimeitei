'use server'

import { auth } from '@/auth'
import { createPost, likePost, unlikePost } from '@/server/di'
import type { PostId } from '@me-me-en/domain'

export type CreatePostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string }

export const createPostAction = async (input: {
  body: string
}): Promise<CreatePostResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    const post = await createPost({ authorId: session.userId, body: input.body })
    return { ok: true, postId: post.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}

export type LikeResult = { ok: true } | { ok: false; error: string }

export const likePostAction = async (input: {
  postId: string
}): Promise<LikeResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    await likePost({ userId: session.userId, postId: input.postId as PostId })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}

export const unlikePostAction = async (input: {
  postId: string
}): Promise<LikeResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    await unlikePost({ userId: session.userId, postId: input.postId as PostId })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}
