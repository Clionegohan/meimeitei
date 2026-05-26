'use client'

import { useState, useTransition } from 'react'
import { sendMessageAction, type MessageDto } from './actions'
import type { ConversationId, UserId } from '@me-me-en/domain'

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

export function ThreadView({
  conversationId,
  initialMessages,
  myUserId,
}: {
  conversationId: ConversationId
  initialMessages: readonly MessageDto[]
  myUserId: UserId
}) {
  const [messages, setMessages] = useState<MessageDto[]>([...initialMessages])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const send = () => {
    const body = draft.trim()
    if (body.length === 0 || pending) return
    setError(null)
    startTransition(async () => {
      const result = await sendMessageAction({ conversationId, body })
      if (result.ok) {
        setMessages((prev) => [...prev, result.message])
        setDraft('')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto px-10 py-6 flex flex-col gap-1">
        {messages.length === 0 ? (
          <p className="text-sm text-[#5E5A4F] tracking-widest text-center mt-10">
            まだ言葉はありません。
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.senderId === myUserId
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} mt-2`}
            >
              <div
                className={
                  mine
                    ? 'max-w-[60%] px-4 py-3 bg-[#1A2236] text-[#ECE6D4]'
                    : 'max-w-[60%] px-4 py-3 bg-[#10141E] border border-[#1F2533] text-[#ECE6D4]'
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{m.body}</p>
                <p className="text-[10px] text-[#5E5A4F] tracking-widest mt-1 tabular-nums">
                  {formatTime(m.sentAt)}
                  {mine && m.readAt !== null && (
                    <span className="ml-2 text-[#7A6749]">· 読</span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-[#1F2533] p-4 bg-[#0C1018]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex gap-3 items-end"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="そっと、文字を置く…"
            className="flex-1 bg-[#10141E] border border-[#2A3142] px-4 py-2 text-[#ECE6D4] text-sm resize-none focus:outline-none focus:border-[#B89B6E]"
          />
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            className="h-10 px-6 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm disabled:opacity-40 hover:bg-[#161B27] transition-colors"
          >
            送る
          </button>
        </form>
        {error !== null && (
          <p className="mt-2 text-sm text-[#A85040] tracking-wider">{error}</p>
        )}
        <p className="mt-2 text-[10px] text-[#5E5A4F] tracking-widest">
          夜を跨いで、ふたりだけの記憶になります
        </p>
      </div>
    </div>
  )
}
