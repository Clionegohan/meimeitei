import type { Metadata } from 'next'
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from 'next/font/google'
import './globals.css'

// design HTML (docs/design/extracted-shared.jsx) の指定:
//   W_FONT     = 'Zen Kaku Gothic New', 'Noto Sans JP', system-ui, sans-serif
//   W_FONT_MIN = 'Shippori Mincho', 'Noto Serif JP', serif
//
// 見出し / 装飾 / 短いコピーには明朝、本文 / bubble / bio にはゴシック。
const gothic = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-gothic',
  display: 'swap',
})

const mincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mincho',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '迷羊苑',
  description: '眠れぬ夜、ひとりではない、と。言葉だけで、確かめあう場所。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${gothic.variable} ${mincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
