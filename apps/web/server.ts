import { createServer } from 'node:http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { nextCloseAfter, type UserId } from '@me-me-en/domain'
import { recordPresenceEvent } from './src/server/di'
import { broadcastToAll, setIoServer } from './src/server/realtime/io-bridge'

// Custom server hosting Next.js + Socket.IO on the same HTTP port.

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)

// dev の営業時間 bypass 中は強制閉店を行わない (ローカル QA を妨げないため)。
const isBusinessHoursBypassed = (): boolean =>
  process.env.NODE_ENV !== 'production' &&
  process.env.BYPASS_BUSINESS_HOURS === 'true'

// 信号送出から切断までの猶予。client が server:closed を受け取って遷移する時間を確保。
const CLOSE_DRAIN_MS = 1_000

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

  // spec B: 05:00 JST 閉店の瞬間、接続中の全 client を強制的に閉店中画面へ送る。
  // 次の閉店時刻まで setTimeout で待ち、発火時に server:closed を broadcast →
  // 少し待って全 socket を切断 → 翌日の閉店を再予約する。
  // (idle で接続したまま夜を跨いだ tab を能動的に蹴るのが目的。navigation 時の
  //  redirect は middleware が別途担保している。)
  const scheduleForceClose = (): void => {
    if (isBusinessHoursBypassed()) return
    const now = new Date()
    const closeAt = nextCloseAfter(now)
    const delay = Math.max(0, closeAt.getTime() - now.getTime())
    setTimeout(() => {
      // trigger-only。client は受信したら /closed へ遷移する。
      broadcastToAll('server:closed', { reason: 'business-hours' })
      // 信号が flush されるのを待ってから接続を切る。
      setTimeout(() => {
        io.disconnectSockets(true)
      }, CLOSE_DRAIN_MS)
      scheduleForceClose()
    }, delay)
  }
  scheduleForceClose()

  httpServer.listen(port, () => {
    console.log(`me-me-en listening on http://localhost:${port} (dev=${dev})`)
  })
})
