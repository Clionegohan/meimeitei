import type { AuthIdentity, AuthIdentityRepository, UserId } from '@me-me-en/domain'
import type { PrismaClient } from './client'

type Row = {
  provider: string
  providerId: string
  email: string | null
  userId: string
}

const toIdentity = (row: Row): AuthIdentity => ({
  provider: row.provider as AuthIdentity['provider'],
  providerId: row.providerId,
  email: row.email,
  userId: row.userId as UserId,
})

export const createPrismaAuthIdentityRepository = (
  prisma: PrismaClient,
): AuthIdentityRepository => ({
  findByProviderId: async (provider, providerId) => {
    const row = await prisma.userAuthIdentity.findUnique({
      where: { provider_providerId: { provider, providerId } },
    })
    return row === null ? null : toIdentity(row)
  },
  findByEmail: async (email) => {
    // email は unique 制約なし (provider 跨ぎで重複可)。最初の 1 件を返す。
    const row = await prisma.userAuthIdentity.findFirst({ where: { email } })
    return row === null ? null : toIdentity(row)
  },
  upsert: async (identity) => {
    await prisma.userAuthIdentity.upsert({
      where: {
        provider_providerId: {
          provider: identity.provider,
          providerId: identity.providerId,
        },
      },
      update: {
        email: identity.email,
        userId: identity.userId,
      },
      create: {
        provider: identity.provider,
        providerId: identity.providerId,
        email: identity.email,
        userId: identity.userId,
      },
    })
  },
  deleteByUser: async (userId) => {
    await prisma.userAuthIdentity.deleteMany({ where: { userId } })
  },
})
