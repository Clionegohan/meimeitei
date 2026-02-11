import { describe, it, expect, beforeEach } from 'vitest'
import { useBarStore } from '../useBarStore'
import type { SeatChangedEvent, MessageEvent } from '@meimei-tei/shared'

/**
 * F003: useBarStore - Seat State Management Unit Tests
 *
 * Tests coverage:
 * - AC-2: seat_changedイベントの処理
 * - AC-7: Immutableパターンでの状態更新
 *
 * F004: useBarStore - Chat Message Management Unit Tests
 *
 * Tests coverage:
 * - AC-2: messageイベントの処理
 * - AC-8: Immutableパターンでのメッセージ追加
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

/**
 * F004: useBarStore - Chat Message Management Unit Tests
 *
 * Tests coverage:
 * - AC-2, AC-8: messageイベントでメッセージが追加される
 * - AC-8: Immutableパターンでの状態更新
 */
describe('F004: useBarStore - Chat Message Management', () => {
  // 各テストの前にstoreをリセット
  beforeEach(() => {
    useBarStore.setState({
      userId: null,
      users: [],
      messages: [],
    })
  })

  /**
   * AC-2: messageイベントでメッセージが追加される
   *
   * Given: メッセージリストが空
   * When: messageイベントを受信
   * Then: メッセージが配列に追加される
   */
  it('should add message to messages array on message event', () => {
    // Given: メッセージリストが空
    expect(useBarStore.getState().messages).toHaveLength(0)

    // When: messageイベント受信
    const event: MessageEvent = {
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Hello, World!',
      timestamp: Date.now(),
    }
    useBarStore.getState().handleServerEvent(event)

    // Then: メッセージが追加される
    const messages = useBarStore.getState().messages
    expect(messages).toHaveLength(1)
    expect(messages[0].userId).toBe('user-1')
    expect(messages[0].name).toBe('Alice')
    expect(messages[0].text).toBe('Hello, World!')
    expect(messages[0].timestamp).toBeTypeOf('number')
  })

  /**
   * AC-8: Immutableパターンでの状態更新
   *
   * Given: 既存のメッセージリストが存在
   * When: 新しいmessageイベントを受信
   * Then:
   * - 新しいmessages配列が生成される
   * - 元の配列は変更されない
   * - 新しいメッセージは配列の末尾に追加される
   */
  it('should maintain immutability on message event', () => {
    // Given: 既存のメッセージリスト
    const originalMessages = [
      {
        userId: 'user-1',
        name: 'Alice',
        text: 'First message',
        timestamp: 100,
      },
    ]

    useBarStore.setState({ messages: originalMessages })

    // When: 新しいmessageイベント受信
    const event: MessageEvent = {
      type: 'message',
      userId: 'user-2',
      name: 'Bob',
      text: 'Second message',
      timestamp: 200,
    }
    useBarStore.getState().handleServerEvent(event)

    const updatedMessages = useBarStore.getState().messages

    // Then: 新しい配列が生成される
    expect(updatedMessages).not.toBe(originalMessages)

    // Then: 元の配列は変更されない
    expect(originalMessages).toHaveLength(1)
    expect(originalMessages[0].text).toBe('First message')

    // Then: 新しい配列は2つのメッセージを持つ
    expect(updatedMessages).toHaveLength(2)
    expect(updatedMessages[0].text).toBe('First message')
    expect(updatedMessages[1].text).toBe('Second message')
  })

  /**
   * Multiple message events
   *
   * Given: メッセージリストが空
   * When: 複数のmessageイベントを連続受信
   * Then: メッセージが順番に追加される
   */
  it('should handle multiple message events', () => {
    // Given: メッセージリストが空
    expect(useBarStore.getState().messages).toHaveLength(0)

    // When: 3つのメッセージを順番に受信
    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'First',
      timestamp: 100,
    })

    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-2',
      name: 'Bob',
      text: 'Second',
      timestamp: 200,
    })

    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Third',
      timestamp: 300,
    })

    // Then: 3つのメッセージが順番に保持される
    const messages = useBarStore.getState().messages
    expect(messages).toHaveLength(3)
    expect(messages[0].text).toBe('First')
    expect(messages[1].text).toBe('Second')
    expect(messages[2].text).toBe('Third')
  })

  /**
   * Message order preservation
   *
   * Given: メッセージリストが空
   * When: メッセージを時系列順に受信
   * Then: メッセージの順序が保持される
   */
  it('should preserve message order', () => {
    // Given: メッセージリストが空
    const messages = [
      { userId: 'user-1', name: 'Alice', text: 'Message 1', timestamp: 1000 },
      { userId: 'user-2', name: 'Bob', text: 'Message 2', timestamp: 2000 },
      { userId: 'user-3', name: 'Charlie', text: 'Message 3', timestamp: 3000 },
      { userId: 'user-1', name: 'Alice', text: 'Message 4', timestamp: 4000 },
      { userId: 'user-2', name: 'Bob', text: 'Message 5', timestamp: 5000 },
    ]

    // When: メッセージを順番に受信
    messages.forEach((msg) => {
      useBarStore.getState().handleServerEvent({
        type: 'message',
        ...msg,
      })
    })

    // Then: 順序が保持される
    const storedMessages = useBarStore.getState().messages
    expect(storedMessages).toHaveLength(5)
    storedMessages.forEach((msg, i) => {
      expect(msg.text).toBe(`Message ${i + 1}`)
      expect(msg.timestamp).toBe((i + 1) * 1000)
    })
  })

  /**
   * AC-8: Array length growth
   *
   * Given: 既存のメッセージリスト
   * When: 新しいmessageイベント受信
   * Then: 配列の長さが1増える
   */
  it('should grow messages array length on each message event', () => {
    // Given: 初期メッセージ
    useBarStore.setState({
      messages: [
        { userId: 'user-1', name: 'Alice', text: 'Initial', timestamp: 100 },
      ],
    })

    expect(useBarStore.getState().messages).toHaveLength(1)

    // When: 新しいメッセージ受信
    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-2',
      name: 'Bob',
      text: 'New message',
      timestamp: 200,
    })

    // Then: 配列の長さが2になる
    expect(useBarStore.getState().messages).toHaveLength(2)
  })

  /**
   * Field preservation
   *
   * Given: messageイベントを受信
   * When: storeに追加される
   * Then: 全フィールドが正しく保持される
   */
  it('should preserve all message fields', () => {
    // Given: messageイベント
    const event: MessageEvent = {
      type: 'message',
      userId: 'user-123',
      name: 'Alice',
      text: 'Test message',
      timestamp: 1707609600000,
    }

    // When: イベント受信
    useBarStore.getState().handleServerEvent(event)

    // Then: 全フィールドが保持される
    const message = useBarStore.getState().messages[0]
    expect(message.userId).toBe('user-123')
    expect(message.name).toBe('Alice')
    expect(message.text).toBe('Test message')
    expect(message.timestamp).toBe(1707609600000)
  })

  /**
   * Different users' messages
   *
   * Given: 複数ユーザーが存在
   * When: 各ユーザーからメッセージを受信
   * Then: 全ユーザーのメッセージが保持される
   */
  it('should handle messages from different users', () => {
    // Given & When: 3人のユーザーからメッセージ受信
    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Hello from Alice',
      timestamp: 100,
    })

    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-2',
      name: 'Bob',
      text: 'Hello from Bob',
      timestamp: 200,
    })

    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-3',
      name: 'Charlie',
      text: 'Hello from Charlie',
      timestamp: 300,
    })

    // Then: 3つのメッセージが保持される
    const messages = useBarStore.getState().messages
    expect(messages).toHaveLength(3)
    expect(messages[0].name).toBe('Alice')
    expect(messages[1].name).toBe('Bob')
    expect(messages[2].name).toBe('Charlie')
  })

  /**
   * Same user multiple messages
   *
   * Given: 1人のユーザーが複数メッセージを送信
   * When: 連続してmessageイベント受信
   * Then: 全メッセージが保持される
   */
  it('should handle multiple messages from same user', () => {
    // Given & When: Aliceから3つのメッセージ
    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Message 1',
      timestamp: 100,
    })

    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Message 2',
      timestamp: 200,
    })

    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Message 3',
      timestamp: 300,
    })

    // Then: 3つのメッセージが全て保持される
    const messages = useBarStore.getState().messages
    expect(messages).toHaveLength(3)
    expect(messages.every((m) => m.name === 'Alice')).toBe(true)
    expect(messages.every((m) => m.userId === 'user-1')).toBe(true)
  })

  /**
   * Empty messages array initialization
   *
   * Given: storeが初期化される
   * When: 初期状態を確認
   * Then: messages配列は空配列
   */
  it('should initialize with empty messages array', () => {
    // Given & When: store初期化
    useBarStore.setState({
      userId: null,
      users: [],
      messages: [],
    })

    // Then: messages配列は空
    expect(useBarStore.getState().messages).toEqual([])
    expect(useBarStore.getState().messages).toHaveLength(0)
  })

  /**
   * AC-8: Immutability - Original messages unchanged
   *
   * Given: 既存のメッセージリスト
   * When: 新しいメッセージを追加
   * Then: 元のメッセージオブジェクトは変更されない
   */
  it('should not mutate original message objects', () => {
    // Given: 既存のメッセージ
    const originalMessage = {
      userId: 'user-1',
      name: 'Alice',
      text: 'Original message',
      timestamp: 100,
    }

    useBarStore.setState({ messages: [originalMessage] })

    // メッセージのコピーを作成（検証用）
    const originalCopy = { ...originalMessage }

    // When: 新しいメッセージ追加
    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-2',
      name: 'Bob',
      text: 'New message',
      timestamp: 200,
    })

    // Then: 元のメッセージオブジェクトは変更されない
    const storedMessages = useBarStore.getState().messages
    expect(storedMessages[0]).toEqual(originalCopy)
    expect(originalMessage).toEqual(originalCopy)
  })

  /**
   * Integration: Message after user joins
   *
   * Given: user_joinedイベントでユーザーが追加される
   * When: そのユーザーからmessageイベント受信
   * Then: メッセージが正しく保持される
   */
  it('should handle message after user joins', () => {
    // Given: user_joinedイベント受信
    useBarStore.getState().handleServerEvent({
      type: 'user_joined',
      userId: 'user-1',
      name: 'Alice',
    })

    // ユーザーが追加されたことを確認
    expect(useBarStore.getState().users).toHaveLength(1)

    // When: そのユーザーからメッセージ受信
    useBarStore.getState().handleServerEvent({
      type: 'message',
      userId: 'user-1',
      name: 'Alice',
      text: 'Hello, everyone!',
      timestamp: Date.now(),
    })

    // Then: メッセージが保持される
    const messages = useBarStore.getState().messages
    expect(messages).toHaveLength(1)
    expect(messages[0].name).toBe('Alice')
    expect(messages[0].text).toBe('Hello, everyone!')
  })
})
