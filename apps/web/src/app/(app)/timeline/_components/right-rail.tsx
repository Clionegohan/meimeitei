import Link from 'next/link'
import { getMoonPhase } from '@me-me-en/application'
import type { SignTag, UserId } from '@me-me-en/domain'
import { listOnlineUsers, userRepository } from '@/server/di'
import { MoonSvg } from '../../_components/moon-svg'
import { toKanji } from '../../_components/kanji'
import { moonAgeOf, moonNameOf } from '../../_components/moon-name'
import { SheepAvatar } from '../../profile/_components/sheep-avatar'

// design HTML (docs/design/extracted-timeline.jsx, line 213-) の RightRail 構造:
//  1) 今宵の月 panel  — 右上に Moon2 130 px (glow)、月相名 + 月齢
//  2) 灯ともる羊       — online users + mood (currentSigns[0])
//  3) お席のご案内     — ハッシュタグ風 fixed sample (機能未実装、後続 phase)

// しるしを mood 文に翻訳。design HTML の sample (「月を眺めています」等) に倣う。
const SIGN_TO_MOOD: Record<SignTag, string> = {
  sleepless: '眠れない夜です',
  reading: '本を読み返しています',
  having_tea: 'お茶を、一杯',
  moon_gazing: '月を眺めています',
  nothing: 'なんとなく',
  wanting_to_hear: '声を聞きたくて',
  shiritori: 'しりとり、募集中',
  staying_up_late: '夜更かしの口です',
}


export async function RightRail({ viewerId }: { viewerId: UserId }) {
  const phase = getMoonPhase(new Date())
  const moonName = moonNameOf(phase)
  const moonAge = moonAgeOf(phase)

  const presences = await listOnlineUsers({ viewerId })
  const enriched = await Promise.all(
    presences.map(async (p) => {
      const u = await userRepository.findById(p.userId)
      if (u === null) return null
      const firstSign = u.currentSigns[0]
      const mood = firstSign !== undefined ? SIGN_TO_MOOD[firstSign] : ''
      return {
        id: u.id,
        nickname: u.nickname,
        tone: u.tone,
        mood,
        isSelf: u.id === viewerId,
      }
    }),
  )
  const visible = enriched.filter(
    (u): u is NonNullable<typeof u> => u !== null,
  )
  const litCount = visible.length

  return (
    <aside
      className="hidden md:block bg-[#0C1018] border-l border-[#1F2533] shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto"
      style={{ width: 340 }}
    >
      {/* ── 今宵の月 panel ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-[#1F2533]"
        style={{ padding: '28px 28px 26px', minHeight: 168 }}
      >
        {/* panel 右上に控えめサイズで完全表示。design HTML は -40, -40 で
            大きくはみ出す配置だったが、panel 内に収めて「夜空に浮かぶ小さな月」感に。 */}
        <div className="absolute" style={{ top: 16, right: 18 }}>
          <MoonSvg size={88} phase={phase} glow={true} glowSize={1.2} />
        </div>
        <div className="relative" style={{ zIndex: 2 }}>
          <div
            style={{
              fontSize: 12,
              color: '#5E5A4F',
              letterSpacing: '0.35em',
              marginBottom: 12,
            }}
          >
            今 宵 の 月
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#ECE6D4',
              letterSpacing: '0.18em',
              fontWeight: 300,
            }}
          >
            {moonName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#9A9484',
              letterSpacing: '0.15em',
              marginTop: 6,
              lineHeight: 1.9,
            }}
          >
            月齢 {toKanji(Math.floor(moonAge))}
            <br />
            月の出 <span className="tabular-nums">21:42</span>
            <span style={{ color: '#3A382F', margin: '0 8px' }}>·</span>
            月の入 <span className="tabular-nums">09:18</span>
          </div>
        </div>
      </div>

      {/* ── 灯ともる羊 ─────────────────────────────────────────── */}
      <div style={{ padding: '22px 28px 16px' }}>
        <div
          className="flex items-baseline justify-between"
          style={{ marginBottom: 14 }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#ECE6D4',
              letterSpacing: '0.3em',
            }}
          >
            灯 る 羊
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#5E5A4F',
              letterSpacing: '0.2em',
            }}
          >
            {toKanji(litCount)} 匹
          </div>
        </div>
        {visible.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: '#5E5A4F',
              letterSpacing: '0.15em',
              lineHeight: 1.9,
            }}
          >
            まだ 誰も 灯っていない。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((u) => (
              <Link
                key={u.id}
                href={u.isSelf ? '/profile' : `/profile/${u.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="relative shrink-0">
                  <SheepAvatar tone={u.tone} size={32} />
                  <span
                    className="absolute rounded-full"
                    aria-hidden
                    style={{
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      background: '#B89B6E',
                      border: '2px solid #0C1018',
                      boxShadow: '0 0 4px #B89B6E',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontSize: 14,
                      color: '#ECE6D4',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {u.nickname}
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: 12,
                      color: '#5E5A4F',
                      letterSpacing: '0.06em',
                      marginTop: 2,
                    }}
                  >
                    {u.mood}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* お席のご案内 は機能未定のため非表示 (listSeats use case 実装時に復活)。 */}
    </aside>
  )
}
