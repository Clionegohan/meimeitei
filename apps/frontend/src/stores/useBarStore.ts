import { create } from 'zustand'
import type { ServerEvent } from '@meimei-tei/shared'

interface User {
  id: string
  name: string
  seated: boolean
}

interface Message {
  userId: string
  name: string
  text: string
  timestamp: number
}

interface BarState {
  userId: string | null
  users: User[]
  messages: Message[]
  setUserId: (userId: string) => void
  handleServerEvent: (event: ServerEvent) => void
}

export const useBarStore = create<BarState>((set) => ({
  userId: null,
  users: [],
  messages: [],

  setUserId: (userId) => set({ userId }),

  handleServerEvent: (event) => {
    switch (event.type) {
      case 'welcome':
        set({ userId: event.userId })
        break

      case 'state_sync':
        set({ users: event.users })
        break

      case 'user_joined':
        set((state) => ({
          users: [...state.users, { id: event.userId, name: event.name, seated: false }],
        }))
        break

      case 'user_left':
        set((state) => ({
          users: state.users.filter((u) => u.id !== event.userId),
        }))
        break

      case 'seat_changed':
        set((state) => ({
          users: state.users.map((u) =>
            u.id === event.userId ? { ...u, seated: event.seated } : u
          ),
        }))
        break

      case 'message':
        set((state) => ({
          messages: [
            ...state.messages,
            {
              userId: event.userId,
              name: event.name,
              text: event.text,
              timestamp: event.timestamp,
            },
          ],
        }))
        break

      case 'authenticated':
        // Why: セッション確立確認（将来的にUI通知に使用可能）
        // 現状はログ出力のみ、userIdはすでにlocalStorageから取得済み
        break

      case 'history_sync':
        // Why: ブラウザリロード後にチャット履歴を復元
        // サーバーから送信されたメッセージ履歴で上書き
        set({ messages: event.messages })
        break
    }
  },
}))
