import NextAuth from 'next-auth'
import type { UserId } from '@me-me-en/domain'
import { authConfig } from './auth.config'
import { findUserIdByProviderId } from './server/auth/session-bridge'

// Auth.js v5 for me-me-en — Node Runtime 用。
// edge-safe な authConfig を spread し、Prisma DI を呼ぶ callbacks を追加する。
// middleware からは ./auth.edge を使い、本ファイルは route handlers と server
// component / server action だけが import する。
//
// providerId (Google sub) を JWT に乗せ、毎リクエストで AuthIdentity から
// userId を解決する。email は補助情報、login の uniqueness は providerId が担う。
const PROVIDER = 'google' as const

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, account }) {
      // initial sign-in 時のみ account が provider/providerAccountId を持つ。
      // ここで token に providerId を焼き付ける（以降のリクエストでも保持）。
      if (
        account !== null &&
        account !== undefined &&
        typeof account.providerAccountId === 'string'
      ) {
        token.providerId = account.providerAccountId
      }
      // 毎リクエスト: providerId → userId resolve（onboarding 済なら見つかる）
      const providerId = (token as { providerId?: string }).providerId
      if (typeof providerId === 'string' && providerId.length > 0) {
        const userId = await findUserIdByProviderId(PROVIDER, providerId)
        if (userId !== null) token.userId = userId
      }
      return token
    },
    async session({ session, token }) {
      // The augmented JWT type carries `userId?: UserId` / `providerId?: string`,
      // but next-auth's generic JWT signature loosens it to {} | null. Cast back.
      const userId = (token as { userId?: UserId }).userId
      const providerId = (token as { providerId?: string }).providerId
      if (userId !== undefined) session.userId = userId
      if (providerId !== undefined) session.providerId = providerId
      return session
    },
  },
})
