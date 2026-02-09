import type { WebSocket } from 'ws'
import { ClientEventSchema, type ServerEvent } from '@meimei-tei/shared'
import { store } from './store.js'
import { randomUUID } from 'crypto'
import { sessionManager } from './session-manager.js'

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
  // Why: 後方互換性のため、welcome用の一時的なuserIdを生成
  const userId = randomUUID()
  let isJoined = false
  // Why: authenticateイベントで受信したuserIdを保存（セッション管理用）
  let authenticatedUserId: string | null = null

  // Welcome メッセージを送信（後方互換性）
  send(ws, { type: 'welcome', userId })

  ws.on('message', (data) => {
    try {
      const raw = JSON.parse(data.toString())
      const event = ClientEventSchema.parse(raw)

      switch (event.type) {
        case 'authenticate': {
          // Why: クライアント生成のuserIdを使用してセッション管理
          authenticatedUserId = event.userId

          // 既存セッション確認
          const existingSession = sessionManager.getSession(event.userId)

          if (existingSession) {
            // Why: ブラウザリロード時、既存セッションを再接続
            sessionManager.updateSession(event.userId, ws)

            // Why: チャット履歴を復元（リロード前のメッセージを送信）
            send(ws, {
              type: 'history_sync',
              messages: existingSession.messages,
            })
          } else {
            // Why: 初回接続時、新規セッション作成
            sessionManager.createSession(event.userId, event.name, ws)
          }

          // Why: セッション確立を通知（クライアントが接続成功を確認）
          send(ws, {
            type: 'authenticated',
            userId: event.userId,
            session: {
              connectedAt: Date.now(),
              serverTime: Date.now(),
            },
          })
          break
        }

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

          const messageData = {
            userId,
            name: user.name,
            text: event.text,
            timestamp: Date.now(),
          }

          // Why: セッションにメッセージを保存（リロード後の履歴復元用）
          if (authenticatedUserId) {
            sessionManager.addMessage(authenticatedUserId, messageData)
          }

          // 全員に配信
          broadcast({
            type: 'message',
            ...messageData,
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
    // Why: セッションは保持（リロード対応のため削除しない）
    // 閉店時に一括削除（clearAllSessions）
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
}
