'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  likePostAction,
  replyToPostAction,
  unlikePostAction,
  type PostDto,
} from './actions'

export type { PostDto } from './actions'

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

export function PostCard({
  post,
  myUserId,
}: {
  post: PostDto
  myUserId: string
}) {
  const [iLiked, setILiked] = useState(post.iLiked)
  const [likePending, startLikeTransition] = useTransition()
  const [replyPending, startReplyTransition] = useTransition()
  const [replyError, setReplyError] = useState<string | null>(null)
  const router = useRouter()

  const isMine = post.authorId === myUserId

  const toggleLike = () => {
    if (likePending) return
    startLikeTransition(async () => {
      const prev = iLiked
      setILiked(!prev)
      const result = prev
        ? await unlikePostAction({ postId: post.id })
        : await likePostAction({ postId: post.id })
      if (!result.ok) setILiked(prev)
    })
  }

  const startReply = () => {
    if (replyPending) return
    setReplyError(null)
    startReplyTransition(async () => {
      const result = await replyToPostAction({ postId: post.id })
      if (result.ok) {
        router.push(`/chats/${result.conversationId}`)
      } else {
        setReplyError(result.error)
      }
    })
  }

  return (
    <article className="py-6 border-b border-[#1F2533] flex gap-5">
      <div
        className="w-12 h-12 rounded-full bg-[#10141E] border border-[#1F2533] flex items-center justify-center text-[#9A9484] text-sm tracking-wider shrink-0"
        aria-hidden
      >
        羊
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-base text-[#ECE6D4] tracking-wider">
            {post.authorId}
          </span>
          <span className="text-[11px] text-[#5E5A4F] tabular-nums tracking-widest">
            {formatTime(post.postedAt)}
          </span>
        </div>
        <p className="text-[#D8D2C0] text-sm leading-loose whitespace-pre-line">
          {post.body}
        </p>
        <div className="mt-4 flex items-center gap-7">
          {!isMine && (
            <button
              type="button"
              onClick={startReply}
              disabled={replyPending}
              className="text-xs tracking-[0.2em] text-[#9A9484] hover:text-[#ECE6D4] disabled:opacity-50 transition-colors"
            >
              {replyPending ? '個室へご案内中…' : '応 え る'}
            </button>
          )}
          <button
            type="button"
            onClick={toggleLike}
            disabled={likePending}
            className={`text-xs tracking-[0.2em] disabled:opacity-50 transition-colors ${
              iLiked ? 'text-[#B89B6E]' : 'text-[#9A9484] hover:text-[#B89B6E]'
            }`}
          >
            {iLiked ? '燭を寄せた' : '燭 を 寄 せ る'}
          </button>
        </div>
        {replyError !== null && (
          <p className="mt-2 text-sm text-[#A85040] tracking-wider">{replyError}</p>
        )}
      </div>
    </article>
  )
}
