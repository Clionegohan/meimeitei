import {
  currentNightId,
  type BlockRepository,
  type NightId,
  type Post,
  type PostRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type ListTimelineDeps = {
  postRepository: PostRepository
  blockRepository: BlockRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type ListTimelineInput = {
  viewerId: UserId
  nightId?: NightId
}

export type ListTimeline = (input: ListTimelineInput) => Promise<readonly Post[]>

export const createListTimeline = (deps: ListTimelineDeps): ListTimeline => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  // guard already verified open; currentNightId is therefore non-null.
  const nightId = input.nightId ?? currentNightId(deps.clock.now())
  if (nightId === null) {
    // defensive: should be unreachable after ensureOpen
    return []
  }

  const all = await deps.postRepository.list({ nightId })

  const filtered: Post[] = []
  for (const post of all) {
    if (post.deletedAt !== null) continue
    const blocked = await deps.blockRepository.existsBetween(input.viewerId, post.authorId)
    if (blocked) continue
    filtered.push(post)
  }
  return filtered
}
