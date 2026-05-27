import Link from 'next/link'
import { auth } from '@/auth'
import { listConversations } from '@/server/di'

export default async function ChatsListPage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const conversations = await listConversations({ userId: session.userId })

  return (
    <div className="p-10 max-w-3xl">
      <h2 className="text-2xl tracking-[0.2em] font-light mb-2">手紙 · 個室一覧</h2>
      <p className="text-[13px] text-[#5E5A4F] tracking-[0.25em] mb-8">
        TEGAMI · PRIVATE ROOMS
      </p>

      {conversations.length === 0 ? (
        <p className="text-sm text-[#9A9484] tracking-wider">
          まだ会話がありません。誰かの投稿に返信するか、相手のプロフィールから話しかけてください。
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const partner = c.participantIds.find((id) => id !== session.userId) ?? '...'
            return (
              <li key={c.id}>
                <Link
                  href={`/chats/${c.id}`}
                  className="block p-4 border border-[#1F2533] hover:bg-[#161B27] hover:border-[#2A3142] transition-colors"
                >
                  <div className="text-sm tracking-wider text-[#ECE6D4]">{partner}</div>
                  {c.rootPostId !== null && (
                    <div className="text-[12px] text-[#5E5A4F] tracking-widest mt-1">
                      投稿への返信から始まった
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
