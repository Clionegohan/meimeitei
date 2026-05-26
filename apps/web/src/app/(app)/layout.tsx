import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Sidebar } from './_components/sidebar'
import { TopBar } from './_components/top-bar'

// (app) route group — protected, in-business-hours pages.
// Middleware already gates auth + business hours, but we double-check here
// to render guarded content correctly.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session === null) redirect('/login')
  if (session.userId === undefined) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-[#080B12] text-[#ECE6D4]">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
