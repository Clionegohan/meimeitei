import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { recordLogin, userRepository } from '@/server/di'
import { BottomTab } from './_components/bottom-tab'
import { Sidebar } from './_components/sidebar'
import { TopBar } from './_components/top-bar'

// (app) route group — protected, in-business-hours pages.
// Middleware already gates auth + business hours, but we double-check here
// to render guarded content correctly.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session === null) redirect('/login')
  if (session.userId === undefined) redirect('/onboarding')

  // 「来店帳」の集計起点。idempotent (同夜は no-op) なので毎リクエスト呼んで良い。
  await recordLogin({ userId: session.userId })

  // TopBar の自分 avatar 用に tone を引く (省略可、無ければ default tone)。
  const user = await userRepository.findById(session.userId)

  return (
    <div className="min-h-screen bg-[#080B12] text-[#ECE6D4]">
      <TopBar tone={user?.tone ?? '#E8E2D2'} />
      {/* items-start で sidebar が main の高さに引き伸ばされないようにし、
          sidebar 自身を sticky top-16 (TopBar 高さ 64px) で固定する。
          → main だけがスクロール、sidebar は常に画面内に残る。 */}
      <div className="flex items-start">
        <Sidebar />
        {/* SP は bottom tab 分の余白を確保 (pb-[60px])。md 以上は不要。 */}
        <main className="flex-1 min-w-0 pb-[60px] md:pb-0">{children}</main>
      </div>
      <BottomTab />
    </div>
  )
}
