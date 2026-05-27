'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FumiIcon, MoonIcon, NorenIcon, SheepIcon } from './icons'

// SP 専用の下部タブバー (md:hidden)。Sidebar は SP で隠れるため、
// 主要 4 導線 (軒先 / 手紙 / 羊 / 己) をここに集約する。
const TABS: ReadonlyArray<{
  href: string
  label: string
  Icon: (p: { size?: number; color?: string }) => React.JSX.Element
}> = [
  { href: '/timeline', label: '軒先', Icon: NorenIcon },
  { href: '/chats', label: '手紙', Icon: FumiIcon },
  { href: '/sheep', label: '羊', Icon: SheepIcon },
  { href: '/profile', label: '己', Icon: MoonIcon },
]

const isActive = (pathname: string | null, href: string): boolean => {
  if (pathname === null) return false
  return pathname.startsWith(href)
}

export function BottomTab() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="下段タブ"
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t border-[#1F2533] bg-[rgba(8,11,18,0.95)] backdrop-blur"
      style={{ height: 60 }}
    >
      {TABS.map((t) => {
        const active = isActive(pathname, t.href)
        const color = active ? '#ECE6D4' : '#5E5A4F'
        const Icon = t.Icon
        return (
          <Link
            key={t.href}
            href={t.href}
            className="flex-1 flex flex-col items-center justify-center gap-1"
            style={{
              color,
              borderTop: active ? '2px solid #B89B6E' : '2px solid transparent',
            }}
          >
            <Icon size={20} color={color} />
            <span style={{ fontSize: 12, letterSpacing: '0.18em' }}>{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
