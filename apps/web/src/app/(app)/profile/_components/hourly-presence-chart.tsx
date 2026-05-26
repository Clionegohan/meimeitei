import type { HourlyPresenceBucket } from '@me-me-en/application'

// 在席の刻 chart。各バケットを縦棒（intensity 0..1）で表示する。
// intensity == 0 の時間帯も骨格は描画して「ここに灯らなかった」が見えるようにする。
const HOUR_LABEL: Record<number, string> = {
  22: '亥',
  23: '子',
  0: '丑',
  1: '丑',
  2: '寅',
  3: '寅',
  4: '卯',
  5: '辰',
}

export function HourlyPresenceChart({
  buckets,
}: {
  buckets: readonly HourlyPresenceBucket[]
}) {
  if (buckets.length === 0) {
    return (
      <p className="text-[11px] text-[#5E5A4F] tracking-widest">
        まだ 集計するだけの 灯が ありません。
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-end gap-1.5 h-24">
        {buckets.map((b) => (
          <div key={b.hour} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full h-20 relative bg-[#10141E] border border-[#1F2533]">
              <div
                className="absolute inset-x-0 bottom-0 bg-[#B89B6E]"
                style={{ height: `${Math.max(b.intensity * 100, 2)}%`, opacity: 0.15 + b.intensity * 0.85 }}
              />
            </div>
            <div className="text-[10px] text-[#5E5A4F] tracking-widest tabular-nums">
              {b.hour.toString().padStart(2, '0')}
            </div>
            <div className="text-[9px] text-[#3A382F] tracking-widest">
              {HOUR_LABEL[b.hour] ?? ''}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-[#5E5A4F] tracking-widest leading-loose">
        ※ 直近 30 日の 入店刻別 灯火頻度。最も多い刻を基準に濃淡を整えています。
      </p>
    </div>
  )
}
