import Link from 'next/link'
import { SheepAvatar } from '../profile/_components/sheep-avatar'
import { MoonSvg } from './moon-svg'
import { TopBarClock } from './top-bar-clock'
import { TopBarSection } from './top-bar-section'

// design HTML (docs/design/extracted-timeline.jsx, line 6-110) の TopBar 構造。
// 3 セクション: brand 240px / section title (flex 1) / right cluster。
// 右端は 時計 + countdown + 自分 avatar (→ /profile)。
// 通知 bell は通知機能未実装のため削除済み。
type TopBarProps = {
  tone: string
}

export function TopBar({ tone }: TopBarProps) {
  return (
    <header
      className="flex items-center sticky top-0 z-10 border-b border-[#1F2533] bg-[rgba(8,11,18,0.85)] backdrop-blur"
      style={{ height: 64 }}
    >
      {/* Brand column — 月 + 迷羊苑。SP は幅自動 (border-right なし)、md で 240px 固定 */}
      <div
        className="flex items-center gap-3.5 h-full px-4 md:px-7 md:w-60 md:border-r md:border-[#1F2533]"
      >
        <MoonSvg size={28} phase={0.78} glow={false} />
        <span
          className="text-[15px] md:text-[17px] tracking-[0.25em] md:tracking-[0.35em] text-[#ECE6D4] whitespace-nowrap"
        >
          迷羊苑
        </span>
      </div>

      {/* Section title — pathname に応じて 軒先 / 手紙 / 己 / 羊 / お品書き */}
      <TopBarSection />

      {/* Right cluster */}
      <div className="flex items-center gap-4 md:gap-7 pr-4 md:pr-8">
        {/* 時計 + countdown は SP では隠す (情報量が多く狭い画面で崩れる) */}
        <div className="hidden md:flex items-center gap-7">
          <TopBarClock />
          <span className="h-9 w-px bg-[#1F2533]" aria-hidden />
        </div>

        {/* 自分 avatar — クリックで己 (profile) へ */}
        <Link
          href="/profile"
          aria-label="己 (あなたの席)"
          className="flex items-center justify-center overflow-hidden rounded-full hover:border-[#B89B6E] transition-colors shrink-0"
          style={{
            width: 38,
            height: 38,
            border: '1px solid #2A3142',
            background: '#10141E',
          }}
        >
          <SheepAvatar tone={tone} size={36} />
        </Link>
      </div>
    </header>
  )
}
