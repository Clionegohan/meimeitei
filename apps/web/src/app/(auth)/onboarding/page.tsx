import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const session = await auth()
  if (session === null) redirect('/login')
  if (session.userId !== undefined) redirect('/chats')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#080B12] text-[#ECE6D4]">
      <h1 className="text-3xl tracking-[0.3em] font-light mb-3">ご記帳</h1>
      <p className="text-sm text-[#9A9484] tracking-widest mb-10 leading-loose text-center">
        どうお呼びすればよろしいでしょうか。
      </p>
      <OnboardingForm />
    </main>
  )
}
