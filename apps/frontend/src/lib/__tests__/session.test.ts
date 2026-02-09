import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateUserId,
  saveUserId,
  getUserId,
  clearUserId,
  getOrCreateUserId,
} from '../session'

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// グローバルlocalStorageをモックで置き換え
global.localStorage = localStorageMock as Storage

describe('F006: User Session Utility Unit Tests', () => {
  beforeEach(() => {
    // 各テスト前にlocalStorageをクリア
    localStorage.clear()
  })

  describe('generateUserId', () => {
    it('should generate UUID v4 format', () => {
      const userId = generateUserId()

      // UUID v4形式の正規表現チェック
      expect(userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should generate unique IDs on each call', () => {
      const id1 = generateUserId()
      const id2 = generateUserId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('saveUserId', () => {
    it('should save userId to localStorage with key "meimei_userId"', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      saveUserId(userId)

      expect(localStorage.getItem('meimei_userId')).toBe(userId)
    })

    it('should overwrite existing userId', () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000'
      const userId2 = '123e4567-e89b-42d3-a456-426614174000'

      saveUserId(userId1)
      expect(localStorage.getItem('meimei_userId')).toBe(userId1)

      saveUserId(userId2)
      expect(localStorage.getItem('meimei_userId')).toBe(userId2)
    })
  })

  describe('getUserId', () => {
    it('should return userId from localStorage', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      localStorage.setItem('meimei_userId', userId)

      expect(getUserId()).toBe(userId)
    })

    it('should return null if userId does not exist', () => {
      expect(getUserId()).toBeNull()
    })
  })

  describe('clearUserId', () => {
    it('should remove userId from localStorage', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      localStorage.setItem('meimei_userId', userId)

      clearUserId()

      expect(localStorage.getItem('meimei_userId')).toBeNull()
    })

    it('should not throw error if userId does not exist', () => {
      expect(() => clearUserId()).not.toThrow()
    })
  })

  describe('getOrCreateUserId', () => {
    it('should return existing userId if present', () => {
      const existingUserId = '550e8400-e29b-41d4-a716-446655440000'
      localStorage.setItem('meimei_userId', existingUserId)

      const userId = getOrCreateUserId()

      expect(userId).toBe(existingUserId)
      // 新しいIDは生成されない（localStorageに保存されたIDが同じ）
      expect(localStorage.getItem('meimei_userId')).toBe(existingUserId)
    })

    it('should create and save new userId if not present', () => {
      const userId = getOrCreateUserId()

      // UUID v4形式の確認
      expect(userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )

      // localStorageに保存されている
      expect(localStorage.getItem('meimei_userId')).toBe(userId)
    })

    it('should return the same ID on subsequent calls', () => {
      const userId1 = getOrCreateUserId()
      const userId2 = getOrCreateUserId()

      expect(userId1).toBe(userId2)
    })
  })
})
