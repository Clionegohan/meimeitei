import Link from 'next/link'
import { listOnlineUsers, userRepository } from '@/server/di'
import { SheepAvatar } from '../../profile/_components/sheep-avatar'
import type { UserId } from '@me-me-en/domain'

export async function OnlineSheepList({ viewerId }: { viewerId: UserId }) {
  const presences = await listOnlineUsers({ viewerId })
  const users = await Promise.all(
    presences.map(async (p) => {
      const u = await userRepository.findById(p.userId)
      if (u === null) return null
      return { id: u.id, nickname: u.nickname, tone: u.tone, isSelf: u.id === viewerId }
    }),
  )
  const visible = users.filter((u): u is NonNullable<typeof u> => u !== null)

  return (
    <aside className="w-44 shrink-0 pl-6 border-l border-[#1F2533]">
      <div className="text-[10px] tracking-[0.35em] text-[#5E5A4F] mb-4">灯ともる羊</div>
      {visible.length === 0 ? (
        <p className="text-[11px] text-[#5E5A4F] tracking-wider leading-relaxed">
          まだ 誰も 灯っていない。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((u) => (
            <li key={u.id}>
              <Link
                href={u.isSelf ? '/profile' : `/profile/${u.id}`}
                className="flex items-center gap-2 group"
              >
                <span className="relative">
                  <SheepAvatar tone={u.tone} size={32} />
                  <span
                    className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-[#B89B6E] border border-[#080B12]"
                    aria-hidden
                  />
                </span>
                <span className="text-[12px] text-[#D8D2C0] tracking-wider group-hover:text-[#ECE6D4] truncate">
                  {u.nickname}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
