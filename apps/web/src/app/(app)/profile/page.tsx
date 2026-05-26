import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { likeRepository, postRepository, userRepository } from '@/server/di'
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

  // Owner-only statistics. Two are computed directly from repositories.
  // Login-night history and presence-hour distribution require event logs
  // we don't track yet; rendered as placeholders for MVPα.
  const ownPosts = await postRepository.list({ authorId: user.id })
  const postCount = ownPosts.filter((p) => p.deletedAt === null).length
  const candleCount = await likeRepository.countReceivedByUser(user.id)

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
              {postCount}
              <span className="text-[10px] text-[#5E5A4F] ml-1 tracking-widest">通</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">寄せられた燭</dt>
            <dd className="text-xl text-[#ECE6D4] tabular-nums">
              {candleCount}
              <span className="text-[10px] text-[#5E5A4F] ml-1 tracking-widest">本</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">入店した夜</dt>
            <dd className="text-xs text-[#5E5A4F] tracking-widest">集計中…</dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-dotted border-[#1F2533] pb-3">
            <dt className="text-xs text-[#9A9484] tracking-widest">連続来店</dt>
            <dd className="text-xs text-[#5E5A4F] tracking-widest">集計中…</dd>
          </div>
        </dl>
        <p className="mt-6 text-[10px] text-[#5E5A4F] tracking-widest leading-loose">
          ※ 在席の刻 chart と 親しい羊 はログ集計が必要なため後続フェーズで実装します。
        </p>
      </section>
    </div>
  )
}
