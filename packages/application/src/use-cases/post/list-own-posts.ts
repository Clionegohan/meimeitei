import type { Post, PostRepository, UserId } from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ListOwnPostsDeps = {
  postRepository: PostRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ListOwnPostsInput = {
  authorId: UserId
}

export type ListOwnPosts = (input: ListOwnPostsInput) => Promise<readonly Post[]>

// Author's own posts across all nights. Deleted posts are excluded
// (spec C: deletion removes the post from the author's own history too).
export const createListOwnPosts = (deps: ListOwnPostsDeps): ListOwnPosts => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const all = await deps.postRepository.list({ authorId: input.authorId })
  return all.filter((p) => p.deletedAt === null)
}
