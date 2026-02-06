'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/status`)
      .then((res) => res.json())
      .then((data: { open: boolean }) => {
        setIsOpen(data.open)
        setLoading(false)
        if (data.open) {
          router.push('/enter')
        }
      })
      .catch(() => {
        // バックエンド未起動時はCLOSED扱い
        setIsOpen(false)
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-6xl font-bold mb-4">めぃめぃ亭</h1>
        <p className="text-2xl text-red-400">CLOSED</p>
        <p className="mt-4 text-gray-400">営業時間: 22:00 - 04:00 (JST)</p>
      </div>
    )
  }

  return null
}
