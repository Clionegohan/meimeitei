import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { blockRepository, presenceRepository, userRepository } from '@/server/di'
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

  const isBlocked = await blockRepository.findBy(session.userId, targetUserId)

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
    favoriteMoon: user.favoriteMoon,
    joinedAt: user.joinedAt.toISOString(),
    presenceVisible: visibleStatus === 'online',
  }

  // 公開範囲 (spec 51): 他者からは avatar / nickname / bio / しるし / 好きな月 /
  // 入店初日 まで。来店帳 N / 在席チャート O / 親しい羊 M は本人のみ — ここでは
  // そもそも取得も DTO 化もしない (BE レベルで秘匿)。
  return (
    <div className="px-4 py-6 md:px-14 md:py-10 max-w-3xl">
      <OtherProfile user={dto} isBlocked={isBlocked !== null} />
    </div>
  )
}
