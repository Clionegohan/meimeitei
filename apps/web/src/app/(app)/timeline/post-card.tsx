'use client'

import { useState, useTransition } from 'react'
import { likePostAction, unlikePostAction } from './actions'

export type PostDto = {
  id: string
  authorId: string
  body: string
  postedAt: string
  nightId: string
  iLiked: boolean
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

export function PostCard({ post }: { post: PostDto }) {
  const [iLiked, setILiked] = useState(post.iLiked)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    if (pending) return
    startTransition(async () => {
      const prev = iLiked
      // Optimistic
      setILiked(!prev)
      const result = prev
        ? await unlikePostAction({ postId: post.id })
        : await likePostAction({ postId: post.id })
      if (!result.ok) setILiked(prev)
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
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className={`text-xs tracking-[0.2em] disabled:opacity-50 transition-colors ${
              iLiked
                ? 'text-[#B89B6E]'
                : 'text-[#9A9484] hover:text-[#B89B6E]'
            }`}
          >
            {iLiked ? '燭を寄せた' : '燭 を 寄 せ る'}
          </button>
          {/* 「応える」(post → DM) は Phase 5-4-b で追加 */}
        </div>
      </div>
    </article>
  )
}
