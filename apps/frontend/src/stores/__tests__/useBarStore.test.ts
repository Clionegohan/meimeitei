import { describe, it, expect, beforeEach } from 'vitest'
import { useBarStore } from '../useBarStore'
import type { SeatChangedEvent } from '@meimei-tei/shared'

/**
 * F003: useBarStore - Seat State Management Unit Tests
 *
 * Tests coverage:
 * - AC-2: seat_changedイベントの処理
 * - AC-7: Immutableパターンでの状態更新
 */

describe('F003: useBarStore - Seat State Management', () => {
  // 各テストの前にstoreをリセット
  beforeEach(() => {
    useBarStore.setState({
      userId: null,
      users: [],
      messages: [],
    })
  })

  /**
   * AC-2: seat_changedイベントでユーザーの座席状態が更新される
   *
   * Given: 複数ユーザーが存在する
   * When: seat_changedイベントを受信
   * Then: 該当ユーザーのseated状態が更新される
   */
  it('should update user seated status on seat_changed event', () => {
    // Given: 2人のユーザー
    useBarStore.setState({
      users: [
        { id: 'user-1', name: 'Alice', seated: false },
        { id: 'user-2', name: 'Bob', seated: false },
      ],
    })

    // When: user-1が着席
    const event: SeatChangedEvent = {
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    }
    useBarStore.getState().handleServerEvent(event)

    // Then: user-1のみseated=true
    const users = useBarStore.getState().users
    expect(users).toHaveLength(2)
    expect(users[0].seated).toBe(true)  // Alice: seated=true
    expect(users[1].seated).toBe(false) // Bob: seated=false
  })

  /**
   * AC-7: Immutableパターンでの状態更新
   *
   * Given: 複数ユーザーが存在する
   * When: seat_changedイベントを受信
   * Then:
   * - 新しいusers配列が生成される
   * - 変更されたユーザーのみ新しいオブジェクトが作成される
   * - 他のユーザーは同一参照を保持する
   */
  it('should maintain immutability on seat_changed', () => {
    // Given: 2人のユーザー
    const originalUsers = [
      { id: 'user-1', name: 'Alice', seated: false },
      { id: 'user-2', name: 'Bob', seated: false },
    ]

    useBarStore.setState({ users: originalUsers })

    // When: user-1が着席
    const event: SeatChangedEvent = {
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    }
    useBarStore.getState().handleServerEvent(event)

    const updatedUsers = useBarStore.getState().users

    // Then: 新しい配列が生成される
    expect(updatedUsers).not.toBe(originalUsers)

    // Then: user-1は新しいオブジェクト
    expect(updatedUsers[0]).not.toBe(originalUsers[0])
    expect(updatedUsers[0].id).toBe('user-1')
    expect(updatedUsers[0].seated).toBe(true)

    // Then: user-2は同一参照を保持（最適化）
    expect(updatedUsers[1]).toBe(originalUsers[1])
  })

  /**
   * Multiple seat_changed events
   *
   * Given: 複数ユーザーが存在する
   * When: 複数のseat_changedイベントを連続受信
   * Then: 各ユーザーの状態が正しく更新される
   */
  it('should handle multiple seat_changed events', () => {
    // Given: 3人のユーザー
    useBarStore.setState({
      users: [
        { id: 'user-1', name: 'Alice', seated: false },
        { id: 'user-2', name: 'Bob', seated: false },
        { id: 'user-3', name: 'Charlie', seated: false },
      ],
    })

    // When: 順番にイベント受信
    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    })

    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-3',
      seated: true,
    })

    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: false,
    })

    // Then: 最終状態が正しい
    const users = useBarStore.getState().users
    expect(users[0].seated).toBe(false) // Alice: true → false
    expect(users[1].seated).toBe(false) // Bob: 変更なし
    expect(users[2].seated).toBe(true)  // Charlie: true
  })

  /**
   * Edge Case: seat_changed for non-existent user
   *
   * Given: ユーザーリストが空
   * When: 存在しないユーザーのseat_changedイベント受信
   * Then: エラーなし、状態変化なし
   */
  it('should handle seat_changed for non-existent user', () => {
    // Given: ユーザーリストが空
    useBarStore.setState({ users: [] })

    // When: 存在しないユーザーのイベント受信
    const event: SeatChangedEvent = {
      type: 'seat_changed',
      userId: 'non-existent',
      seated: true,
    }

    // Then: エラーなし
    expect(() => useBarStore.getState().handleServerEvent(event)).not.toThrow()

    // ユーザーリストは空のまま
    expect(useBarStore.getState().users).toHaveLength(0)
  })

  /**
   * Edge Case: Rapid seat state changes
   *
   * Given: ユーザーが存在する
   * When: 同じユーザーのseat_changedイベントを連続受信
   * Then: 最後の状態が反映される
   */
  it('should handle rapid seat state changes', () => {
    // Given: ユーザーが存在
    useBarStore.setState({
      users: [{ id: 'user-1', name: 'Alice', seated: false }],
    })

    // When: 連続イベント（true → false → true）
    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    })

    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: false,
    })

    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    })

    // Then: 最後の状態（true）が反映される
    const users = useBarStore.getState().users
    expect(users[0].seated).toBe(true)
  })

  /**
   * Immutability: Array length preservation
   *
   * Given: 複数ユーザーが存在
   * When: 1人のseat_changedイベント受信
   * Then: 配列の長さは変わらない
   */
  it('should preserve array length on seat_changed', () => {
    // Given: 5人のユーザー
    const users = [
      { id: 'user-1', name: 'Alice', seated: false },
      { id: 'user-2', name: 'Bob', seated: false },
      { id: 'user-3', name: 'Charlie', seated: false },
      { id: 'user-4', name: 'Dave', seated: false },
      { id: 'user-5', name: 'Eve', seated: false },
    ]

    useBarStore.setState({ users })

    // When: user-3が着席
    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-3',
      seated: true,
    })

    // Then: 配列の長さは変わらない
    const updatedUsers = useBarStore.getState().users
    expect(updatedUsers).toHaveLength(5)
  })

  /**
   * Immutability: Field preservation
   *
   * Given: ユーザーが存在
   * When: seat_changedイベント受信
   * Then: id, nameフィールドは変更されない
   */
  it('should preserve other fields on seat_changed', () => {
    // Given: ユーザーが存在
    useBarStore.setState({
      users: [{ id: 'user-1', name: 'Alice', seated: false }],
    })

    // When: seatedのみ変更
    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    })

    // Then: id, nameは変更されない
    const user = useBarStore.getState().users[0]
    expect(user.id).toBe('user-1')
    expect(user.name).toBe('Alice')
    expect(user.seated).toBe(true)
  })

  /**
   * Integration: seat_changed after user_joined
   *
   * Given: user_joinedイベントでユーザーが追加される
   * When: その後seat_changedイベント受信
   * Then: 座席状態が正しく更新される
   */
  it('should update seat state after user joins', () => {
    // Given: user_joinedイベント受信
    useBarStore.getState().handleServerEvent({
      type: 'user_joined',
      userId: 'user-1',
      name: 'Alice',
    })

    // ユーザーが追加されていることを確認（seated=false）
    expect(useBarStore.getState().users).toHaveLength(1)
    expect(useBarStore.getState().users[0].seated).toBe(false)

    // When: seat_changedイベント受信
    useBarStore.getState().handleServerEvent({
      type: 'seat_changed',
      userId: 'user-1',
      seated: true,
    })

    // Then: seated状態が更新される
    expect(useBarStore.getState().users[0].seated).toBe(true)
  })

  /**
   * Edge Case: seat_changed after user_left
   *
   * Given: ユーザーがuser_leftで削除される
   * When: その後seat_changedイベント受信
   * Then: エラーなし、状態変化なし
   */
  it('should ignore seat_changed for left user', () => {
    // Given: ユーザーが追加されて削除される
    useBarStore.setState({
      users: [{ id: 'user-1', name: 'Alice', seated: false }],
    })

    useBarStore.getState().handleServerEvent({
      type: 'user_left',
      userId: 'user-1',
    })

    // ユーザーが削除されたことを確認
    expect(useBarStore.getState().users).toHaveLength(0)

    // When: 削除されたユーザーのseat_changedイベント受信
    // Then: エラーなし
    expect(() =>
      useBarStore.getState().handleServerEvent({
        type: 'seat_changed',
        userId: 'user-1',
        seated: true,
      })
    ).not.toThrow()

    // ユーザーリストは空のまま
    expect(useBarStore.getState().users).toHaveLength(0)
  })
})
