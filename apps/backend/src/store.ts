import type { WebSocket } from 'ws'

export interface User {
  id: string
  name: string
  seated: boolean
  ws: WebSocket
}

class Store {
  private users = new Map<string, User>()

  addUser(user: User): void {
    this.users.set(user.id, user)
  }

  removeUser(userId: string): void {
    this.users.delete(userId)
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values())
  }

  updateSeated(userId: string, seated: boolean): void {
    const user = this.users.get(userId)
    if (user) {
      user.seated = seated
    }
  }

  clear(): void {
    this.users.clear()
  }
}

export const store = new Store()
