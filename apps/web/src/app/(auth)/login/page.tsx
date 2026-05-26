import { signIn } from '@/auth'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#080B12] text-[#ECE6D4]">
      <h1 className="text-4xl tracking-[0.3em] font-light mb-4">迷羊苑</h1>
      <p className="text-sm text-[#9A9484] tracking-widest mb-12 leading-loose text-center">
        眠れぬ夜、ひとりではない、と。
        <br />
        言葉だけで、確かめあう場所。
      </p>
      <form
        action={async () => {
          'use server'
          await signIn('google', { redirectTo: '/onboarding' })
        }}
      >
        <button
          type="submit"
          className="px-10 py-3 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm hover:bg-[#161B27] transition-colors"
        >
          暖簾をくぐる
        </button>
      </form>
      <p className="mt-8 text-xs text-[#5E5A4F] tracking-widest">
        Google でご来店
      </p>
    </main>
  )
}
