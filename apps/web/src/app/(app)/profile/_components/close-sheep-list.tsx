import Link from 'next/link'
import type { CloseSheep } from '@me-me-en/application'
import type { UserId } from '@me-me-en/domain'
import { userRepository } from '@/server/di'
import { SheepAvatar } from './sheep-avatar'

// 親しい羊 リスト。直近 30 日 DM 数 Top 3。
export async function CloseSheepList({
  sheep,
}: {
  sheep: readonly CloseSheep[]
}) {
  if (sheep.length === 0) {
    return (
      <p className="text-[11px] text-[#5E5A4F] tracking-widest">
        まだ 親しく 文を交わした 羊は おりません。
      </p>
    )
  }
  const enriched = await Promise.all(
    sheep.map(async (s) => {
      const u = await userRepository.findById(s.userId as UserId)
      return { ...s, nickname: u?.nickname ?? '名なし', tone: u?.tone ?? '#E8E2D2' }
    }),
  )
  return (
    <ul className="flex flex-col gap-3">
      {enriched.map((s) => (
        <li key={s.userId}>
          <Link
            href={`/profile/${s.userId}`}
            className="flex items-center gap-3 group"
          >
            <SheepAvatar tone={s.tone} size={36} />
            <span className="flex-1 text-sm text-[#D8D2C0] tracking-wider group-hover:text-[#ECE6D4] truncate">
              {s.nickname}
            </span>
            <span className="text-[10px] text-[#5E5A4F] tracking-widest tabular-nums">
              {s.messageCount}
              <span className="ml-1">通</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
