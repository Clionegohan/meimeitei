import { useEffect } from 'react'
import { useBarStore } from '@/stores/useBarStore'
import { setWebSocket } from './client'
import { ServerEventSchema } from '@meimei-tei/shared'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'

export function useWsConnection() {
  useEffect(() => {
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      setWebSocket(ws)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const parsed = ServerEventSchema.parse(data)
        // 最新のhandleServerEventを直接取得して使用
        useBarStore.getState().handleServerEvent(parsed)
      } catch (error) {
        console.error('Failed to parse server event:', error)
      }
    }

    ws.onerror = (error) => {
      // WebSocket接続エラーはログのみ（開発環境のエラーオーバーレイを防ぐ）
      console.warn('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, []) // 依存配列を空にしてWebSocketを1回だけ作成
}
