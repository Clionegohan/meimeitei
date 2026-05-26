import {
  visibleStatusTo,
  type BlockRepository,
  type Presence,
  type PresenceRepository,
  type UserId,
  type UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ListOnlineUsersDeps = {
  userRepository: UserRepository
  presenceRepository: PresenceRepository
  blockRepository: BlockRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ListOnlineUsersInput = {
  viewerId: UserId
}

export type ListOnlineUsers = (input: ListOnlineUsersInput) => Promise<readonly Presence[]>

// Returns presences of users who are online AND visible to the viewer:
//   - user.presenceVisibility = 'visible' (else asymmetric stealth hides them)
//   - no block relationship between viewer and the user
export const createListOnlineUsers = (deps: ListOnlineUsersDeps): ListOnlineUsers => async (
  input,
) => {
  deps.businessHoursGuard.ensureOpen()
  const onlines = await deps.presenceRepository.listOnline()

  const visible: Presence[] = []
  for (const presence of onlines) {
    if (presence.userId === input.viewerId) {
      visible.push(presence)
      continue
    }
    const user = await deps.userRepository.findById(presence.userId)
    if (user === null) continue
    const status = visibleStatusTo(presence, {
      ownerVisibility: user.presenceVisibility,
      viewerIsOwner: false,
    })
    if (status !== 'online') continue
    const blocked = await deps.blockRepository.existsBetween(input.viewerId, presence.userId)
    if (blocked) continue
    visible.push(presence)
  }
  return visible
}
