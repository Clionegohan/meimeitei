import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { recordLogin } from '@/server/di'
import { SessionWatcher } from './_components/session-watcher'
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

  return (
    <div className="min-h-screen bg-[#080B12] text-[#ECE6D4]">
      <SessionWatcher userId={session.userId} />
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
