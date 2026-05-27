import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import {
  getCloseSheep,
  getHourlyPresenceChart,
  getProfileStats,
  userRepository,
} from '@/server/di'
import { CloseSheepList } from './_components/close-sheep-list'
import { VisitRecordRail } from './_components/visit-record-rail'
import { ProfileEditor, type ProfileEditorDto } from './profile-editor'

export default async function MyProfilePage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const user = await userRepository.findById(session.userId)
  if (!user) notFound()

  const dto: ProfileEditorDto = {
    id: user.id,
    nickname: user.nickname,
    bio: user.bio,
    tone: user.tone,
    presenceVisibility: user.presenceVisibility,
    currentSigns: user.currentSigns,
    favoriteMoon: user.favoriteMoon,
    joinedAt: user.joinedAt.toISOString(),
  }

  // 3 use case を並列 resolve。
  const [stats, hourly, closeSheep] = await Promise.all([
    getProfileStats({ userId: user.id }),
    getHourlyPresenceChart({ userId: user.id }),
    getCloseSheep({ userId: user.id }),
  ])

  // design HTML (extracted-profile.jsx) は absolute layout で
  // main (left 240 → right 340) + VisitRecordRail 340 の 2 ペイン構造。
  // 実装は flex で main flex-1 + rail 固定 340。
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div
        className="flex-1 min-w-0 overflow-hidden"
        style={{ padding: '40px 56px' }}
      >
        <ProfileEditor
          user={dto}
          closeSheepList={<CloseSheepList sheep={closeSheep} />}
        />
      </div>
      <VisitRecordRail stats={stats} hourly={hourly} />
    </div>
  )
}
