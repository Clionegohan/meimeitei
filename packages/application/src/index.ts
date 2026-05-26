export type { Clock } from './ports/clock'
export { systemClock } from './ports/clock'
export type { BusinessHoursGuard } from './ports/business-hours-guard'
export { createBusinessHoursGuard } from './ports/business-hours-guard'
export type { IdGenerator } from './ports/id-generator'
export { systemIdGenerator } from './ports/id-generator'

// Use cases — User
export type {
  RegisterUser,
  RegisterUserInput,
  RegisterUserDeps,
} from './use-cases/user/register-user'
export { createRegisterUser } from './use-cases/user/register-user'
export type {
  UpdateProfile,
  UpdateProfileInput,
  UpdateProfilePatch,
  UpdateProfileDeps,
} from './use-cases/user/update-profile'
export { createUpdateProfile } from './use-cases/user/update-profile'
