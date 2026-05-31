import { auth, signOut } from '@/auth'
import { listBlockedUsers } from '@/server/di'
import { SumiDivider } from '../_components/sumi-divider'
import { BlockedList, type BlockedSheep } from './blocked-list'
import { DangerZone } from './danger-zone'

// お品書き — 設定と規則。
//   1. 店の決まり (規則・静的)
//   2. 遮断した羊 (一覧 + 解除)
//   3. お店を出る (ログアウト)
//   4. 退苑 (アカウント削除)
export default async function SettingsPage() {
  const session = await auth()
  if (session === null || session.userId === undefined) return null

  const blocked = await listBlockedUsers({ viewerId: session.userId })
  const blockedSheep: BlockedSheep[] = blocked.map((u) => ({
    id: u.id,
    nickname: u.nickname,
    tone: u.tone,
  }))

  return (
    <div className="px-4 py-6 md:px-14 md:py-10 max-w-2xl">
      {/* heading */}
      <div style={{ fontSize: 32, letterSpacing: '0.2em', color: '#ECE6D4', fontWeight: 300 }}>
        お 品 書 き
      </div>
      <div style={{ fontSize: 14, color: '#5E5A4F', letterSpacing: '0.25em', marginTop: 6 }}>
        お席の作法、ご利用の規則。
      </div>

      <div style={{ marginTop: 24 }}>
        <SumiDivider width={760} opacity={0.5} />
      </div>

      {/* 1. 店の決まり */}
      <Section title="店 の 決 ま り" sub="この苑のひそやかな約束ごと。">
        <ul className="flex flex-col" style={{ gap: 14 }}>
          {RULES.map((r) => (
            <li key={r.head} className="flex flex-col" style={{ gap: 4 }}>
              <span style={{ fontSize: 16, color: '#ECE6D4', letterSpacing: '0.12em' }}>
                {r.head}
              </span>
              <span
                style={{ fontSize: 14, color: '#9A9484', letterSpacing: '0.06em', lineHeight: 1.9 }}
              >
                {r.body}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 2. 遮断した羊 */}
      <Section title="遮 断 し た 羊" sub="ここからのみ、遮断を解けます。">
        <BlockedList sheep={blockedSheep} />
      </Section>

      {/* 3. お店を出る (ログアウト) */}
      <Section title="お 店 を 出 る" sub="また夜に、お待ちしております。">
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="hover:bg-[#161B27] transition-colors"
            style={{
              height: 42,
              padding: '0 22px',
              border: '1px solid #2A3142',
              background: 'transparent',
              color: '#9A9484',
              fontSize: 14,
              letterSpacing: '0.3em',
            }}
          >
            退店する
          </button>
        </form>
      </Section>

      {/* 4. 退苑 (アカウント削除) */}
      <Section title="退 苑" sub="この苑から、すべてを退けます。">
        <DangerZone />
      </Section>
    </div>
  )
}

const RULES: ReadonlyArray<{ head: string; body: string }> = [
  {
    head: '灯るのは夜だけ',
    body: '二十二時から翌五時まで。朝が来れば、苑はそっと扉を閉じます。',
  },
  {
    head: '軒先は朝に片付く',
    body: 'みなの独り言は、夜が明けると片付けられます。残るのは今宵の文だけ。',
  },
  {
    head: '手紙は夜を跨いで残る',
    body: '一対一の手紙は消えません。幾夜でも、ふたりのもとに積もります。',
  },
  {
    head: '在席は灯で示す',
    body: '起きていれば灯がともります。秘匿にすれば、在席かどうかも隠せます。',
  },
]

function Section({
  title,
  sub,
  children,
}: {
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ fontSize: 18, color: '#ECE6D4', letterSpacing: '0.25em' }}>{title}</div>
      <div
        style={{
          fontSize: 12,
          color: '#5E5A4F',
          letterSpacing: '0.15em',
          marginTop: 6,
          marginBottom: 16,
        }}
      >
        {sub}
      </div>
      {children}
    </section>
  )
}
