import { redirect } from 'next/navigation'
import { isOpen } from '@me-me-en/domain'
import { ClosedCountdown } from './closed-countdown'

export default function ClosedPage() {
  // Defensive: if a request slips past the middleware while open, send home.
  if (isOpen(new Date())) {
    redirect('/chats')
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#080B12] text-[#ECE6D4]">
      <p className="text-base text-[#9A9484] tracking-[0.4em] mb-6">ただ今、準備中</p>
      <h1 className="text-7xl tracking-[0.32em] font-light leading-none">閉 店</h1>
      <div className="mt-12 text-sm text-[#D8D2C0] tracking-[0.18em] leading-loose text-center font-light">
        日が沈む頃、暖簾を出します。
        <br />
        月の昇る刻、またここでお会いしましょう。
      </div>
      <ClosedCountdown />
      <p className="mt-16 text-[10px] text-[#5E5A4F] tracking-[0.3em]">
        営業 二十二時 — 翌五時
      </p>
    </main>
  )
}
