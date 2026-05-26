'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPostAction } from './actions'

export function Composer() {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const submit = () => {
    const trimmed = body.trim()
    if (trimmed.length === 0 || pending) return
    setError(null)
    startTransition(async () => {
      const result = await createPostAction({ body })
      if (result.ok) {
        setBody('')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="border border-[#2A3142] bg-[#10141E] p-6 mb-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="今宵のひとこと、置きませんか。"
          className="w-full bg-transparent text-[#ECE6D4] text-sm leading-relaxed resize-none focus:outline-none placeholder:text-[#5E5A4F]"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1F2533]">
          <span className="text-[10px] text-[#5E5A4F] tracking-widest tabular-nums">
            {body.trim().length} / 280
          </span>
          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            className="h-9 px-6 bg-[#ECE6D4] text-[#080B12] tracking-[0.4em] text-sm font-medium disabled:opacity-40 hover:bg-[#D8D2C0] transition-colors"
          >
            筆を取る
          </button>
        </div>
        {error !== null && (
          <p className="mt-3 text-sm text-[#A85040] tracking-wider">{error}</p>
        )}
      </form>
    </div>
  )
}
