import type { Metadata } from 'next'
import './globals.css'
import { StrictModeWrapper } from './StrictModeWrapper'

export const metadata: Metadata = {
  title: 'めぃめぃ亭',
  description: '深夜限定バーチャルバー',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <StrictModeWrapper>{children}</StrictModeWrapper>
      </body>
    </html>
  )
}
