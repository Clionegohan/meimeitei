import {
  createUser,
  ValidationError,
  type User,
  type UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type RegisterUserDeps = {
  userRepository: UserRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type RegisterUserInput = {
  nickname: string
}

export type RegisterUser = (input: RegisterUserInput) => Promise<User>

export const createRegisterUser = (deps: RegisterUserDeps): RegisterUser =>
  async (input) => {
    deps.businessHoursGuard.ensureOpen()

    const existing = await deps.userRepository.findByNickname(input.nickname)
    if (existing !== null) {
      throw new ValidationError(`nickname "${input.nickname}" is already taken`)
    }

    const user = createUser({
      id: deps.idGenerator.user(),
      nickname: input.nickname,
      joinedAt: deps.clock.now(),
    })

    await deps.userRepository.save(user)
    return user
  }
