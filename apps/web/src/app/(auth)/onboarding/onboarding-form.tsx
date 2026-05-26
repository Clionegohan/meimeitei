'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerUserAction } from './actions'

export function OnboardingForm() {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await registerUserAction({ nickname: nickname.trim() })
      if (result.ok) {
        router.push('/chats')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 w-full max-w-sm">
      <label className="flex flex-col gap-2">
        <span className="text-xs text-[#5E5A4F] tracking-[0.35em]">羊の名</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="例: 月見羊"
          maxLength={20}
          required
          className="bg-transparent border-b border-[#2A3142] py-2 text-[#ECE6D4] text-lg tracking-[0.2em] focus:outline-none focus:border-[#B89B6E]"
        />
      </label>
      {error !== null && (
        <p className="text-[#A85040] text-sm tracking-wider">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending || nickname.trim().length === 0}
        className="mt-2 h-12 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm hover:bg-[#161B27] disabled:opacity-40 transition-colors"
      >
        {pending ? 'お記帳中…' : 'ご記帳'}
      </button>
    </form>
  )
}
