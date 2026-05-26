'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Compute the next 22:00 JST opening time given a current Date.
// Assumes the caller is in the closed window (05:00 <= JST hour < 22:00).
const computeNextOpen = (now: Date): Date => {
  const jstNow = new Date(now.getTime() + 9 * 3600 * 1000)
  const y = jstNow.getUTCFullYear()
  const m = jstNow.getUTCMonth()
  const d = jstNow.getUTCDate()
  // 22:00 JST same date = 13:00 UTC same date
  return new Date(Date.UTC(y, m, d, 13, 0, 0))
}

const formatRemaining = (ms: number): string => {
  if (ms <= 0) return '〇時間 〇分 〇秒'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${h}時間 ${m}分 ${s}秒`
}

export function ClosedCountdown() {
  const router = useRouter()
  const [text, setText] = useState<string>('— 時間 — 分 — 秒')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const next = computeNextOpen(now)
      const diff = next.getTime() - now.getTime()
      if (diff <= 0) {
        router.replace('/chats')
        return
      }
      setText(formatRemaining(diff))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [router])

  return (
    <div className="mt-12 inline-flex items-baseline gap-6 px-10 py-5 border border-[#2A3142] bg-[rgba(15,19,28,0.6)]">
      <span className="text-[10px] text-[#5E5A4F] tracking-[0.4em]">開 店 ま で</span>
      <span className="text-2xl text-[#ECE6D4] tracking-[0.05em] tabular-nums">{text}</span>
    </div>
  )
}
