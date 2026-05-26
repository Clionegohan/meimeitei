import type { AuthIdentity, UserId } from '@me-me-en/domain'
import { authIdentityRepository } from '@/server/di'

// AuthIdentityRepository への薄いラッパー。
//   - findUserIdByProviderId: 毎リクエストの jwt callback から呼ぶ
//   - bindIdentity: onboarding 完了時に provider 情報を確定させる
//   - findUserIdByEmail: legacy 互換のため残置 (β-5-d 以降では providerId 経由)

export const findUserIdByProviderId = async (
  provider: AuthIdentity['provider'],
  providerId: string,
): Promise<UserId | null> => {
  const identity = await authIdentityRepository.findByProviderId(provider, providerId)
  return identity === null ? null : identity.userId
}

export const findUserIdByEmail = async (email: string): Promise<UserId | null> => {
  const identity = await authIdentityRepository.findByEmail(email)
  return identity === null ? null : identity.userId
}

export const bindIdentity = async (
  provider: AuthIdentity['provider'],
  providerId: string,
  email: string | null,
  userId: UserId,
): Promise<void> => {
  await authIdentityRepository.upsert({
    provider,
    providerId,
    email,
    userId,
  })
}
