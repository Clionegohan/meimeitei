import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// Auth.js v5 setup for me-me-en.
// - Google OAuth provider (MVP)
// - JWT session (no DB session table required for in-memory phase)
// - Env: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET (see .env.local.example)
//
// User entity creation (ご記帳) is NOT handled here — it's a separate use case
// (registerUser) wired in apps/web/src/server/di. NextAuth's `User` is just the
// OAuth identity. The mapping to our me-me-en User is done by the onboarding flow.
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
})
