import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { UserId } from '@me-me-en/domain'
import { findUserIdByEmail } from './server/auth/session-bridge'

// Auth.js v5 for me-me-en.
// - Google OAuth provider (MVP only)
// - JWT session (no DB session table needed for in-memory phase)
// - jwt/session callbacks resolve the me-me-en User.id by looking up
//   the bridge keyed on the Google account email (in-memory; production
//   would carry an auth_provider/auth_id pair on the User entity).
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) {
      if (typeof token.email === 'string') {
        const userId = findUserIdByEmail(token.email)
        if (userId !== null) token.userId = userId
      }
      return token
    },
    async session({ session, token }) {
      // The augmented JWT type carries `userId?: UserId`, but next-auth's
      // generic JWT signature loosens it to {} | null. Cast back here.
      const userId = (token as { userId?: UserId }).userId
      if (userId !== undefined) {
        session.userId = userId
      }
      return session
    },
  },
})
