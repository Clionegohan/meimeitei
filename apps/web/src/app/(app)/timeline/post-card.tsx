'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { likePostAction, replyToPostAction, unlikePostAction, type PostDto } from './actions'
import { SheepAvatar } from '../profile/_components/sheep-avatar'
import { SumiDivider } from '../_components/sumi-divider'
import { Linkify } from '../_components/linkify'

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

export function PostCard({ post, myUserId }: { post: PostDto; myUserId: string }) {
  const [iLiked, setILiked] = useState(post.iLiked)
  const [likePending, startLikeTransition] = useTransition()
  const [replyPending, startReplyTransition] = useTransition()
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
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
    now !== null && now.getTime() - new Date(post.postedAt).getTime() < GLOW_THRESHOLD_MS

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

  const openReply = () => {
    setReplyError(null)
    setReplyOpen(true)
  }

  const sendReply = (body: string) => {
    if (replyPending) return
    setReplyError(null)
    startReplyTransition(async () => {
      const result = await replyToPostAction({ postId: post.id, body })
      if (result.ok) {
        router.push(`/chats/${result.conversationId}`)
      } else {
        setReplyError(result.error)
      }
    })
  }

  return (
    <>
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
                fontSize: 18,
                color: '#ECE6D4',
                letterSpacing: '0.08em',
              }}
            >
              {post.authorNickname}
            </span>
            <span style={{ color: '#3A382F', fontSize: 12 }}>·</span>
            <span
              style={{
                fontSize: 12,
                color: '#9A9484',
                letterSpacing: '0.08em',
              }}
            >
              {dist}
            </span>
            <span
              className="tabular-nums ml-auto"
              style={{
                fontSize: 12,
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
              fontSize: 16,
              lineHeight: 2,
              color: '#D8D2C0',
              letterSpacing: '0.04em',
            }}
          >
            <Linkify text={post.body} />
          </p>

          {/* actions — 応える + 灯をそえる */}
          <div className="flex items-center" style={{ marginTop: 16, gap: 28 }}>
            {!isMine && (
              <button
                type="button"
                onClick={openReply}
                disabled={replyPending}
                className="flex items-center disabled:opacity-50 hover:text-[#ECE6D4] transition-colors"
                style={{
                  gap: 8,
                  color: '#9A9484',
                  fontSize: 14,
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
                応 え る
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
                fontSize: 14,
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
              {iLiked ? '灯 を そ え た' : '灯 を そ え る'}
            </button>
          </div>
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

      {replyOpen && (
        <ReplyModal
          partnerNickname={post.authorNickname}
          postExcerpt={post.body}
          pending={replyPending}
          error={replyError}
          onSend={sendReply}
          onClose={() => setReplyOpen(false)}
        />
      )}
    </>
  )
}

// 投稿への返信モーダル (post-card 内部の非エクスポート component)。
// テキストを書いて送ると、その本文を最初の手紙として 1:1 会話が作られる。
function ReplyModal({
  partnerNickname,
  postExcerpt,
  pending,
  error,
  onSend,
  onClose,
}: {
  partnerNickname: string
  postExcerpt: string
  pending: boolean
  error: string | null
  onSend: (body: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const body = draft.trim()
    if (body.length === 0 || pending) return
    onSend(body)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${partnerNickname} に応える`}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(4,6,12,0.72)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg"
        style={{
          background: '#10141E',
          border: '1px solid #2A3142',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-5 md:px-7 border-b border-[#1F2533]"
          style={{ height: 60 }}
        >
          <span style={{ fontSize: 16, color: '#ECE6D4', letterSpacing: '0.15em' }}>
            {partnerNickname} に応える
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="hover:text-[#ECE6D4] transition-colors"
            style={{
              color: '#9A9484',
              fontSize: 20,
              background: 'transparent',
              border: 'none',
              padding: '0 4px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div className="px-5 md:px-7 py-5">
          {/* 引用 (返信先の独り言) */}
          <div
            className="mb-4 whitespace-pre-line"
            style={{
              padding: '10px 14px',
              borderLeft: '2px solid #2A3142',
              background: '#0C1018',
              color: '#9A9484',
              fontSize: 14,
              lineHeight: 1.8,
              letterSpacing: '0.04em',
              maxHeight: 96,
              overflow: 'hidden',
            }}
          >
            {postExcerpt}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  submit()
                }
              }}
              maxLength={280}
              rows={4}
              autoFocus
              placeholder="返事を書く"
              className="w-full bg-[#0C1018] border border-[#2A3142] p-3 text-[#ECE6D4] resize-none focus:outline-none focus:border-[#B89B6E] placeholder:text-[#5E5A4F]"
              style={{ fontSize: 16, lineHeight: 1.9, letterSpacing: '0.04em' }}
            />

            <div className="flex items-center justify-between mt-4">
              <span style={{ fontSize: 12, color: '#5E5A4F', letterSpacing: '0.1em' }}>
                送ると、ふたりの手紙が始まります
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={pending}
                  className="h-10 px-5 border border-[#2A3142] text-[#9A9484] hover:bg-[#161B27] transition-colors disabled:opacity-40"
                  style={{ fontSize: 13, letterSpacing: '0.3em' }}
                >
                  やめる
                </button>
                <button
                  type="submit"
                  disabled={pending || draft.trim().length === 0}
                  className="h-10 px-6 border border-[#ECE6D4] text-[#ECE6D4] hover:bg-[#161B27] transition-colors disabled:opacity-40"
                  style={{ fontSize: 13, letterSpacing: '0.3em' }}
                >
                  {pending ? '送って います…' : '送る'}
                </button>
              </div>
            </div>
          </form>

          {error !== null && (
            <p className="mt-3" style={{ fontSize: 14, color: '#A85040', letterSpacing: '0.05em' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
