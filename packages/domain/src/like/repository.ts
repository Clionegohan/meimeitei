import type { LikeId, PostId, UserId } from '../shared/id'
import type { Like } from './like'

// LikeRepository は domain layer の port。
// 「カウント他者非公開」仕様は port の存在/不在ではなく、use case 側で:
//   - countByPost(postId) は post 所有者本人にのみ公開
//   - countReceivedByUser(userId) は user 本人にのみ公開（来店帳「寄せられた燭」）
// として制御する。
export interface LikeRepository {
  findById(id: LikeId): Promise<Like | null>
  findByPostAndUser(postId: PostId, userId: UserId): Promise<Like | null>
  save(like: Like): Promise<void>
  delete(id: LikeId): Promise<void>
  countByPost(postId: PostId): Promise<number>
  countReceivedByUser(userId: UserId): Promise<number>
}
