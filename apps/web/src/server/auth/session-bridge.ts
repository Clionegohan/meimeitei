import type { UserId } from '@me-me-en/domain'
import { authIdentityRepository } from '@/server/di'

// Bridge between Google account (email) and me-me-en User.id.
// β-5-c から AuthIdentityRepository 経由。DATA_STORE=memory なら従来の
// in-memory Map、DATA_STORE=prisma なら user_auth_identities テーブル。
//
// 注: providerId に email を入れているのは MVP の暫定。本来は Google の `sub`
// を使うべきで、β-5-d で auth.ts callback から `token.sub` を渡す改修を行う。
// それまでは email を identity key として運用する。
const PROVIDER = 'google' as const

export const findUserIdByEmail = async (email: string): Promise<UserId | null> => {
  const identity = await authIdentityRepository.findByEmail(email)
  return identity === null ? null : identity.userId
}

export const bindEmailToUser = async (email: string, userId: UserId): Promise<void> => {
  await authIdentityRepository.upsert({
    provider: PROVIDER,
    providerId: email,
    email,
    userId,
  })
}
