import { SheepAvatar } from '../profile/_components/sheep-avatar'
import { MoonSvg } from './moon-svg'
import { TopBarClock } from './top-bar-clock'
import { TopBarSection } from './top-bar-section'

// design HTML (docs/design/extracted-timeline.jsx, line 6-110) の TopBar 構造。
// 3 セクション: brand 240px / section title (flex 1) / right cluster (gap 28)。
// 右端は 時計 + countdown + bell + 自分 avatar。
type TopBarProps = {
  tone: string
}

export function TopBar({ tone }: TopBarProps) {
  return (
    <header
      className="flex items-center sticky top-0 z-10 border-b border-[#1F2533] bg-[rgba(8,11,18,0.85)] backdrop-blur"
      style={{ height: 64 }}
    >
      {/* Brand column — 月 + 迷羊苑 */}
      <div
        className="flex items-center"
        style={{
          width: 240,
          height: '100%',
          padding: '0 28px',
          borderRight: '1px solid #1F2533',
          gap: 14,
        }}
      >
        <MoonSvg size={28} phase={0.78} glow={false} />
        <span
          style={{
            fontSize: 17,
            letterSpacing: '0.35em',
            color: '#ECE6D4',
            fontWeight: 400,
          }}
        >
          迷羊苑
        </span>
      </div>

      {/* Section title — pathname に応じて 軒先 / 手紙 / 己 / 羊 / お品書き */}
      <TopBarSection />

      {/* Right cluster */}
      <div className="flex items-center gap-7 pr-8">
        <TopBarClock />

        <span className="h-9 w-px bg-[#1F2533]" aria-hidden />

        {/* 通知 bell + vermilion 未読 dot */}
        <button
          type="button"
          className="relative bg-transparent p-1"
          aria-label="お知らせ"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9A9484"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4 L12 3 M6 10 a6 6 0 0 1 12 0 c0 7 3 8 3 8 H3 s3 -1 3 -8 Z" />
            <path d="M10 21 a2 2 0 0 0 4 0" />
          </svg>
          <span
            className="absolute top-0.5 right-0.5 rounded-full"
            aria-hidden
            style={{
              width: 6,
              height: 6,
              background: '#A85040',
              boxShadow: '0 0 5px #A85040',
            }}
          />
        </button>

        {/* 自分 avatar */}
        <div
          className="flex items-center justify-center overflow-hidden rounded-full"
          style={{
            width: 38,
            height: 38,
            border: '1px solid #2A3142',
            background: '#10141E',
          }}
        >
          <SheepAvatar tone={tone} size={36} />
        </div>
      </div>
    </header>
  )
}
