import type { AuthIdentity } from './auth-identity'

// AuthIdentityRepository — provider × providerId / email から UserId を引く port。
//
// MVPα 段階では (auth.ts → session-bridge.ts) が in-memory Map で動いていた。
// β-5-c で本 port を介して in-memory / prisma を切替える。
//
// findByEmail は MVP の Google sign-in のみで使い、将来の providerId を主軸とする
// API に置き換わる予定。互換性のため当面残す。
export interface AuthIdentityRepository {
  findByProviderId(
    provider: AuthIdentity['provider'],
    providerId: string,
  ): Promise<AuthIdentity | null>
  findByEmail(email: string): Promise<AuthIdentity | null>
  upsert(identity: AuthIdentity): Promise<void>
}
