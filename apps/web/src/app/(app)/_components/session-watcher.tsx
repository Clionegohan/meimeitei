'use client'

import { useEffect } from 'react'
import { getSocket } from '@/lib/socket-client'

// spec B: 05:00 JST 閉店時、server から server:closed を受け取って閉店中画面へ遷移する。
// (app) layout に常駐させ、どのページを開いていても閉店の瞬間に蹴られるようにする。
// 描画は持たない (null)。socket は singleton なので timeline / thread と接続を共有する。
export function SessionWatcher({ userId }: { userId: string }) {
  useEffect(() => {
    const socket = getSocket(userId)
    const onClosed = (): void => {
      // 全 navigation を伴うリロード。middleware が営業時間外を見て /closed を確定させる。
      window.location.href = '/closed'
    }
    socket.on('server:closed', onClosed)
    return () => {
      socket.off('server:closed', onClosed)
    }
  }, [userId])

  return null
}
