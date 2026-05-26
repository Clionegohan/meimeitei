import NextAuth from 'next-auth'
import type { UserId } from '@me-me-en/domain'
import { authConfig } from './auth.config'
import { findUserIdByEmail } from './server/auth/session-bridge'

// Auth.js v5 for me-me-en — Node Runtime 用。
// edge-safe な authConfig を spread し、Prisma DI を呼ぶ callbacks を追加する。
// middleware からは ./auth.edge を使い、本ファイルは route handlers と server
// component / server action だけが import する。
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token }) {
      if (typeof token.email === 'string') {
        const userId = await findUserIdByEmail(token.email)
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
