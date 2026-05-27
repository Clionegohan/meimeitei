import Link from 'next/link'
import { auth } from '@/auth'
import { listConversations, listMessages, userRepository } from '@/server/di'
import { SheepAvatar } from '../profile/_components/sheep-avatar'

// 直近メッセージの時刻を「02:47」/「昨夜」/「一昨夜」風に。
const formatWhen = (iso: string, now: Date): string => {
  const then = new Date(iso)
  const diffDays = Math.floor(
    (now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays <= 0)
    return then.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return '昨夜'
  if (diffDays === 2) return '一昨夜'
  return `${diffDays}日前`
}

export default async function ChatsListPage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null
  const userId = session.userId
  const now = new Date()

  const conversations = await listConversations({ userId })

  // 各会話: 相手 / 直近メッセージ / 未読数 を集める
  const rows = await Promise.all(
    conversations.map(async (c) => {
      const partnerId = c.participantIds.find((id) => id !== userId)
      const [partner, messages] = await Promise.all([
        partnerId === undefined
          ? Promise.resolve(null)
          : userRepository.findById(partnerId),
        listMessages({ viewerId: userId, conversationId: c.id }),
      ])
      const last = messages[messages.length - 1] ?? null
      const unread = messages.filter(
        (m) => m.senderId !== userId && m.readAt === null,
      ).length
      return { conv: c, partner, last, unread }
    }),
  )
  // 直近メッセージ時刻で降順 (新しい会話が上)
  rows.sort(
    (a, b) =>
      (b.last?.sentAt.getTime() ?? b.conv.openedAt.getTime()) -
      (a.last?.sentAt.getTime() ?? a.conv.openedAt.getTime()),
  )

  return (
    <div className="px-4 py-6 md:p-10 max-w-2xl">
      <h2 className="text-[26px] md:text-[32px] tracking-[0.2em] font-light leading-tight">手紙</h2>
      <p className="text-[14px] md:text-[14px] text-[#5E5A4F] tracking-[0.25em] mt-2 mb-6 md:mb-8">
        文字だけの、ふたりの語らい。
      </p>

      {rows.length === 0 ? (
        <p className="text-[16px] text-[#9A9484] tracking-wider leading-loose">
          まだ 文を交わした 相手は おりません。
          <br />
          軒先の誰かに応えるか、客帳から話しかけてみてください。
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map(({ conv, partner, last, unread }) => {
            const nickname = partner?.nickname ?? '名なし'
            const tone = partner?.tone ?? '#E8E2D2'
            const preview =
              last === null
                ? 'まだ言葉はありません'
                : (last.senderId === userId ? 'あなた: ' : '') + last.body
            return (
              <li key={conv.id}>
                <Link
                  href={`/chats/${conv.id}`}
                  className="flex items-center gap-4 hover:bg-[#10141E] transition-colors"
                  style={{
                    padding: '14px 12px',
                    borderBottom: '1px solid #1F2533',
                  }}
                >
                  {/* avatar */}
                  <div
                    className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{
                      width: 48,
                      height: 48,
                      background: '#10141E',
                      border: '1px solid #1F2533',
                    }}
                  >
                    <SheepAvatar tone={tone} size={44} />
                  </div>

                  {/* nickname + preview */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontSize: 18,
                        color: '#ECE6D4',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {nickname}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontSize: 14,
                        color: unread > 0 ? '#D8D2C0' : '#5E5A4F',
                        letterSpacing: '0.04em',
                        marginTop: 3,
                      }}
                    >
                      {preview}
                    </div>
                  </div>

                  {/* 時刻 + 未読バッジ */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {last !== null && (
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: 12,
                          color: '#5E5A4F',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {formatWhen(last.sentAt.toISOString(), now)}
                      </span>
                    )}
                    {unread > 0 && (
                      <span
                        className="flex items-center justify-center rounded-full tabular-nums"
                        style={{
                          minWidth: 18,
                          height: 18,
                          padding: '0 5px',
                          background: '#A85040',
                          color: '#F2EAD1',
                          fontSize: 12,
                          fontWeight: 500,
                          boxShadow: '0 0 8px rgba(168,80,64,0.4)',
                        }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
