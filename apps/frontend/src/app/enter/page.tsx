'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateUserId } from '@/lib/session'

export default function EnterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      setError('名前を入力してください')
      return
    }

    if (trimmedName.length > 20) {
      setError('名前は20文字以内で入力してください')
      return
    }

    // TODO(F006): userId管理機能の将来的な統合
    // Why: 現在はバックエンドが welcomeイベントで userId を生成・送信
    // Why: getOrCreateUserId() は F006 セッション管理機能の基盤として準備
    // Why: F006 実装時に、フロントエンド生成 userId をバックエンドに送信してセッション復元
    getOrCreateUserId()

    // localStorageに保存
    localStorage.setItem('meimei_username', trimmedName)
    router.push('/bar')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">めぃめぃ亭</h1>
      <form onSubmit={handleSubmit} className="w-80">
        <label htmlFor="name-input" className="block mb-2 text-sm">
          お名前
        </label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          placeholder="1-20文字"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        >
          入店
        </button>
      </form>
    </div>
  )
}
