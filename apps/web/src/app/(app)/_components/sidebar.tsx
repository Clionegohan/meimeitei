import Link from 'next/link'

const items = [
  { href: '/timeline', label: '軒先', sub: '皆のつぶやき' },
  { href: '/chats', label: '手紙', sub: '一対一の語らい' },
  { href: '/profile', label: '己', sub: 'あなたの席' },
]

export function Sidebar() {
  return (
    <aside className="w-60 min-h-[calc(100vh-64px)] border-r border-[#1F2533] bg-[#0C1018]">
      <nav className="py-6">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block px-6 py-3 hover:bg-[#161B27] border-l-2 border-transparent hover:border-[#B89B6E] transition-colors"
          >
            <div className="text-base tracking-[0.18em] text-[#D8D2C0]">{it.label}</div>
            <div className="text-[10px] text-[#5E5A4F] tracking-wider mt-0.5">
              {it.sub}
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
