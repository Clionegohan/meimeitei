'use client'

import { usePathname } from 'next/navigation'

// pathname → section 名のマッピング。
const SECTION_MAP: ReadonlyArray<{ prefix: string; section: string }> = [
  { prefix: '/timeline', section: '軒先' },
  { prefix: '/chats', section: '手紙' },
  { prefix: '/profile', section: '己' },
  { prefix: '/sheep', section: '羊' },
  { prefix: '/settings', section: 'お品書き' },
]

const resolveSection = (pathname: string | null): string => {
  if (pathname === null) return ''
  for (const entry of SECTION_MAP) {
    if (pathname.startsWith(entry.prefix)) return entry.section
  }
  return ''
}

export function TopBarSection() {
  const pathname = usePathname()
  const section = resolveSection(pathname)
  if (section === '') return <div className="flex-1" />
  return (
    <div className="flex-1 pl-8 flex items-baseline">
      <span
        style={{
          fontSize: 18,
          color: '#ECE6D4',
          letterSpacing: '0.25em',
        }}
      >
        {section}
      </span>
    </div>
  )
}
