import { getMoonPhase } from '@me-me-en/application'
import { auth } from '@/auth'
import { likeRepository, listTimeline } from '@/server/di'
import { MoonSvg } from '../_components/moon-svg'
import { Composer } from './composer'
import { OnlineSheepList } from './_components/online-sheep-list'
import type { PostDto } from './post-card'
import { TimelineClient } from './timeline-client'

export default async function TimelinePage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const posts = await listTimeline({ viewerId: session.userId })

  const userId = session.userId
  const postDtos: PostDto[] = await Promise.all(
    posts.map(async (p) => {
      const like = await likeRepository.findByPostAndUser(p.id, userId)
      return {
        id: p.id,
        authorId: p.authorId,
        body: p.body,
        postedAt: p.postedAt.toISOString(),
        nightId: p.nightId,
        iLiked: like !== null,
      }
    }),
  )

  const moonPhase = getMoonPhase(new Date())

  return (
    <div className="p-10 flex gap-10">
      <div className="max-w-3xl flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl tracking-[0.2em] font-light">軒先のつぶやき</h2>
          <div className="opacity-90 mt-[-6px]">
            <MoonSvg size={56} phase={moonPhase} />
          </div>
        </div>
        <p className="text-[11px] text-[#5E5A4F] tracking-[0.25em] mb-8">
          ぽつり、ぽつりと、皆の独り言が並ぶところ。
        </p>

        <Composer />

        <TimelineClient initialPosts={postDtos} myUserId={userId} />

        <div className="mt-10 pt-6 border-t border-[#1F2533] text-center">
          <p className="text-[11px] text-[#9A9484] tracking-[0.35em]">
            ここから 今宵 が 始まりました
          </p>
          <p className="text-[10px] text-[#5E5A4F] tracking-widest mt-3 leading-loose">
            昨夜より前の文は、朝とともに片付けられました。
            <br />
            軒先には、今宵の文だけが並びます。
          </p>
        </div>
      </div>

      <OnlineSheepList viewerId={userId} />
    </div>
  )
}
