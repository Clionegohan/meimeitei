import { createServer } from 'node:http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import type { UserId } from '@me-me-en/domain'
import { recordPresenceEvent } from './src/server/di'
import { broadcastToAll, setIoServer } from './src/server/realtime/io-bridge'

// Custom server hosting Next.js + Socket.IO on the same HTTP port.

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)

const app = next({ dev })
const handle = app.getRequestHandler()

void app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: false },
  })

  setIoServer(io)

  // Auth: MVPα uses the client-provided userId from the handshake. Future
  // hardening: parse the Auth.js session cookie here.
  io.use((socket, nextHook) => {
    const userId = socket.handshake.auth.userId
    if (typeof userId !== 'string' || userId.length === 0) {
      nextHook(new Error('unauthorized'))
      return
    }
    socket.data.userId = userId
    nextHook()
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    void socket.join(`user:${userId}`)
    // 「在席の刻」集計用 event log。複数タブ接続でも online を毎回積む
    // 近似で十分（hourly chart は max 正規化で吸収する）。
    void recordPresenceEvent({ userId: userId as UserId, type: 'online' })
    // presence:update は trigger-only。client は受信したら router.refresh() で
    // 灯ともる羊リストを revalidate する。payload に userId は載せない:
    // 「誰が変わったか」をリークさせず block / visibility は SSR 側で再評価される。
    broadcastToAll('presence:update', { type: 'changed' })

    socket.on('conversation:join', (conversationId: string) => {
      if (typeof conversationId !== 'string' || conversationId.length === 0) return
      void socket.join(`conv:${conversationId}`)
    })

    socket.on('conversation:leave', (conversationId: string) => {
      if (typeof conversationId !== 'string' || conversationId.length === 0) return
      void socket.leave(`conv:${conversationId}`)
    })

    // Typing is transport-level only in MVPα; broadcast to the room and
    // skip the TypingRepository.
    socket.on('typing:start', (conversationId: string) => {
      if (typeof conversationId !== 'string') return
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: true,
      })
    })

    socket.on('typing:stop', (conversationId: string) => {
      if (typeof conversationId !== 'string') return
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false,
      })
    })

    socket.on('disconnect', () => {
      // recordPresenceEvent は意図的に BusinessHoursGuard を外しているので、
      // 05:00 force-disconnect 時にも offline を記録できる。
      void recordPresenceEvent({ userId: userId as UserId, type: 'offline' })
      broadcastToAll('presence:update', { type: 'changed' })
    })
  })

  httpServer.listen(port, () => {
    console.log(`me-me-en listening on http://localhost:${port} (dev=${dev})`)
  })
})
