import type { HourlyPresenceBucket, ProfileStats } from '@me-me-en/application'
import { signOut } from '@/auth'
import { toKanji } from '../../_components/kanji'
import { HourlyPresenceChart } from './hourly-presence-chart'

// design HTML (docs/design/extracted-profile.jsx, line 9-133) の 右 rail。
// 来店帳 4 stats + 在席の刻 chart + 「退店する」ボタン (底部 absolute)。
type VisitRecordRailProps = {
  stats: ProfileStats
  hourly: readonly HourlyPresenceBucket[]
}

const STAT_ROWS: ReadonlyArray<{
  label: string
  unit: string
  key: keyof ProfileStats
}> = [
  { label: '入店した夜', unit: '夜', key: 'totalLoginNights' },
  { label: '連続来店', unit: '夜', key: 'consecutiveLoginNights' },
  { label: '置いた文', unit: '通', key: 'postCount' },
  { label: '寄せられた燭', unit: '本', key: 'candleReceivedCount' },
]

export function VisitRecordRail({ stats, hourly }: VisitRecordRailProps) {
  return (
    <aside
      className="bg-[#0C1018] border-t md:border-t-0 md:border-l border-[#1F2533] shrink-0 relative w-full md:w-[340px] px-5 md:px-7 pt-8 pb-8 md:pb-[100px] md:sticky md:top-16 md:h-[calc(100vh-64px)] md:overflow-y-auto"
    >
      {/* 来店帳 */}
      <div
        style={{
          fontSize: 11,
          color: '#5E5A4F',
          letterSpacing: '0.35em',
          marginBottom: 18,
        }}
      >
        来 店 帳
      </div>

      <div className="flex flex-col" style={{ gap: 16 }}>
        {STAT_ROWS.map((row) => {
          const value = stats[row.key]
          return (
            <div
              key={row.key}
              className="flex justify-between items-baseline"
              style={{
                paddingBottom: 12,
                borderBottom: '1px dotted #1F2533',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#9A9484',
                  letterSpacing: '0.2em',
                }}
              >
                {row.label}
              </span>
              <span className="flex items-baseline" style={{ gap: 4 }}>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 24,
                    color: '#ECE6D4',
                    fontWeight: 300,
                    letterSpacing: '0.02em',
                  }}
                >
                  {toKanji(value)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: '#5E5A4F',
                    letterSpacing: '0.25em',
                  }}
                >
                  {row.unit}
                </span>
              </span>
            </div>
          )
        })}
      </div>

      {/* 在席の刻 */}
      <div style={{ marginTop: 32 }}>
        <HourlyPresenceChart buckets={hourly} />
      </div>

      {/* 退店する — desktop は底部固定、SP は静的に下へ積む */}
      <div className="mt-10 md:mt-0 md:absolute md:bottom-7 md:left-7 md:right-7">
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="w-full hover:bg-[#161B27] transition-colors"
            style={{
              height: 42,
              border: '1px solid #2A3142',
              background: 'transparent',
              color: '#9A9484',
              fontSize: 12,
              letterSpacing: '0.3em',
            }}
          >
            退店する
          </button>
        </form>
      </div>
    </aside>
  )
}
