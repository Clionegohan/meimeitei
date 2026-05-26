import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// middleware (Edge Runtime) 専用の薄い NextAuth instance。
// callbacks を含まないので Prisma などの Node 専用 module を edge bundle に
// 引きずらない。session.userId は middleware では undefined のまま運用し、
// 「認証済 / 未認証」の判定のみに使う。
export const { auth } = NextAuth(authConfig)
