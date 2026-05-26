'use client'

import { io as ioClient, type Socket } from 'socket.io-client'

// Single shared client-side Socket.IO connection.
// MVPα authenticates via `auth.userId` in the handshake. Future hardening
// will rely on the Auth.js session cookie instead.
let socket: Socket | null = null

export const getSocket = (userId: string): Socket => {
  if (socket !== null) return socket
  socket = ioClient({
    path: '/socket.io',
    auth: { userId },
    autoConnect: true,
  })
  return socket
}

export const disconnectSocket = (): void => {
  if (socket !== null) {
    socket.disconnect()
    socket = null
  }
}
