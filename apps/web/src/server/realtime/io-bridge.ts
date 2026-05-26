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

// Broadcast to every connected socket. Used for trigger-only signals like
// `presence:update` where the client revalidates SSR state on receipt.
export const broadcastToAll = (event: string, payload: unknown): void => {
  if (ioRef === null) return
  ioRef.emit(event, payload)
}

// Broadcast to every connected socket EXCEPT sockets in `user:{userId}`
// rooms for the given user ids. Used for block-aware `post:new` where the
// author's blockers / blocked users must not receive the post.
export const broadcastToAllExcept = (
  excludeUserIds: readonly string[],
  event: string,
  payload: unknown,
): void => {
  if (ioRef === null) return
  if (excludeUserIds.length === 0) {
    ioRef.emit(event, payload)
    return
  }
  const rooms = excludeUserIds.map((uid) => `user:${uid}`)
  ioRef.except(rooms).emit(event, payload)
}
