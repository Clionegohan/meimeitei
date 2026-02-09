import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sessionManager, type UserSession } from '../session-manager'
import type { WebSocket } from 'ws'

// WebSocketのモック
const createMockWebSocket = (): WebSocket => {
  return {
    on: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
  } as unknown as WebSocket
}

describe('F006: SessionManager Unit Tests', () => {
  beforeEach(() => {
    // 各テスト前に全セッションをクリア
    sessionManager.clearAllSessions()
  })

  describe('createSession', () => {
    it('should create new session with correct properties', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const name = 'Alice'
      const ws = createMockWebSocket()

      const session = sessionManager.createSession(userId, name, ws)

      expect(session.userId).toBe(userId)
      expect(session.name).toBe(name)
      expect(session.ws).toBe(ws)
      expect(session.socketId).toBeTruthy()
      expect(session.connectedAt).toBeTypeOf('number')
      expect(session.lastActivityAt).toBeTypeOf('number')
      expect(session.messages).toEqual([])
    })

    it('should generate unique socketId', () => {
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      const session1 = sessionManager.createSession(
        '550e8400-e29b-41d4-a716-446655440000',
        'Alice',
        ws1
      )
      const session2 = sessionManager.createSession(
        '123e4567-e89b-42d3-a456-426614174000',
        'Bob',
        ws2
      )

      expect(session1.socketId).not.toBe(session2.socketId)
    })

    it('should overwrite existing session with same userId', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      const session1 = sessionManager.createSession(userId, 'Alice', ws1)
      const session2 = sessionManager.createSession(userId, 'Alice Updated', ws2)

      expect(session2.name).toBe('Alice Updated')
      expect(sessionManager.getSession(userId)?.name).toBe('Alice Updated')
    })
  })

  describe('getSession', () => {
    it('should return session if exists', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws = createMockWebSocket()

      sessionManager.createSession(userId, 'Alice', ws)
      const session = sessionManager.getSession(userId)

      expect(session).toBeDefined()
      expect(session?.userId).toBe(userId)
      expect(session?.name).toBe('Alice')
    })

    it('should return undefined if session does not exist', () => {
      const session = sessionManager.getSession('non-existent-id')

      expect(session).toBeUndefined()
    })
  })

  describe('updateSession', () => {
    it('should update WebSocket and socketId', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      sessionManager.createSession(userId, 'Alice', ws1)
      const originalSocketId = sessionManager.getSession(userId)?.socketId

      sessionManager.updateSession(userId, ws2)

      const updatedSession = sessionManager.getSession(userId)
      expect(updatedSession?.ws).toBe(ws2)
      expect(updatedSession?.socketId).not.toBe(originalSocketId)
    })

    it('should update lastActivityAt timestamp', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      sessionManager.createSession(userId, 'Alice', ws1)
      const originalTimestamp = sessionManager.getSession(userId)?.lastActivityAt

      // わずかな遅延を入れてタイムスタンプが変わることを確認
      setTimeout(() => {
        sessionManager.updateSession(userId, ws2)

        const updatedTimestamp = sessionManager.getSession(userId)?.lastActivityAt
        expect(updatedTimestamp).toBeGreaterThanOrEqual(originalTimestamp!)
      }, 10)
    })

    it('should not throw if session does not exist', () => {
      const ws = createMockWebSocket()

      expect(() =>
        sessionManager.updateSession('non-existent-id', ws)
      ).not.toThrow()
    })
  })

  describe('addMessage', () => {
    it('should add message to session', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws = createMockWebSocket()

      sessionManager.createSession(userId, 'Alice', ws)

      const message = {
        userId,
        name: 'Alice',
        text: 'Hello, world!',
        timestamp: Date.now(),
      }

      sessionManager.addMessage(userId, message)

      const session = sessionManager.getSession(userId)
      expect(session?.messages).toHaveLength(1)
      expect(session?.messages[0]).toEqual(message)
    })

    it('should append multiple messages', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws = createMockWebSocket()

      sessionManager.createSession(userId, 'Alice', ws)

      const message1 = {
        userId,
        name: 'Alice',
        text: 'Message 1',
        timestamp: Date.now(),
      }
      const message2 = {
        userId,
        name: 'Alice',
        text: 'Message 2',
        timestamp: Date.now(),
      }

      sessionManager.addMessage(userId, message1)
      sessionManager.addMessage(userId, message2)

      const session = sessionManager.getSession(userId)
      expect(session?.messages).toHaveLength(2)
      expect(session?.messages[0].text).toBe('Message 1')
      expect(session?.messages[1].text).toBe('Message 2')
    })

    it('should not throw if session does not exist', () => {
      const message = {
        userId: 'non-existent-id',
        name: 'Ghost',
        text: 'Message',
        timestamp: Date.now(),
      }

      expect(() =>
        sessionManager.addMessage('non-existent-id', message)
      ).not.toThrow()
    })
  })

  describe('deleteSession', () => {
    it('should delete session', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const ws = createMockWebSocket()

      sessionManager.createSession(userId, 'Alice', ws)
      expect(sessionManager.getSession(userId)).toBeDefined()

      sessionManager.deleteSession(userId)
      expect(sessionManager.getSession(userId)).toBeUndefined()
    })

    it('should not throw if session does not exist', () => {
      expect(() => sessionManager.deleteSession('non-existent-id')).not.toThrow()
    })
  })

  describe('clearAllSessions', () => {
    it('should clear all sessions', () => {
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()
      const ws3 = createMockWebSocket()

      sessionManager.createSession(
        '550e8400-e29b-41d4-a716-446655440000',
        'Alice',
        ws1
      )
      sessionManager.createSession(
        '123e4567-e89b-42d3-a456-426614174000',
        'Bob',
        ws2
      )
      sessionManager.createSession(
        '987fcdeb-51a2-43d1-9876-543210fedcba',
        'Charlie',
        ws3
      )

      sessionManager.clearAllSessions()

      expect(sessionManager.getSession('550e8400-e29b-41d4-a716-446655440000')).toBeUndefined()
      expect(sessionManager.getSession('123e4567-e89b-42d3-a456-426614174000')).toBeUndefined()
      expect(sessionManager.getSession('987fcdeb-51a2-43d1-9876-543210fedcba')).toBeUndefined()
    })

    it('should work on empty sessions', () => {
      expect(() => sessionManager.clearAllSessions()).not.toThrow()
    })
  })
})
