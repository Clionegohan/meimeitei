'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { startDirectMessageAction } from '../actions'
import { SheepAvatar } from '../_components/sheep-avatar'
import type { Tone, SignTag } from '@me-me-en/domain'

const SIGN_LABEL: Record<SignTag, string> = {
  sleepless: '眠れない',
  reading: '読書中',
  having_tea: 'お茶を一杯',
  moon_gazing: '月を眺める',
  nothing: '何でもない',
  wanting_to_hear: '声を聞きたい',
  shiritori: 'しりとり',
  staying_up_late: '夜更かし',
}

export type OtherUserDto = {
  id: string
  nickname: string
  bio: string
  tone: Tone
  currentSigns: readonly SignTag[]
  presenceVisible: boolean
}

export function OtherProfile({ user }: { user: OtherUserDto }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const startDm = () => {
    if (pending) return
    setError(null)
    startTransition(async () => {
      const result = await startDirectMessageAction({ partnerId: user.id })
      if (result.ok) router.push(`/chats/${result.conversationId}`)
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-8">
        <SheepAvatar tone={user.tone} size={120} />
        <div className="flex-1">
          <h3 className="text-2xl tracking-wider text-[#ECE6D4] mb-2">
            {user.nickname}
          </h3>
          {user.presenceVisible && (
            <p className="text-[11px] text-[#B89B6E] tracking-[0.3em] mb-4">
              灯ともる
            </p>
          )}
          {user.bio.length > 0 && (
            <p className="text-sm text-[#D8D2C0] leading-loose whitespace-pre-line max-w-lg">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {user.currentSigns.length > 0 && (
        <div>
          <p className="text-xs text-[#5E5A4F] tracking-[0.3em] mb-3">今宵のしるし</p>
          <div className="flex flex-wrap gap-2">
            {user.currentSigns.map((s) => (
              <span
                key={s}
                className="px-4 py-2 text-xs tracking-[0.2em] border border-[#B89B6E] bg-[rgba(184,155,110,0.08)] text-[#ECE6D4]"
              >
                {SIGN_LABEL[s]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={startDm}
          disabled={pending}
          className="h-10 px-6 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm disabled:opacity-40 hover:bg-[#161B27]"
        >
          {pending ? '個室へご案内中…' : '直 接 話 し か け る'}
        </button>
        {error !== null && (
          <p className="mt-2 text-sm text-[#A85040] tracking-wider">{error}</p>
        )}
      </div>
    </div>
  )
}
