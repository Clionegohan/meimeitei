'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

    // localStorageに保存
    localStorage.setItem('meimei_username', trimmedName)
    router.push('/bar')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">めぃめぃ亭</h1>
      <form onSubmit={handleSubmit} className="w-80">
        <label className="block mb-2 text-sm">お名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          placeholder="1-20文字"
          maxLength={20}
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
