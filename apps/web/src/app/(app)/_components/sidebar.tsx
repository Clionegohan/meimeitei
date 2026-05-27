'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FudaIcon,
  FumiIcon,
  MoonIcon,
  NorenIcon,
  SheepIcon,
} from './icons'
import { SumiDivider } from './sumi-divider'

// design HTML (docs/design/extracted-timeline.jsx, line 114-) の Sidebar 構造を踏襲。
// item: アイコン + 主ラベル(明朝 16px, letterSpacing 0.18em) + 補助テキスト(10px muted)。
// active state は左 border accent + 背景 rgba(184,155,110,0.06)。

type MenuItem = {
  href: string
  label: string
  sub: string
  Icon: (props: { size?: number; color?: string }) => React.JSX.Element
  badge?: number
}

const items: readonly MenuItem[] = [
  { href: '/timeline', label: '軒先', sub: '皆のつぶやき', Icon: NorenIcon },
  { href: '/chats', label: '手紙', sub: '一対一の語らい', Icon: FumiIcon, badge: 0 },
  { href: '/sheep', label: '羊', sub: '客帳', Icon: SheepIcon },
  { href: '/profile', label: '己', sub: 'あなたの席', Icon: MoonIcon },
]

const lowerItems: readonly MenuItem[] = [
  { href: '/settings', label: 'お品書き', sub: '設定と規則', Icon: FudaIcon },
]

const isItemActive = (pathname: string | null, href: string): boolean => {
  if (pathname === null) return false
  if (href === '/timeline') return pathname === '/timeline'
  if (href === '/chats') return pathname.startsWith('/chats')
  if (href === '/profile') return pathname.startsWith('/profile')
  return pathname === href
}

const ItemRow = ({
  item,
  active,
}: {
  item: MenuItem
  active: boolean
}) => {
  const Icon = item.Icon
  const labelColor = active ? '#ECE6D4' : '#D8D2C0'
  const iconColor = active ? '#ECE6D4' : '#9A9484'
  const showBadge = item.badge !== undefined && item.badge > 0
  return (
    <Link
      href={item.href}
      className="flex items-center gap-4 px-5 py-3.5 border-l-2 transition-colors"
      style={{
        background: active ? 'rgba(184,155,110,0.06)' : 'transparent',
        borderLeftColor: active ? '#B89B6E' : 'transparent',
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{ width: 28, height: 28, opacity: active ? 1 : 0.7 }}
      >
        <Icon size={22} color={iconColor} />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className="block leading-tight"
          style={{ fontSize: 16, letterSpacing: '0.18em', color: labelColor }}
        >
          {item.label}
        </span>
        <span
          className="block mt-1"
          style={{ fontSize: 10, letterSpacing: '0.1em', color: '#5E5A4F' }}
        >
          {item.sub}
        </span>
      </span>
      {showBadge && (
        <span
          className="flex items-center justify-center"
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 9,
            background: '#A85040',
            color: '#F2EAD1',
            fontSize: 10,
            fontWeight: 500,
            boxShadow: '0 0 8px rgba(168,80,64,0.4)',
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex w-60 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto border-r border-[#1F2533] bg-[#0C1018] flex-col">
      {/* Compose CTA — 「筆を取る」 */}
      <div className="px-[22px] pt-6 pb-[18px]">
        <button
          type="button"
          className="w-full h-[46px] border border-[#ECE6D4] bg-transparent text-[#ECE6D4] flex items-center justify-center gap-2.5 hover:bg-[#161B27] transition-colors"
          style={{ fontSize: 13, letterSpacing: '0.4em', fontWeight: 400 }}
        >
          <span style={{ fontSize: 16 }}>筆</span>
          筆を取る
        </button>
      </div>

      {/* SumiDivider — compose CTA 直下 */}
      <div className="mx-[22px] mb-[18px]" style={{ marginTop: 4 }}>
        <SumiDivider width={196} opacity={0.5} />
      </div>

      <nav className="flex-1">
        {items.map((it) => (
          <ItemRow
            key={it.href}
            item={it}
            active={isItemActive(pathname, it.href)}
          />
        ))}
      </nav>

      <div className="border-t border-[#1F2533] py-3">
        {lowerItems.map((it) => (
          <ItemRow
            key={it.href}
            item={it}
            active={isItemActive(pathname, it.href)}
          />
        ))}
      </div>

      {/* 底部の日付ラベル */}
      <div
        className="border-t border-[#1F2533]"
        style={{
          padding: '14px 22px 18px',
          fontSize: 10,
          color: '#5E5A4F',
          letterSpacing: '0.15em',
          lineHeight: 1.7,
        }}
      >
        本日は 二十六年
        <br />
        神無月 廿五日
      </div>
    </aside>
  )
}
