import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { presenceRepository, userRepository } from '@/server/di'
import { visibleStatusTo, type UserId } from '@me-me-en/domain'
import { OtherProfile, type OtherUserDto } from './other-profile'

export default async function OtherProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await auth()
  if (session === null || session.userId === undefined) return null
  const { userId: rawId } = await params
  const targetUserId = rawId as UserId

  // Visiting your own profile via /profile/<self> -> redirect to /profile
  if (targetUserId === session.userId) redirect('/profile')

  const user = await userRepository.findById(targetUserId)
  if (!user) notFound()

  // Presence: asymmetric stealth — invisible owners look offline.
  const presence = await presenceRepository.findByUser(user.id)
  const visibleStatus = presence
    ? visibleStatusTo(presence, {
        ownerVisibility: user.presenceVisibility,
        viewerIsOwner: false,
      })
    : 'offline'

  const dto: OtherUserDto = {
    id: user.id,
    nickname: user.nickname,
    bio: user.bio,
    tone: user.tone,
    currentSigns: user.currentSigns,
    presenceVisible: visibleStatus === 'online',
  }

  return (
    <div className="p-10 max-w-3xl">
      <h2 className="text-2xl tracking-[0.2em] font-light mb-2">
        {user.nickname} さんの席
      </h2>
      <p className="text-[11px] text-[#5E5A4F] tracking-[0.25em] mb-10">
        御覧いただけるのは、基本のしつらえまで。
      </p>

      <OtherProfile user={dto} />
    </div>
  )
}
