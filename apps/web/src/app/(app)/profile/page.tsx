import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import {
  getCloseSheep,
  getHourlyPresenceChart,
  getProfileStats,
  userRepository,
} from '@/server/di'
import { CloseSheepList } from './_components/close-sheep-list'
import { HourlyPresenceChart } from './_components/hourly-presence-chart'
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
    joinedAt: user.joinedAt.toISOString(),
  }

  // β-2: β-1 で作った use case を resolve して placeholder を実値化。
  // 3 つは並行に呼べる（互いに独立）。
  const [stats, hourly, closeSheep] = await Promise.all([
    getProfileStats({ userId: user.id }),
    getHourlyPresenceChart({ userId: user.id }),
    getCloseSheep({ userId: user.id }),
  ])

  return (
    <div className="p-10 max-w-3xl">
      <h2 className="text-2xl tracking-[0.2em] font-light mb-2">あなたの席</h2>
      <p className="text-[11px] text-[#5E5A4F] tracking-[0.25em] mb-10">
        お席のしつらえと、ご自身のお話。
      </p>

      <ProfileEditor user={dto} />

      <section className="mt-16 pt-10 border-t border-[#1F2533]">
        <p className="text-xs text-[#5E5A4F] tracking-[0.35em] mb-6">来 店 帳</p>
        <dl className="grid grid-cols-2 gap-x-10 gap-y-4">
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">置いた文</dt>
            <dd className="text-xl text-[#ECE6D4] tabular-nums">
              {stats.postCount}
              <span className="text-[10px] text-[#5E5A4F] ml-1 tracking-widest">通</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">寄せられた燭</dt>
            <dd className="text-xl text-[#ECE6D4] tabular-nums">
              {stats.candleReceivedCount}
              <span className="text-[10px] text-[#5E5A4F] ml-1 tracking-widest">本</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">入店した夜</dt>
            <dd className="text-xl text-[#ECE6D4] tabular-nums">
              {stats.totalLoginNights}
              <span className="text-[10px] text-[#5E5A4F] ml-1 tracking-widest">夜</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">連続来店</dt>
            <dd className="text-xl text-[#ECE6D4] tabular-nums">
              {stats.consecutiveLoginNights}
              <span className="text-[10px] text-[#5E5A4F] ml-1 tracking-widest">夜</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-12">
        <p className="text-xs text-[#5E5A4F] tracking-[0.35em] mb-6">在 席 の 刻</p>
        <HourlyPresenceChart buckets={hourly} />
      </section>

      <section className="mt-12">
        <p className="text-xs text-[#5E5A4F] tracking-[0.35em] mb-6">親 し い 羊</p>
        <CloseSheepList sheep={closeSheep} />
      </section>
    </div>
  )
}
