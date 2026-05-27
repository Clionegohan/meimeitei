'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { sendMessageAction, type MessageDto } from './actions'
import { getSocket } from '@/lib/socket-client'
import type { ConversationId, UserId } from '@me-me-en/domain'
import { SheepAvatar } from '../../profile/_components/sheep-avatar'
import {
  currentHourBranch,
  formatJapaneseDate,
  toKanji,
} from '../../_components/kanji'

// design HTML (docs/design/extracted-dm.jsx, line 151-) の ThreadPanel に追随。
//   - Header: avatar + nickname + status + 3 action icon buttons
//   - Sub-banner: 「個室」名 + 副題 + N 夜目
//   - Date divider: 「子の刻 · 二十六年 神無月 廿五日」
//   - Bubble: 連続発話で角丸切替、相手 bubble に avatar (連続でない時のみ)
//   - Typing indicator: 3 dot animation (globals.css の @keyframes tdot)
//   - Composer: placeholder + icon row + 注記 + 送るボタン

type Partner = {
  id: UserId
  nickname: string
  tone: string
  presenceVisible: boolean
}

type TypingEvent = {
  conversationId: string
  userId: UserId
  isTyping: boolean
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

export function ThreadView({
  conversationId,
  initialMessages,
  myUserId,
  partner,
  nightsElapsed,
}: {
  conversationId: ConversationId
  initialMessages: readonly MessageDto[]
  myUserId: UserId
  partner: Partner | null
  nightsElapsed: number
  openedAtIso: string
}) {
  const [messages, setMessages] = useState<MessageDto[]>([...initialMessages])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [typingUsers, setTypingUsers] = useState<readonly UserId[]>([])
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 現在時刻 (date divider の時辰計算用、1 分ごとに更新で十分)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const socket = getSocket(myUserId)
    socket.emit('conversation:join', conversationId)

    const onMessageNew = (msg: MessageDto) => {
      if (msg.conversationId !== conversationId) return
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      )
    }
    const onTypingUpdate = (event: TypingEvent) => {
      if (event.conversationId !== conversationId) return
      if (event.userId === myUserId) return
      setTypingUsers((prev) => {
        const has = prev.includes(event.userId)
        if (event.isTyping && !has) return [...prev, event.userId]
        if (!event.isTyping && has) return prev.filter((u) => u !== event.userId)
        return prev
      })
    }
    socket.on('message:new', onMessageNew)
    socket.on('typing:update', onTypingUpdate)
    return () => {
      socket.emit('conversation:leave', conversationId)
      socket.off('message:new', onMessageNew)
      socket.off('typing:update', onTypingUpdate)
    }
  }, [conversationId, myUserId])

  const handleDraftChange = (value: string) => {
    setDraft(value)
    const socket = getSocket(myUserId)
    if (value.trim().length > 0) {
      socket.emit('typing:start', conversationId)
      if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        socket.emit('typing:stop', conversationId)
      }, 3_000)
    } else {
      socket.emit('typing:stop', conversationId)
      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
    }
  }

  const send = () => {
    const body = draft.trim()
    if (body.length === 0 || pending) return
    setError(null)
    startTransition(async () => {
      const result = await sendMessageAction({ conversationId, body })
      if (result.ok) {
        setMessages((prev) =>
          prev.some((m) => m.id === result.message.id)
            ? prev
            : [...prev, result.message],
        )
        setDraft('')
        const socket = getSocket(myUserId)
        socket.emit('typing:stop', conversationId)
      } else {
        setError(result.error)
      }
    })
  }

  const partnerNickname = partner?.nickname ?? '名なし'
  const partnerTone = partner?.tone ?? '#E8E2D2'
  const partnerLit = partner?.presenceVisible ?? false
  const statusLabel = partnerLit ? '灯ともる · 起きています' : '灯 秘匿 もしくは 不在'

  const dateDivider =
    now === null
      ? ''
      : `${currentHourBranch(now)} · ${formatJapaneseDate(now)}`

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 64px)', background: '#080B12' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center"
        style={{
          height: 78,
          padding: '0 40px',
          gap: 16,
          borderBottom: '1px solid #1F2533',
        }}
      >
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
            <SheepAvatar tone={partnerTone} size={44} />
          </div>
          {partnerLit && (
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
        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{
              fontSize: 18,
              color: '#ECE6D4',
              letterSpacing: '0.1em',
            }}
          >
            {partnerNickname}
          </div>
          <div
            className="flex items-center"
            style={{
              fontSize: 11,
              marginTop: 4,
              letterSpacing: '0.15em',
              color: partnerLit ? '#B89B6E' : '#5E5A4F',
              gap: 8,
            }}
          >
            {partnerLit && (
              <span
                className="rounded-full"
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  background: '#B89B6E',
                  boxShadow: '0 0 6px #B89B6E',
                }}
              />
            )}
            {statusLabel}
          </div>
        </div>
        {/* 3 action icons (装飾): 時計 / 虫眼鏡 / 3-dot more */}
        <div className="flex items-center" style={{ gap: 8 }}>
          {[
            <g key="clock">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </g>,
            <g key="search">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16" y2="16" />
            </g>,
            <g key="more">
              <circle cx="12" cy="5" r="1.4" fill="currentColor" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" />
              <circle cx="12" cy="19" r="1.4" fill="currentColor" />
            </g>,
          ].map((g, i) => (
            <button
              key={i}
              type="button"
              className="hover:bg-[#161B27] transition-colors flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                border: '1px solid #1F2533',
                background: 'transparent',
                color: '#9A9484',
              }}
              aria-label={['履歴', '検索', 'その他'][i]}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                {g}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-banner ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 40px',
          background: '#0C1018',
          borderBottom: '1px solid #1F2533',
        }}
      >
        <div
          className="flex items-center"
          style={{
            fontSize: 11,
            color: '#9A9484',
            letterSpacing: '0.2em',
            gap: 14,
          }}
        >
          <span>夜を跨いでも、文字は残ります。</span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#5E5A4F',
            letterSpacing: '0.25em',
          }}
        >
          {toKanji(nightsElapsed)}夜目
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-auto flex flex-col"
        style={{ padding: '24px 80px 16px', gap: 4 }}
      >
        {/* Date divider */}
        {now !== null && (
          <div
            className="flex items-center"
            style={{
              padding: '8px 0 16px',
              gap: 16,
              color: '#5E5A4F',
            }}
          >
            <div className="flex-1" style={{ height: 1, background: '#1F2533' }} />
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.4em',
              }}
            >
              {dateDivider}
            </span>
            <div className="flex-1" style={{ height: 1, background: '#1F2533' }} />
          </div>
        )}

        {messages.length === 0 && (
          <p
            className="text-center"
            style={{
              fontSize: 13,
              color: '#5E5A4F',
              letterSpacing: '0.25em',
              marginTop: 40,
            }}
          >
            まだ言葉は ありません。
          </p>
        )}

        {messages.map((m, i) => {
          const mine = m.senderId === myUserId
          const prevSame = i > 0 && messages[i - 1]?.senderId === m.senderId
          const nextSame =
            i < messages.length - 1 && messages[i + 1]?.senderId === m.senderId

          const radius = mine
            ? prevSame && nextSame
              ? '12px 4px 4px 12px'
              : prevSame
              ? '12px 4px 12px 12px'
              : nextSame
              ? '12px 12px 4px 12px'
              : '12px 12px 4px 12px'
            : prevSame && nextSame
            ? '4px 12px 12px 4px'
            : prevSame
            ? '4px 12px 12px 12px'
            : nextSame
            ? '12px 12px 12px 4px'
            : '12px 12px 12px 4px'

          return (
            <div
              key={m.id}
              className="flex"
              style={{
                justifyContent: mine ? 'flex-end' : 'flex-start',
                gap: 12,
                marginTop: prevSame ? 4 : 12,
              }}
            >
              {/* 相手側の bubble の左に avatar (連続でない時のみ) */}
              {!mine && !prevSame && (
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    background: '#10141E',
                    border: '1px solid #1F2533',
                  }}
                >
                  <SheepAvatar tone={partnerTone} size={30} />
                </div>
              )}
              {!mine && prevSame && (
                <div className="shrink-0" style={{ width: 34 }} />
              )}

              <div
                className="flex flex-col"
                style={{
                  maxWidth: '60%',
                  alignItems: mine ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  className="whitespace-pre-line"
                  style={{
                    padding: '12px 16px',
                    background: mine ? '#1A2236' : '#10141E',
                    border: mine ? '1px solid transparent' : '1px solid #1F2533',
                    color: '#ECE6D4',
                    fontSize: 14,
                    lineHeight: 1.9,
                    letterSpacing: '0.04em',
                    borderRadius: radius,
                  }}
                >
                  {m.body}
                </div>
                {!nextSame && (
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: '#5E5A4F',
                      letterSpacing: '0.15em',
                    }}
                  >
                    {formatTime(m.sentAt)}
                    {mine && m.readAt !== null && (
                      <span className="ml-2" style={{ color: '#7A6749' }}>
                        · 読
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div
            className="flex items-center"
            style={{ marginTop: 14, gap: 12 }}
          >
            <div
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                background: '#10141E',
                border: '1px solid #1F2533',
              }}
            >
              <SheepAvatar tone={partnerTone} size={30} />
            </div>
            <div
              className="flex items-center"
              style={{
                padding: '12px 18px',
                background: '#10141E',
                border: '1px solid #1F2533',
                borderRadius: '12px 12px 12px 4px',
                gap: 5,
              }}
            >
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background: '#9A9484',
                    animation: `tdot 1.2s infinite ${d * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: 11,
                color: '#5E5A4F',
                letterSpacing: '0.2em',
              }}
            >
              筆を執っています…
            </span>
          </div>
        )}
      </div>

      {/* ── Composer ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 40px 24px',
          borderTop: '1px solid #1F2533',
          background: '#0C1018',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <div
            className="flex items-end"
            style={{
              border: '1px solid #2A3142',
              background: '#10141E',
              padding: '12px 16px',
              gap: 14,
              minHeight: 64,
            }}
          >
            <div className="flex-1 min-w-0">
              <textarea
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                maxLength={280}
                rows={2}
                placeholder="そっと、文字を置く…"
                className="w-full bg-transparent text-[#ECE6D4] resize-none focus:outline-none placeholder:text-[#5E5A4F]"
                style={{
                  fontSize: 14,
                  letterSpacing: '0.05em',
                  lineHeight: 1.9,
                  paddingTop: 6,
                }}
              />
              <div
                className="flex items-center"
                style={{ gap: 10, marginTop: 12 }}
              >
                {/* tiny icon row (装飾) */}
                {['☽', '◌', '⌗', '✦'].map((ic, i) => (
                  <span
                    key={i}
                    className="flex items-center justify-center"
                    style={{
                      width: 24,
                      height: 24,
                      color: '#5E5A4F',
                      fontSize: 14,
                    }}
                    aria-hidden
                  >
                    {ic}
                  </span>
                ))}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: '#5E5A4F',
                    letterSpacing: '0.15em',
                  }}
                >
                  夜を跨いで、ふたりだけの記憶になります
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={pending || draft.trim().length === 0}
              className="hover:bg-[#161B27] disabled:opacity-40 transition-colors"
              style={{
                height: 40,
                padding: '0 22px',
                background: 'transparent',
                border: '1px solid #ECE6D4',
                color: '#ECE6D4',
                fontSize: 13,
                letterSpacing: '0.4em',
                fontWeight: 400,
              }}
            >
              送る
            </button>
          </div>
        </form>
        {error !== null && (
          <p
            className="mt-2"
            style={{
              fontSize: 13,
              color: '#A85040',
              letterSpacing: '0.05em',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
