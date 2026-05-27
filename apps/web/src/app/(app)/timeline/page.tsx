import { auth } from '@/auth'
import { likeRepository, listTimeline, userRepository } from '@/server/di'
import { Composer } from './composer'
import { RightRail } from './_components/right-rail'
import type { PostDto } from './post-card'
import { TimelineClient } from './timeline-client'

export default async function TimelinePage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const posts = await listTimeline({ viewerId: session.userId })

  const userId = session.userId
  const postDtos: PostDto[] = await Promise.all(
    posts.map(async (p) => {
      const [like, author] = await Promise.all([
        likeRepository.findByPostAndUser(p.id, userId),
        userRepository.findById(p.authorId),
      ])
      return {
        id: p.id,
        authorId: p.authorId,
        authorNickname: author?.nickname ?? '名なし',
        authorTone: author?.tone ?? '#E8E2D2',
        body: p.body,
        postedAt: p.postedAt.toISOString(),
        nightId: p.nightId,
        iLiked: like !== null,
      }
    }),
  )

  // design HTML (extracted-timeline.jsx) は absolute layout で main + RightRail 340 の 2 ペイン。
  // 実装は flex で main flex-1 + RightRail 固定 340 の構成にする。
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="flex-1 min-w-0 px-4 py-6 md:p-10">
        <div className="max-w-3xl">
          <h2 className="text-[26px] md:text-[32px] tracking-[0.2em] font-light leading-tight">
            軒先のつぶやき
          </h2>
          <p className="text-[14px] md:text-[14px] text-[#5E5A4F] tracking-[0.25em] mt-2 mb-6 md:mb-8">
            ぽつり、ぽつりと、皆の独り言が並ぶところ。
          </p>

          <Composer />

          <TimelineClient initialPosts={postDtos} myUserId={userId} />

          <div className="mt-10 pt-6 border-t border-[#1F2533] text-center">
            <p className="text-[14px] text-[#9A9484] tracking-[0.35em]">
              ここから 今宵 が 始まりました
            </p>
            <p className="text-[14px] text-[#5E5A4F] tracking-widest mt-3 leading-loose">
              昨夜より前の文は、朝とともに片付けられました。
              <br />
              軒先には、今宵の文だけが並びます。
            </p>
          </div>
        </div>
      </div>

      <RightRail viewerId={userId} />
    </div>
  )
}
