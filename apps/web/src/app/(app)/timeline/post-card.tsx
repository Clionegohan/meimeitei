'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import {
  likePostAction,
  replyToPostAction,
  unlikePostAction,
  type PostDto,
} from './actions'
import { SheepAvatar } from '../profile/_components/sheep-avatar'
import { SumiDivider } from '../_components/sumi-divider'

export type { PostDto } from './actions'

// HH:MM (JST、24h、tabular-nums で揃える)。
const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

// 「たった今」「8 分前」「3 時間前」「2 日前」。
const formatDist = (iso: string, now: Date): string => {
  const diffMs = now.getTime() - new Date(iso).getTime()
  if (diffMs < 60_000) return 'たった今'
  if (diffMs < 60 * 60_000) return `${Math.floor(diffMs / 60_000)}分前`
  if (diffMs < 24 * 60 * 60_000) return `${Math.floor(diffMs / (60 * 60_000))}時間前`
  return `${Math.floor(diffMs / (24 * 60 * 60_000))}日前`
}

// 「灯火 (glow)」判定: 直近 5 分以内の投稿を新鮮な灯として扱う。
const GLOW_THRESHOLD_MS = 5 * 60_000

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

  // dist は時間とともに進むので client side で 30 秒ごとに再評価。
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const isMine = post.authorId === myUserId
  const dist = now === null ? '' : formatDist(post.postedAt, now)
  const time = formatTime(post.postedAt)
  const isGlowing =
    now !== null &&
    now.getTime() - new Date(post.postedAt).getTime() < GLOW_THRESHOLD_MS

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
    <article className="relative flex gap-[18px]" style={{ padding: '24px 4px' }}>
      {/* Avatar — 48px 円 + SheepBrush 44px + (glow なら) accent dot */}
      <div className="relative shrink-0">
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            background: '#10141E',
            border: '1px solid #1F2533',
          }}
        >
          <SheepAvatar tone={post.authorTone} size={44} />
        </div>
        {isGlowing && (
          <span
            className="absolute rounded-full"
            aria-hidden
            style={{
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              background: '#B89B6E',
              border: '2px solid #080B12',
              boxShadow: '0 0 6px #B89B6E',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* meta — nickname + dist + 右端の time */}
        <div className="flex items-baseline" style={{ gap: 12, marginBottom: 10 }}>
          <span
            style={{
              fontSize: 16,
              color: '#ECE6D4',
              letterSpacing: '0.08em',
            }}
          >
            {post.authorNickname}
          </span>
          <span style={{ color: '#3A382F', fontSize: 11 }}>·</span>
          <span
            style={{
              fontSize: 11,
              color: '#9A9484',
              letterSpacing: '0.08em',
            }}
          >
            {dist}
          </span>
          <span
            className="tabular-nums ml-auto"
            style={{
              fontSize: 11,
              color: '#5E5A4F',
              letterSpacing: '0.1em',
            }}
          >
            {time}
          </span>
        </div>

        {/* body */}
        <p
          className="whitespace-pre-line"
          style={{
            fontSize: 15,
            lineHeight: 2,
            color: '#D8D2C0',
            letterSpacing: '0.04em',
          }}
        >
          {post.body}
        </p>

        {/* actions — 応える + 燭を寄せる + 右端 ··· */}
        <div className="flex items-center" style={{ marginTop: 16, gap: 28 }}>
          {!isMine && (
            <button
              type="button"
              onClick={startReply}
              disabled={replyPending}
              className="flex items-center disabled:opacity-50 hover:text-[#ECE6D4] transition-colors"
              style={{
                gap: 8,
                color: '#9A9484',
                fontSize: 12,
                letterSpacing: '0.2em',
                background: 'transparent',
                padding: 0,
                border: 'none',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              >
                <path d="M21 12 a9 9 0 1 1 -3.5 -7 L21 5 l-1 4 L21 12" />
              </svg>
              {replyPending ? '個 室 へ…' : '応 え る'}
            </button>
          )}

          <button
            type="button"
            onClick={toggleLike}
            disabled={likePending}
            className="flex items-center disabled:opacity-50 transition-colors"
            style={{
              gap: 8,
              color: iLiked ? '#B89B6E' : '#9A9484',
              fontSize: 12,
              letterSpacing: '0.2em',
              background: 'transparent',
              padding: 0,
              border: 'none',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={iLiked ? '#B89B6E' : '#7A6749'}
              stroke="none"
            >
              <path
                d="M12 2 C12 6 16 8 16 13 a4 4 0 0 1 -8 0 c0 -5 4 -7 4 -11 z"
                opacity={iLiked ? '0.9' : '0.6'}
              />
            </svg>
            {iLiked ? '燭 を 寄 せ た' : '燭 を 寄 せ る'}
          </button>

          <button
            type="button"
            className="ml-auto"
            aria-label="その他"
            style={{
              color: '#5E5A4F',
              fontSize: 14,
              padding: '0 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ···
          </button>
        </div>

        {replyError !== null && (
          <p
            className="mt-2"
            style={{ fontSize: 13, color: '#A85040', letterSpacing: '0.05em' }}
          >
            {replyError}
          </p>
        )}
      </div>

      {/* post 間の SumiDivider (墨流し細線、opacity 0.4) — 末尾は親側で抑制可能 */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{ bottom: 0 }}
        aria-hidden
      >
        <SumiDivider width={760} opacity={0.4} />
      </div>
    </article>
  )
}
