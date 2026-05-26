import type {
  AuthIdentity,
  AuthIdentityRepository,
} from '@me-me-en/domain'

// In-memory AuthIdentityRepository.
// MVPα 互換: 既存の session-bridge.ts と同じ Map<email, UserId> + Map<(provider:providerId), AuthIdentity>。
// process 再起動でデータ消失する点も同じ。
export const createInMemoryAuthIdentityRepository = (): AuthIdentityRepository => {
  const byProviderKey = new Map<string, AuthIdentity>()
  const byEmail = new Map<string, AuthIdentity>()

  const providerKey = (provider: AuthIdentity['provider'], providerId: string): string =>
    `${provider}:${providerId}`

  return {
    findByProviderId: async (provider, providerId) =>
      byProviderKey.get(providerKey(provider, providerId)) ?? null,
    findByEmail: async (email) => byEmail.get(email) ?? null,
    upsert: async (identity) => {
      byProviderKey.set(providerKey(identity.provider, identity.providerId), identity)
      if (identity.email !== null) byEmail.set(identity.email, identity)
    },
  }
}
