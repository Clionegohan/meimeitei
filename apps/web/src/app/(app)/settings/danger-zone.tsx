'use client'

import { useState, useTransition } from 'react'
import { deleteAccountAction } from './actions'

// 退苑 (アカウント削除)。誤操作防止に二段階 + 「退苑」入力確認を課す。
// 成功時は server action 側で sign-out → /login へ redirect される。
const CONFIRM_WORD = '退苑'

export function DangerZone() {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const confirmDelete = () => {
    if (pending || word.trim() !== CONFIRM_WORD) return
    setError(null)
    startTransition(async () => {
      const result = await deleteAccountAction()
      // 成功時は redirect されるのでここには戻らない。戻ってきたら失敗。
      if (result && !result.ok) setError(result.error)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:bg-[#1A1012] transition-colors"
        style={{
          height: 42,
          padding: '0 22px',
          border: '1px solid #5A2A2A',
          background: 'transparent',
          color: '#A85040',
          fontSize: 14,
          letterSpacing: '0.3em',
        }}
      >
        退苑する
      </button>
    )
  }

  return (
    <div
      style={{
        border: '1px solid #5A2A2A',
        background: 'rgba(120,40,40,0.06)',
        padding: '20px 22px',
        maxWidth: 460,
      }}
    >
      <p style={{ fontSize: 15, color: '#D8D2C0', letterSpacing: '0.05em', lineHeight: 1.9 }}>
        退苑すると、あなたの席・しるし・プロフィールは戻りません。
        <br />
        交わした手紙は相手の手元に残りますが、あなたの名は失われます。
      </p>
      <p
        style={{
          fontSize: 13,
          color: '#9A9484',
          letterSpacing: '0.1em',
          marginTop: 14,
          marginBottom: 8,
        }}
      >
        よろしければ「{CONFIRM_WORD}」と書いてください。
      </p>
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder={CONFIRM_WORD}
        className="w-full bg-[#10141E] border border-[#5A2A2A] p-2.5 text-[#ECE6D4] focus:outline-none focus:border-[#A85040]"
        style={{ fontSize: 16, letterSpacing: '0.1em' }}
      />
      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={pending || word.trim() !== CONFIRM_WORD}
          className="hover:bg-[#1A1012] transition-colors disabled:opacity-30"
          style={{
            height: 40,
            padding: '0 20px',
            border: '1px solid #A85040',
            background: 'transparent',
            color: '#C8806E',
            fontSize: 14,
            letterSpacing: '0.3em',
          }}
        >
          {pending ? '退苑して います…' : '退苑を確定する'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setWord('')
            setError(null)
          }}
          disabled={pending}
          className="hover:bg-[#161B27] transition-colors disabled:opacity-40"
          style={{
            height: 40,
            padding: '0 18px',
            border: '1px solid #2A3142',
            background: 'transparent',
            color: '#9A9484',
            fontSize: 14,
            letterSpacing: '0.3em',
          }}
        >
          やめる
        </button>
      </div>
      {error !== null && (
        <p className="mt-3" style={{ fontSize: 14, color: '#A85040', letterSpacing: '0.05em' }}>
          {error}
        </p>
      )}
    </div>
  )
}
