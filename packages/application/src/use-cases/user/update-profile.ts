import {
  createUser,
  NotFoundError,
  ValidationError,
  type PresenceVisibility,
  type SignTag,
  type Tone,
  type User,
  type UserId,
  type UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type UpdateProfilePatch = {
  nickname?: string
  bio?: string
  tone?: Tone
  presenceVisibility?: PresenceVisibility
  currentSigns?: readonly SignTag[]
}

export type UpdateProfileDeps = {
  userRepository: UserRepository
  businessHoursGuard: BusinessHoursGuard
}

export type UpdateProfileInput = {
  userId: UserId
  patch: UpdateProfilePatch
}

export type UpdateProfile = (input: UpdateProfileInput) => Promise<User>

export const createUpdateProfile = (deps: UpdateProfileDeps): UpdateProfile =>
  async (input) => {
    deps.businessHoursGuard.ensureOpen()

    const existing = await deps.userRepository.findById(input.userId)
    if (existing === null) {
      throw new NotFoundError(`user ${input.userId} not found`)
    }

    const nextNickname = input.patch.nickname ?? existing.nickname
    if (nextNickname !== existing.nickname) {
      const taken = await deps.userRepository.findByNickname(nextNickname)
      if (taken !== null && taken.id !== existing.id) {
        throw new ValidationError(`nickname "${nextNickname}" is already taken`)
      }
    }

    // Reconstruct via createUser to re-run all validations (length, tone, etc.).
    const updated = createUser({
      id: existing.id,
      nickname: nextNickname,
      bio: input.patch.bio ?? existing.bio,
      tone: input.patch.tone ?? existing.tone,
      presenceVisibility: input.patch.presenceVisibility ?? existing.presenceVisibility,
      currentSigns: input.patch.currentSigns ?? existing.currentSigns,
      joinedAt: existing.joinedAt,
    })

    await deps.userRepository.save(updated)
    return updated
  }
