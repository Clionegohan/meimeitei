import { createServer } from 'node:http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

// Custom server that hosts Next.js and Socket.IO on the same HTTP port.
// Socket event handlers are added in later Phases (5-3 DM, 5-4 timeline).

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

  io.on('connection', (socket) => {
    // Phase 5-3/5-4 will register message / typing / presence handlers here.
    socket.on('disconnect', () => {
      // no-op for now
    })
  })

  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`me-me-en listening on http://localhost:${port} (dev=${dev})`)
  })
})
