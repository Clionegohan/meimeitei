import type { UserId } from '@me-me-en/domain'

// Process-scoped bridge between Google account (email) and me-me-en User.id.
// This is in-memory only. The production Prisma adapter will carry the
// auth provider + auth id on the User entity directly (e.g. User.authProvider /
// User.authSub) and replace findUserIdByEmail with a UserRepository method.
const emailToUserId = new Map<string, UserId>()

export const findUserIdByEmail = (email: string): UserId | null =>
  emailToUserId.get(email) ?? null

export const bindEmailToUser = (email: string, userId: UserId): void => {
  emailToUserId.set(email, userId)
}
