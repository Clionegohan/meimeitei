import type { ClientEvent } from '@meimei-tei/shared'

let ws: WebSocket | null = null

export function setWebSocket(socket: WebSocket) {
  ws = socket
}

export function sendEvent(event: ClientEvent) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event))
  }
}
