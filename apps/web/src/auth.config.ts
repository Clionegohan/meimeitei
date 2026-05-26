import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

// edge-safe な Auth.js config。middleware (Edge Runtime) から import される。
// callbacks は含めない (DI 経由で Prisma を呼ぶ可能性があるため Node 用 auth.ts に置く)。
export const authConfig: NextAuthConfig = {
  providers: [Google],
  session: { strategy: 'jwt' },
}
