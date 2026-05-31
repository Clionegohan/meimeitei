import Link from 'next/link'
import { auth } from '@/auth'
import { listOnlineUsers, listUsers } from '@/server/di'
import { formatJapaneseDate } from '../_components/kanji'
import { SheepAvatar } from '../profile/_components/sheep-avatar'
import { PresenceDot } from '../_components/presence-dot'

// 客帳 (spec S-c): ここに来た全ての羊の一覧。各行から profile へ、そこから手紙へ。
export default async function SheepPage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null
  const viewerId = session.userId

  // 客帳には自分は載せない (己は /profile で見る)。
  const users = (await listUsers({ viewerId })).filter((u) => u.id !== viewerId)
  // 在席 (online かつ秘匿でない) の羊 id 集合。秘匿者はそもそも含まれない。
  const onlinePresences = await listOnlineUsers({ viewerId })
  const onlineIds = new Set(onlinePresences.map((p) => p.userId))

  return (
    <div className="px-4 py-6 md:px-14 md:py-10 max-w-2xl">
      <h2 className="text-[26px] md:text-[32px] tracking-[0.2em] font-light leading-tight">
        客 帳
      </h2>
      <p className="text-[14px] md:text-[14px] text-[#5E5A4F] tracking-[0.25em] mt-2 mb-6 md:mb-8">
        ここに来た 全ての羊の 帳面。
      </p>

      {users.length === 0 ? (
        <p className="text-[16px] text-[#9A9484] tracking-wider leading-loose">
          まだ どなたも 記帳しておりません。
        </p>
      ) : (
        <ul className="flex flex-col">
          {users.map((u) => {
            const meta =
              u.favoriteMoon !== null
                ? `好きな月 · ${u.favoriteMoon}`
                : `入店 ${formatJapaneseDate(new Date(u.joinedAt))}`
            return (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.id}`}
                  className="flex items-center gap-4 hover:bg-[#10141E] transition-colors"
                  style={{ padding: '14px 12px', borderBottom: '1px solid #1F2533' }}
                >
                  <div className="relative shrink-0">
                    <div
                      className="rounded-full overflow-hidden flex items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        background: '#10141E',
                        border: '1px solid #1F2533',
                      }}
                    >
                      <SheepAvatar tone={u.tone} size={44} />
                    </div>
                    <PresenceDot online={onlineIds.has(u.id)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{ fontSize: 18, color: '#ECE6D4', letterSpacing: '0.08em' }}
                    >
                      {u.nickname}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontSize: 14,
                        color: '#5E5A4F',
                        letterSpacing: '0.06em',
                        marginTop: 3,
                      }}
                    >
                      {meta}
                    </div>
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
