import type { WebSocket } from 'ws'
import { ClientEventSchema, type ServerEvent } from '@meimei-tei/shared'
import { store } from './store.js'
import { randomUUID } from 'crypto'

export function broadcast(event: ServerEvent, exclude?: WebSocket): void {
  const message = JSON.stringify(event)

  for (const user of store.getAllUsers()) {
    if (user.ws !== exclude && user.ws.readyState === 1) { // OPEN
      user.ws.send(message)
    }
  }
}

export function send(ws: WebSocket, event: ServerEvent): void {
  if (ws.readyState === 1) { // OPEN
    ws.send(JSON.stringify(event))
  }
}

export function handleConnection(ws: WebSocket): void {
  const userId = randomUUID()
  let isJoined = false

  // Welcome メッセージを送信
  send(ws, { type: 'welcome', userId })

  ws.on('message', (data) => {
    try {
      const raw = JSON.parse(data.toString())
      const event = ClientEventSchema.parse(raw)

      switch (event.type) {
        case 'join': {
          if (isJoined) return

          // ユーザーを追加
          store.addUser({
            id: userId,
            name: event.name,
            seated: false,
            ws,
          })
          isJoined = true

          // 既存ユーザー一覧を送信
          const users = store.getAllUsers().map((u) => ({
            id: u.id,
            name: u.name,
            seated: u.seated,
          }))
          send(ws, { type: 'state_sync', users })

          // 他のユーザーに通知
          broadcast(
            {
              type: 'user_joined',
              userId,
              name: event.name,
            },
            ws
          )
          break
        }

        case 'seat_toggle': {
          if (!isJoined) return

          const user = store.getUser(userId)
          if (!user) return

          const newSeated = !user.seated
          store.updateSeated(userId, newSeated)

          // 全員に通知
          broadcast({
            type: 'seat_changed',
            userId,
            seated: newSeated,
          })
          break
        }

        case 'send_message': {
          if (!isJoined) return

          const user = store.getUser(userId)
          if (!user) return

          // 全員に配信
          broadcast({
            type: 'message',
            userId,
            name: user.name,
            text: event.text,
            timestamp: Date.now(),
          })
          break
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
    }
  })

  ws.on('close', () => {
    if (isJoined) {
      store.removeUser(userId)
      broadcast({ type: 'user_left', userId })
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
}
