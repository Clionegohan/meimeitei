import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../store'
import type { User } from '../store'
import type { WebSocket } from 'ws'

/**
 * F003: Store - Seat Management Unit Tests
 *
 * Tests coverage:
 * - updateSeated method
 * - Edge cases (non-existent user)
 */

/**
 * Helper: Create mock WebSocket
 * @returns Mock WebSocket object
 */
function createMockWebSocket(): WebSocket {
  return {
    send: () => {},
    close: () => {},
    // 他のWebSocketメソッドはテストで不要
  } as any as WebSocket
}

describe('F003: Store - Seat Management', () => {
  // 各テストの前にstoreをクリア
  beforeEach(() => {
    store.clear()
  })

  /**
   * updateSeated to true
   *
   * Given: ユーザーが離席中（seated=false）
   * When: updateSeated(userId, true)を呼び出す
   * Then: seated=trueに更新される
   */
  it('should update seated status to true', () => {
    // Given: ユーザーを追加（seated=false）
    const ws = createMockWebSocket()
    const user: User = {
      id: 'user-1',
      name: 'Alice',
      seated: false,
      ws,
    }
    store.addUser(user)

    // When: seated=trueに更新
    store.updateSeated('user-1', true)

    // Then: seatedフラグが更新される
    const updatedUser = store.getUser('user-1')
    expect(updatedUser).toBeDefined()
    expect(updatedUser?.seated).toBe(true)

    // 他のフィールドは変更されない
    expect(updatedUser?.id).toBe('user-1')
    expect(updatedUser?.name).toBe('Alice')
  })

  /**
   * updateSeated to false
   *
   * Given: ユーザーが着席中（seated=true）
   * When: updateSeated(userId, false)を呼び出す
   * Then: seated=falseに更新される
   */
  it('should update seated status to false', () => {
    // Given: ユーザーを追加（seated=true）
    const ws = createMockWebSocket()
    const user: User = {
      id: 'user-2',
      name: 'Bob',
      seated: true,
      ws,
    }
    store.addUser(user)

    // When: seated=falseに更新
    store.updateSeated('user-2', false)

    // Then: seatedフラグが更新される
    const updatedUser = store.getUser('user-2')
    expect(updatedUser).toBeDefined()
    expect(updatedUser?.seated).toBe(false)

    // 他のフィールドは変更されない
    expect(updatedUser?.id).toBe('user-2')
    expect(updatedUser?.name).toBe('Bob')
  })

  /**
   * Edge Case: Non-existent user
   *
   * Given: 存在しないユーザーID
   * When: updateSeated(non-existent-id, true)を呼び出す
   * Then: エラーをスローせず、静かに無視する
   */
  it('should not throw if user does not exist', () => {
    // Given: 空のstore
    expect(store.getUser('non-existent')).toBeUndefined()

    // When/Then: エラーなし
    expect(() => store.updateSeated('non-existent', true)).not.toThrow()

    // ユーザーは追加されない
    expect(store.getUser('non-existent')).toBeUndefined()
  })

  /**
   * Multiple seat state updates
   *
   * Given: ユーザーが離席中
   * When: 複数回seated状態を変更
   * Then: 最後の状態が反映される
   */
  it('should handle multiple seat state updates', () => {
    // Given: ユーザーを追加
    const ws = createMockWebSocket()
    const user: User = {
      id: 'user-3',
      name: 'Charlie',
      seated: false,
      ws,
    }
    store.addUser(user)

    // When: 複数回更新
    store.updateSeated('user-3', true)  // → true
    store.updateSeated('user-3', false) // → false
    store.updateSeated('user-3', true)  // → true

    // Then: 最後の状態が反映される
    const updatedUser = store.getUser('user-3')
    expect(updatedUser?.seated).toBe(true)
  })

  /**
   * Seat state with multiple users
   *
   * Given: 複数ユーザーが存在
   * When: 1人のユーザーのseated状態を変更
   * Then: 他のユーザーには影響しない
   */
  it('should update only the specified user seated status', () => {
    // Given: 3人のユーザーを追加
    const ws = createMockWebSocket()

    store.addUser({ id: 'user-1', name: 'Alice', seated: false, ws })
    store.addUser({ id: 'user-2', name: 'Bob', seated: false, ws })
    store.addUser({ id: 'user-3', name: 'Charlie', seated: true, ws })

    // When: user-2のみ更新
    store.updateSeated('user-2', true)

    // Then: user-2のみ変更される
    expect(store.getUser('user-1')?.seated).toBe(false) // 変更なし
    expect(store.getUser('user-2')?.seated).toBe(true)  // 変更
    expect(store.getUser('user-3')?.seated).toBe(true)  // 変更なし
  })

  /**
   * Seat state persistence
   *
   * Given: ユーザーが着席している
   * When: getAllUsers()で全ユーザーを取得
   * Then: seated状態が含まれている
   */
  it('should persist seated state in user list', () => {
    // Given: 2人のユーザー（1人着席、1人離席）
    const ws = createMockWebSocket()

    store.addUser({ id: 'user-1', name: 'Alice', seated: true, ws })
    store.addUser({ id: 'user-2', name: 'Bob', seated: false, ws })

    // When: 全ユーザーを取得
    const allUsers = store.getAllUsers()

    // Then: seated状態が正しく含まれている
    expect(allUsers).toHaveLength(2)

    const alice = allUsers.find((u) => u.id === 'user-1')
    const bob = allUsers.find((u) => u.id === 'user-2')

    expect(alice?.seated).toBe(true)
    expect(bob?.seated).toBe(false)
  })

  /**
   * Edge Case: Update seated for removed user
   *
   * Given: ユーザーが削除されている
   * When: updateSeated()を呼び出す
   * Then: エラーなし、静かに無視
   */
  it('should handle updateSeated for removed user', () => {
    // Given: ユーザーを追加して削除
    const ws = createMockWebSocket()
    store.addUser({ id: 'user-1', name: 'Alice', seated: false, ws })
    store.removeUser('user-1')

    // ユーザーが削除されていることを確認
    expect(store.getUser('user-1')).toBeUndefined()

    // When/Then: エラーなし
    expect(() => store.updateSeated('user-1', true)).not.toThrow()

    // ユーザーは再追加されない
    expect(store.getUser('user-1')).toBeUndefined()
  })
})
