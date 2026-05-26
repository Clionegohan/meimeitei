import { describe, expect, it } from 'vitest'
import type { UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaAuthIdentityRepository } from '../auth-identity-repository'

const aliceUserId = 'u_alice' as UserId

describe('PrismaAuthIdentityRepository (integration)', () => {
  it('upsert + findByProviderId', async () => {
    const repo = createPrismaAuthIdentityRepository(prisma)
    await repo.upsert({
      provider: 'google',
      providerId: 'google-sub-001',
      email: 'alice@example.com',
      userId: aliceUserId,
    })
    const found = await repo.findByProviderId('google', 'google-sub-001')
    expect(found?.userId).toBe(aliceUserId)
    expect(found?.email).toBe('alice@example.com')
  })

  it('findByEmail returns null when no identity has that email', async () => {
    const repo = createPrismaAuthIdentityRepository(prisma)
    expect(await repo.findByEmail('nobody@example.com')).toBeNull()
  })

  it('upsert updates an existing identity (email change)', async () => {
    const repo = createPrismaAuthIdentityRepository(prisma)
    await repo.upsert({
      provider: 'google',
      providerId: 'google-sub-002',
      email: 'old@example.com',
      userId: aliceUserId,
    })
    await repo.upsert({
      provider: 'google',
      providerId: 'google-sub-002',
      email: 'new@example.com',
      userId: aliceUserId,
    })
    const found = await repo.findByProviderId('google', 'google-sub-002')
    expect(found?.email).toBe('new@example.com')
  })

  it('findByEmail returns identity when email matches', async () => {
    const repo = createPrismaAuthIdentityRepository(prisma)
    await repo.upsert({
      provider: 'google',
      providerId: 'google-sub-003',
      email: 'alice@example.com',
      userId: aliceUserId,
    })
    const found = await repo.findByEmail('alice@example.com')
    expect(found?.userId).toBe(aliceUserId)
    expect(found?.providerId).toBe('google-sub-003')
  })
})
