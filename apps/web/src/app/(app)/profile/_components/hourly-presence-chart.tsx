import type { HourlyPresenceBucket } from '@me-me-en/application'
import { toKanji } from '../../_components/kanji'

// design HTML (docs/design/extracted-profile.jsx, line 51-122) の 在席の刻 chart。
// 棒立ち上がり型: 各 bar は 0 → intensity の高さで accent gradient (peak は moon top-border + glow)、
// 容器枠は無し。下に漢字数字の hour ラベル、peak は accent カラーで強調。
//
// 「廿二 / 廿三 / 〇 / 一 / 二 / 三 / 四 / 五」の 8 帯固定 (22-5 時 JST)。

const HOUR_LABELS_KANJI: Record<number, string> = {
  22: '廿二',
  23: '廿三',
  0: '〇',
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
}

// 時辰 (在席のピーク帯) を返す。design HTML は「丑三つ時 あたり」固定だが、
// peak の hour から動的に算出する。
const peakHourPhraseOf = (peakHour: number | null): string => {
  if (peakHour === null) return '夜更けあたり'
  if (peakHour === 22 || peakHour === 23) return '亥の刻あたり'
  if (peakHour === 0) return '子の刻あたり'
  if (peakHour === 1) return '丑の刻あたり'
  if (peakHour === 2) return '丑三つ時あたり'
  if (peakHour === 3) return '寅の刻あたり'
  if (peakHour === 4 || peakHour === 5) return '寅から卯の頃'
  return '夜更けあたり'
}

export function HourlyPresenceChart({
  buckets,
}: {
  buckets: readonly HourlyPresenceBucket[]
}) {
  if (buckets.length === 0) {
    return (
      <p
        style={{
          fontSize: 12,
          color: '#5E5A4F',
          letterSpacing: '0.15em',
        }}
      >
        まだ 集計するだけの 灯が ありません。
      </p>
    )
  }

  const peak = buckets.find((b) => b.intensity >= 0.999) ?? null
  const peakHour = peak?.hour ?? null
  const totalLit = buckets.filter((b) => b.intensity > 0).length

  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 12,
            color: '#5E5A4F',
            letterSpacing: '0.35em',
          }}
        >
          在 席 の 刻
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#5E5A4F',
            letterSpacing: '0.15em',
          }}
        >
          この三十日
        </div>
      </div>

      <div
        className="flex items-end"
        style={{ gap: 6, height: 88, padding: '0 2px' }}
      >
        {buckets.map((b) => {
          const isPeak = b.intensity >= 0.999
          return (
            <div
              key={b.hour}
              className="flex flex-col items-center justify-end h-full"
              style={{ flex: 1, gap: 4 }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(b.intensity * 100, 2)}%`,
                  background: isPeak
                    ? 'linear-gradient(180deg, #B89B6E 0%, #7A6749 100%)'
                    : 'linear-gradient(180deg, #7A6749 0%, rgba(122,103,73,0.4) 100%)',
                  opacity: isPeak ? 1 : 0.75,
                  borderTop: isPeak ? '1px solid #F2EAD1' : 'none',
                  boxShadow: isPeak ? '0 0 8px rgba(184,155,110,0.25)' : 'none',
                  transition: 'height 200ms ease',
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex" style={{ gap: 6, marginTop: 6, padding: '0 2px' }}>
        {buckets.map((b) => (
          <div
            key={b.hour}
            className="text-center"
            style={{
              flex: 1,
              fontSize: 12,
              color: b.hour === peakHour ? '#B89B6E' : '#5E5A4F',
              letterSpacing: '0.05em',
            }}
          >
            {HOUR_LABELS_KANJI[b.hour] ?? String(b.hour)}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          color: '#9A9484',
          letterSpacing: '0.15em',
          lineHeight: 1.8,
        }}
      >
        {totalLit === 0 ? (
          '直近 三十日、まだ 灯火は 集まっていません。'
        ) : (
          <>
            よく在席されるのは&nbsp;
            <span style={{ color: '#B89B6E' }}>{peakHourPhraseOf(peakHour)}</span>
            。&nbsp;({toKanji(totalLit)} 帯)
          </>
        )}
      </div>
    </div>
  )
}
