'use client'

import { usePathname } from 'next/navigation'

// pathname → (section, romaji) のマッピング。
// design HTML (extracted-timeline.jsx) の section / sectionRomaji prop を再現。
const SECTION_MAP: ReadonlyArray<{
  prefix: string
  section: string
  romaji: string
}> = [
  { prefix: '/timeline', section: '軒先', romaji: 'NOKISAKI' },
  { prefix: '/chats', section: '手紙', romaji: 'TEGAMI' },
  { prefix: '/profile', section: '己', romaji: 'ONORE' },
  { prefix: '/sheep', section: '羊', romaji: 'HITSUJI' },
  { prefix: '/settings', section: 'お品書き', romaji: 'SHINASHO' },
]

const resolveSection = (
  pathname: string | null,
): { section: string; romaji: string } => {
  if (pathname === null) return { section: '', romaji: '' }
  for (const entry of SECTION_MAP) {
    if (pathname.startsWith(entry.prefix)) return entry
  }
  return { section: '', romaji: '' }
}

export function TopBarSection() {
  const pathname = usePathname()
  const { section, romaji } = resolveSection(pathname)
  if (section === '') return <div className="flex-1" />
  return (
    <div className="flex-1 pl-8 flex items-baseline gap-4">
      <span
        style={{
          fontSize: 18,
          color: '#ECE6D4',
          letterSpacing: '0.25em',
        }}
      >
        {section}
      </span>
      <span
        style={{
          fontSize: 12,
          color: '#5E5A4F',
          letterSpacing: '0.4em',
        }}
      >
        · {romaji}
      </span>
    </div>
  )
}
