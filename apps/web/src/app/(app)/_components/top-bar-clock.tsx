'use client'

import { useEffect, useState } from 'react'
import {
  calcCountdown,
  currentHourBranch,
  formatJapaneseDate,
  formatJapaneseTime,
} from './kanji'

// 時計 (HH:MM)、和暦日付、閉店までのカウントダウン、時辰 (子の刻) を
// 1 秒ごとに更新する client component。
export function TopBarClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) {
    // SSR / 初回 render 中は placeholder 高さだけ確保し、文字は出さない。
    return <div className="flex items-center gap-7" aria-hidden style={{ minHeight: 36 }} />
  }

  const date = formatJapaneseDate(now)
  const time = formatJapaneseTime(now)
  const branch = currentHourBranch(now)
  const cd = calcCountdown(now)

  return (
    <div className="flex items-center gap-7">
      {/* 日付 + 時刻 + 時辰 */}
      <div className="text-right">
        <div
          style={{
            fontSize: 11,
            color: '#9A9484',
            letterSpacing: '0.18em',
          }}
        >
          {date}
        </div>
        <div
          className="tabular-nums mt-0.5 flex items-baseline justify-end"
          style={{
            fontSize: 18,
            color: '#ECE6D4',
            letterSpacing: '0.05em',
          }}
        >
          {time}
          <span
            className="ml-2.5"
            style={{ fontSize: 10, color: '#5E5A4F', letterSpacing: '0.25em' }}
          >
            {branch}
          </span>
        </div>
      </div>

      {/* 垂直 hairline */}
      <span className="h-9 w-px bg-[#1F2533]" aria-hidden />

      {/* 閉店まで / 開店まで */}
      <div className="flex items-center gap-2.5">
        <span
          className="rounded-full"
          aria-hidden
          style={{
            width: 6,
            height: 6,
            background: cd.isOpen ? '#B89B6E' : '#5E5A4F',
            boxShadow: cd.isOpen ? '0 0 8px #B89B6E' : 'none',
          }}
        />
        <div>
          <div
            style={{
              fontSize: 10,
              color: '#5E5A4F',
              letterSpacing: '0.25em',
            }}
          >
            {cd.label}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#ECE6D4',
              letterSpacing: '0.08em',
            }}
          >
            {cd.text}
          </div>
        </div>
      </div>
    </div>
  )
}
