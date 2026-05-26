import type { Server as SocketIOServer } from 'socket.io'

// Process-wide bridge between the Socket.IO server (initialized in
// apps/web/server.ts) and the rest of the Node code (server actions,
// route handlers). They share a single Node process when running under
// tsx, so a module-level reference is enough.
//
// In dev, Next.js may HMR-reload modules that import this bridge. The
// server entry sets the ref again only when the http server starts;
// during normal dev edits the ref stays alive because server.ts is
// loaded by tsx, not by Next's webpack/turbopack.
let ioRef: SocketIOServer | null = null

export const setIoServer = (io: SocketIOServer): void => {
  ioRef = io
}

export const broadcastToConversation = (
  conversationId: string,
  event: string,
  payload: unknown,
): void => {
  if (ioRef === null) return
  ioRef.to(`conv:${conversationId}`).emit(event, payload)
}

export const broadcastToUser = (
  userId: string,
  event: string,
  payload: unknown,
): void => {
  if (ioRef === null) return
  ioRef.to(`user:${userId}`).emit(event, payload)
}
