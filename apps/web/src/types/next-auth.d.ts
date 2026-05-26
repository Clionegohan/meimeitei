// Augment NextAuth's Session / JWT to carry the me-me-en User.id and the
// Google account's providerId (= account.providerAccountId = ID Token sub).
import type { UserId } from '@me-me-en/domain'

declare module 'next-auth' {
  interface Session {
    userId?: UserId
    providerId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: UserId
    providerId?: string
  }
}
