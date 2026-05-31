'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SheepAvatar } from '../profile/_components/sheep-avatar'
import { unblockFromSettingsAction } from './actions'

export type BlockedSheep = {
  id: string
  nickname: string
  tone: string
}

// 遮断した羊の一覧と解除。客帳からは消えているので、ここが唯一の解除導線。
export function BlockedList({ sheep }: { sheep: readonly BlockedSheep[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const unblock = (id: string) => {
    if (pending) return
    setError(null)
    setBusyId(id)
    startTransition(async () => {
      const result = await unblockFromSettingsAction({ targetId: id })
      setBusyId(null)
      if (result.ok) router.refresh()
      else setError(result.error)
    })
  }

  if (sheep.length === 0) {
    return (
      <p style={{ fontSize: 14, color: '#5E5A4F', letterSpacing: '0.15em', lineHeight: 1.9 }}>
        遮断している羊は おりません。
      </p>
    )
  }

  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      {sheep.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4"
          style={{ padding: '12px 4px', borderBottom: '1px solid #1F2533' }}
        >
          <div
            className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, background: '#10141E', border: '1px solid #1F2533' }}
          >
            <SheepAvatar tone={s.tone} size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="truncate"
              style={{ fontSize: 16, color: '#ECE6D4', letterSpacing: '0.08em' }}
            >
              {s.nickname}
            </div>
          </div>
          <button
            type="button"
            onClick={() => unblock(s.id)}
            disabled={pending}
            className="hover:bg-[#161B27] transition-colors disabled:opacity-40 shrink-0"
            style={{
              height: 32,
              padding: '0 14px',
              border: '1px solid #2A3142',
              background: 'transparent',
              color: '#9A9484',
              fontSize: 13,
              letterSpacing: '0.2em',
            }}
          >
            {busyId === s.id ? '解いて います…' : '遮断を解く'}
          </button>
        </div>
      ))}
      {error !== null && (
        <p className="mt-2" style={{ fontSize: 14, color: '#A85040', letterSpacing: '0.05em' }}>
          {error}
        </p>
      )}
    </div>
  )
}
