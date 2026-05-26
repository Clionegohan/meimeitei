import { auth } from '@/auth'
import { likeRepository, listTimeline } from '@/server/di'
import { Composer } from './composer'
import { PostCard, type PostDto } from './post-card'

export default async function TimelinePage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const posts = await listTimeline({ viewerId: session.userId })

  // For each post: did I like it? (used to render the toggle in iLiked state)
  // This is a view-model concern resolved at the presentation boundary.
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

  return (
    <div className="p-10 max-w-3xl">
      <h2 className="text-2xl tracking-[0.2em] font-light mb-2">軒先のつぶやき</h2>
      <p className="text-[11px] text-[#5E5A4F] tracking-[0.25em] mb-8">
        ぽつり、ぽつりと、皆の独り言が並ぶところ。
      </p>

      <Composer />

      {postDtos.length === 0 ? (
        <p className="text-sm text-[#9A9484] tracking-wider py-12 text-center">
          まだ今宵の言葉はありません。
        </p>
      ) : (
        <div>
          {postDtos.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

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
  )
}
