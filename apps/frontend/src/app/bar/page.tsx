'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useWsConnection } from '@/ws/useWsConnection'
import { useBarStore } from '@/stores/useBarStore'
import { sendEvent } from '@/ws/client'
import Chat from '@/components/Chat'

const BarScene = dynamic(() => import('@/components/BarScene'), { ssr: false })

export default function BarPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const userId = useBarStore((state) => state.userId)
  const users = useBarStore((state) => state.users)

  useWsConnection()

  useEffect(() => {
    const name = localStorage.getItem('meimei_username')
    if (!name) {
      router.push('/')
      return
    }
    setUsername(name)
  }, [router])

  useEffect(() => {
    if (userId && username) {
      sendEvent({ type: 'join', name: username })
    }
  }, [userId, username])

  const currentUser = users.find((u) => u.id === userId)

  const handleSeatToggle = () => {
    sendEvent({ type: 'seat_toggle' })
  }

  if (!username) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">めぃめぃ亭</h1>
      </header>
      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 flex flex-col">
          <BarScene />
          <div className="p-4">
            <button
              onClick={handleSeatToggle}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              {currentUser?.seated ? '離席' : '着席'}
            </button>
          </div>
          <div className="flex-1 p-4">
            <h2 className="text-lg font-bold mb-2">参加者 ({users.length})</h2>
            <ul className="space-y-1 text-sm">
              {users.map((user) => (
                <li key={user.id} className="text-gray-300">
                  {user.name} {user.seated ? '🪑' : ''}
                  {user.id === userId ? ' (あなた)' : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="w-96 border-l border-gray-700 bg-gray-800">
          <Chat />
        </div>
      </div>
    </div>
  )
}
