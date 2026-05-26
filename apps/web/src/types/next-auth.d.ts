// Augment NextAuth's Session / JWT to carry the me-me-en User.id.
import type { UserId } from '@me-me-en/domain'

declare module 'next-auth' {
  interface Session {
    userId?: UserId
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: UserId
  }
}
