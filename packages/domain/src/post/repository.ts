import type { PostId, UserId } from '../shared/id'
import type { NightId } from '../shared/time'
import type { Post } from './post'

export type ListPostsQuery = {
  // 特定の夜の post を author 横断で取得（タイムライン公開フィード）。
  nightId?: NightId
  // 特定 author の post を全期間で取得（自分の過去 post 閲覧）。
  authorId?: UserId
  // cursor-based pagination: fetch posts strictly before this postedAt.
  before?: Date
  limit?: number
}

// PostRepository は domain layer の port。
// `list` の並び順は implementer の契約: descending by postedAt（新しい順、spec C 行）。
// `nightId` と `authorId` の両方を指定した場合は両方の and 条件で絞る。
// どちらも未指定の場合の挙動は implementer の判断（推奨: 例外を投げる）。
export interface PostRepository {
  findById(id: PostId): Promise<Post | null>
  save(post: Post): Promise<void>
  list(query: ListPostsQuery): Promise<readonly Post[]>
}
