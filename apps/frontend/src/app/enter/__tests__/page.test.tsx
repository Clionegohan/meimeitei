import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnterPage from '../page'

// useRouterのモック
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('F002: User Entrance - Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear()
    mockPush.mockClear()
  })

  // AC-1: 空の名前でエラー表示
  it('should show error when name is empty', async () => {
    render(<EnterPage />)

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('名前を入力してください')).toBeInTheDocument()
    })
  })

  // AC-1の変種: スペースのみでエラー表示
  it('should show error when name is only whitespace', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('名前を入力してください')).toBeInTheDocument()
    })
  })

  // AC-3: 21文字以上でエラー表示
  it('should show error when name exceeds 20 characters', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    const longName = 'A'.repeat(21)
    fireEvent.change(input, { target: { value: longName } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('名前は20文字以内で入力してください')
      ).toBeInTheDocument()
    })
  })

  // AC-2: 有効な名前でlocalStorage保存とリダイレクト
  it('should save to localStorage and redirect on valid name', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Alice' } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.getItem('meimei_username')).toBe('Alice')
      expect(mockPush).toHaveBeenCalledWith('/bar')
    })
  })

  // AC-4: 前後の空白文字の自動トリミング
  it('should trim leading and trailing whitespace', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '  Bob  ' } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.getItem('meimei_username')).toBe('Bob')
      expect(mockPush).toHaveBeenCalledWith('/bar')
    })
  })

  // 境界値テスト: ちょうど20文字
  it('should accept exactly 20 characters', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    const exactName = 'A'.repeat(20)
    fireEvent.change(input, { target: { value: exactName } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.getItem('meimei_username')).toBe(exactName)
      expect(mockPush).toHaveBeenCalledWith('/bar')
    })
  })

  // UIテスト: エラー後に入力するとエラーがクリアされる
  it('should clear error when user starts typing', async () => {
    render(<EnterPage />)

    // 最初は空で送信してエラー
    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('名前を入力してください')).toBeInTheDocument()
    })

    // 入力を開始
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Charlie' } })

    // エラーメッセージが消える
    await waitFor(() => {
      expect(screen.queryByText('名前を入力してください')).not.toBeInTheDocument()
    })
  })

  // エッジケース: 特殊文字を含む名前
  it('should accept names with special characters', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@#$%' } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.getItem('meimei_username')).toBe('@#$%')
      expect(mockPush).toHaveBeenCalledWith('/bar')
    })
  })

  // エッジケース: 絵文字を含む名前
  it('should accept names with emoji', async () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '😀Alice😁' } })

    const submitButton = screen.getByRole('button', { name: /入店/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.getItem('meimei_username')).toBe('😀Alice😁')
      expect(mockPush).toHaveBeenCalledWith('/bar')
    })
  })

  // UIテスト: フォーム要素が正しくレンダリングされる
  it('should render form elements correctly', () => {
    render(<EnterPage />)

    expect(screen.getByRole('heading', { name: /めぃめぃ亭/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/お名前/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /入店/i })).toBeInTheDocument()
  })

  // UIテスト: input要素が正しく動作する
  it('should allow typing in the input field', () => {
    render(<EnterPage />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Test' } })
    expect(input.value).toBe('Test')
  })
})
