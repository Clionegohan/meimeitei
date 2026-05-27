import Link from 'next/link'
import type { CloseSheep } from '@me-me-en/application'
import type { UserId } from '@me-me-en/domain'
import { userRepository } from '@/server/di'
import { toKanji } from '../../_components/kanji'
import { SheepAvatar } from './sheep-avatar'

// design HTML (docs/design/extracted-profile.jsx, line 287-) の 親しい羊 リスト。
// 各行: border + surface bg + SheepBrush 32 + accent glow dot (online) +
// handle (明朝 13 px) + meta (n 夜目)。
export async function CloseSheepList({
  sheep,
}: {
  sheep: readonly CloseSheep[]
}) {
  if (sheep.length === 0) {
    return (
      <p
        style={{
          fontSize: 12,
          color: '#5E5A4F',
          letterSpacing: '0.15em',
          lineHeight: 1.9,
        }}
      >
        まだ 親しく 文を交わした 羊は おりません。
      </p>
    )
  }
  const enriched = await Promise.all(
    sheep.map(async (s) => {
      const u = await userRepository.findById(s.userId as UserId)
      return {
        ...s,
        nickname: u?.nickname ?? '名なし',
        tone: u?.tone ?? '#E8E2D2',
      }
    }),
  )
  return (
    <ul className="flex flex-col" style={{ gap: 10 }}>
      {enriched.map((s) => (
        <li key={s.userId}>
          <Link
            href={`/profile/${s.userId}`}
            className="flex items-center hover:bg-[#161B27] transition-colors group"
            style={{
              padding: '10px 14px',
              border: '1px solid #1F2533',
              background: '#10141E',
              gap: 12,
            }}
          >
            <div className="relative shrink-0">
              <SheepAvatar tone={s.tone} size={32} />
              {/* 親しい羊は基本的に「灯」点灯扱い (online 判定 API 未接続、装飾の演出) */}
              <span
                className="absolute rounded-full"
                aria-hidden
                style={{
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  background: '#B89B6E',
                  border: '2px solid #10141E',
                  boxShadow: '0 0 4px #B89B6E',
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontSize: 14,
                  color: '#ECE6D4',
                  letterSpacing: '0.06em',
                }}
              >
                {s.nickname}
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: 12,
                  color: '#5E5A4F',
                  letterSpacing: '0.15em',
                  marginTop: 2,
                }}
              >
                {toKanji(s.messageCount)} 通 · 個室
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
