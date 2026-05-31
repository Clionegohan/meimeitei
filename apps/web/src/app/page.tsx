import { redirect } from 'next/navigation'

// "/" は実画面を持たない。認証・営業時間の gate は middleware が担うため、
// ここでは home (手紙 = /chats) へ送るだけ。
export default function RootPage() {
  redirect('/chats')
}
