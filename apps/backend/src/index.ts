import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { app } from './app.js'
import { handleConnection } from './ws-handler.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

// HTTP サーバーを作成
const server = createServer((req, res) => {
  // Hono に HTTP リクエストを委譲
  app.fetch(
    new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    })
  ).then((response) => {
    res.writeHead(response.status, Object.fromEntries(response.headers))
    response.body?.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk)
        },
        close() {
          res.end()
        },
      })
    )
  })
})

// WebSocket サーバーを同一サーバーにアタッチ
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', handleConnection)

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`)
})
