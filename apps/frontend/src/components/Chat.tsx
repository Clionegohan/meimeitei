'use client'

import { useState } from 'react'
import { useBarStore } from '@/stores/useBarStore'
import { sendEvent } from '@/ws/client'

export default function Chat() {
  const messages = useBarStore((state) => state.messages)
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = text.trim()
    if (trimmed.length === 0 || trimmed.length > 500) return

    sendEvent({ type: 'send_message', text: trimmed })
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-bold text-blue-400">{msg.name}: </span>
            <span className="text-gray-200">{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力 (最大500文字)"
          maxLength={500}
          className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:border-blue-500"
        />
      </form>
    </div>
  )
}
