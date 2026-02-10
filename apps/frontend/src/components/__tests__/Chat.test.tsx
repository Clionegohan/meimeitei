import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Chat from '../Chat'
import { useBarStore } from '@/stores/useBarStore'
import * as wsClient from '@/ws/client'

/**
 * F004: Chat Component Unit Tests
 *
 * Tests coverage:
 * - AC-1: メッセージリスト表示、フォームクリア
 * - AC-3, AC-4: 空メッセージ送信ブロック
 *
 * Note: このテストはReact Componentの単体テストであり、
 * WebSocket接続やサーバーとの実際の通信はモックする。
 */

// sendEvent関数をモック
vi.mock('@/ws/client', () => ({
  sendEvent: vi.fn(),
}))

describe('F004: Chat Component Unit Tests', () => {
  beforeEach(() => {
    // 各テスト前にstoreをリセット
    useBarStore.setState({
      userId: null,
      users: [],
      messages: [],
    })

    // モック関数をクリア
    vi.clearAllMocks()
  })

  /**
   * AC-1: メッセージリスト表示
   */
  describe('Message List Display', () => {
    it('should render message list with sender name and text', () => {
      // Given: storeに複数のメッセージが存在
      useBarStore.setState({
        messages: [
          {
            userId: 'user-1',
            name: 'Alice',
            text: 'Hello, World!',
            timestamp: Date.now(),
          },
          {
            userId: 'user-2',
            name: 'Bob',
            text: 'Hi, Alice!',
            timestamp: Date.now(),
          },
        ],
      })

      // When: Chatコンポーネントをレンダリング
      render(<Chat />)

      // Then: メッセージが表示される
      // 送信者名（青色）
      expect(screen.getByText('Alice:')).toBeInTheDocument()
      expect(screen.getByText('Bob:')).toBeInTheDocument()

      // メッセージ本文（灰色）
      expect(screen.getByText('Hello, World!')).toBeInTheDocument()
      expect(screen.getByText('Hi, Alice!')).toBeInTheDocument()
    })

    it('should render empty message list when no messages', () => {
      // Given: storeが空
      useBarStore.setState({ messages: [] })

      // When: Chatコンポーネントをレンダリング
      const { container } = render(<Chat />)

      // Then: メッセージリストは空（エラーなし）
      const messageList = container.querySelector('.flex-1.overflow-y-auto')
      expect(messageList?.childNodes.length).toBe(0)
    })

    it('should display messages in order', () => {
      // Given: storeに時系列順のメッセージ
      useBarStore.setState({
        messages: [
          { userId: 'user-1', name: 'Alice', text: 'First', timestamp: 100 },
          { userId: 'user-1', name: 'Alice', text: 'Second', timestamp: 200 },
          { userId: 'user-1', name: 'Alice', text: 'Third', timestamp: 300 },
        ],
      })

      // When: Chatコンポーネントをレンダリング
      render(<Chat />)

      // Then: メッセージが順番に表示される
      const messages = screen.getAllByText(/First|Second|Third/)
      expect(messages[0]).toHaveTextContent('First')
      expect(messages[1]).toHaveTextContent('Second')
      expect(messages[2]).toHaveTextContent('Third')
    })
  })

  /**
   * AC-1: 入力フォームレンダリング
   */
  describe('Input Form Rendering', () => {
    it('should render input form with placeholder and maxLength', () => {
      // When: Chatコンポーネントをレンダリング
      render(<Chat />)

      // Then: 入力フォームが表示される
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')
      expect(input).toBeInTheDocument()

      // maxLength属性が設定されている
      expect(input).toHaveAttribute('maxLength', '500')
    })

    it('should have form submit handler', () => {
      // When: Chatコンポーネントをレンダリング
      const { container } = render(<Chat />)

      // Then: フォームが存在する
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })
  })

  /**
   * AC-1: 送信後のフォームクリア
   */
  describe('Form Clear After Submission', () => {
    it('should clear input field after sending message', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: メッセージを入力して送信
      fireEvent.change(input, { target: { value: 'Test message' } })
      expect(input).toHaveValue('Test message')

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: 入力フィールドがクリアされる
      expect(input).toHaveValue('')
    })

    it('should call sendEvent with trimmed text', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: メッセージを入力して送信
      fireEvent.change(input, { target: { value: '  Test message  ' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: sendEventがトリミング済みテキストで呼ばれる
      expect(wsClient.sendEvent).toHaveBeenCalledWith({
        type: 'send_message',
        text: 'Test message',
      })
    })
  })

  /**
   * AC-3, AC-4: 空メッセージ送信ブロック
   */
  describe('Empty Message Submission Block', () => {
    it('should not submit empty message', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 空文字列を送信しようとする
      fireEvent.change(input, { target: { value: '' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: sendEventが呼ばれない
      expect(wsClient.sendEvent).not.toHaveBeenCalled()
    })

    it('should not submit whitespace-only message', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 空白のみのメッセージを送信しようとする
      fireEvent.change(input, { target: { value: '   ' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: sendEventが呼ばれない
      expect(wsClient.sendEvent).not.toHaveBeenCalled()
    })

    it('should not submit message exceeding 500 characters', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 501文字以上のメッセージを送信しようとする
      // （実際にはHTML maxLengthで500文字にカットされるが、ロジック上のチェック）
      const longText = 'A'.repeat(501)
      fireEvent.change(input, { target: { value: longText } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: sendEventが呼ばれない
      expect(wsClient.sendEvent).not.toHaveBeenCalled()
    })

    it('should submit message with exactly 500 characters', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 500文字ちょうどのメッセージを送信
      const text500 = 'A'.repeat(500)
      fireEvent.change(input, { target: { value: text500 } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: sendEventが呼ばれる
      expect(wsClient.sendEvent).toHaveBeenCalledWith({
        type: 'send_message',
        text: text500,
      })
    })

    it('should not clear input field when submission is blocked', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 空白のみのメッセージを送信しようとする
      fireEvent.change(input, { target: { value: '   ' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: 入力フィールドはクリアされない（送信されていないため）
      // 実装では、送信が成功した場合のみクリアされる
      expect(input).toHaveValue('   ')
    })
  })

  /**
   * AC-4: トリミング動作
   */
  describe('Trimming Behavior', () => {
    it('should trim leading whitespace', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 前にスペースを含むメッセージを送信
      fireEvent.change(input, { target: { value: '   hello' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: トリミング済みテキストで送信される
      expect(wsClient.sendEvent).toHaveBeenCalledWith({
        type: 'send_message',
        text: 'hello',
      })
    })

    it('should trim trailing whitespace', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 後ろにスペースを含むメッセージを送信
      fireEvent.change(input, { target: { value: 'hello   ' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: トリミング済みテキストで送信される
      expect(wsClient.sendEvent).toHaveBeenCalledWith({
        type: 'send_message',
        text: 'hello',
      })
    })

    it('should trim both leading and trailing whitespace', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 前後にスペースを含むメッセージを送信
      fireEvent.change(input, { target: { value: '   hello world   ' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: トリミング済みテキストで送信される
      expect(wsClient.sendEvent).toHaveBeenCalledWith({
        type: 'send_message',
        text: 'hello world',
      })
    })

    it('should preserve internal whitespace', () => {
      // Given: Chatコンポーネントをレンダリング
      render(<Chat />)
      const input = screen.getByPlaceholderText('メッセージを入力 (最大500文字)')

      // When: 内部にスペースを含むメッセージを送信
      fireEvent.change(input, { target: { value: 'hello   world' } })

      const form = screen.getByPlaceholderText('メッセージを入力 (最大500文字)').closest('form')!
      fireEvent.submit(form)

      // Then: 内部のスペースは保持される
      expect(wsClient.sendEvent).toHaveBeenCalledWith({
        type: 'send_message',
        text: 'hello   world',
      })
    })
  })
})
