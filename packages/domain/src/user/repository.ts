import type { UserId } from '../shared/id'
import type { User } from './user'

// UserRepository は domain layer の port。具象は infrastructure 側で実装する。
export interface UserRepository {
  findById(id: UserId): Promise<User | null>
  findByNickname(nickname: string): Promise<User | null>
  save(user: User): Promise<void>
  list(): Promise<readonly User[]>
}
