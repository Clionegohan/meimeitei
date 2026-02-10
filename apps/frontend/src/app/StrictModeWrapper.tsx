'use client'

import React from 'react'

interface StrictModeWrapperProps {
  children: React.ReactNode
}

export function StrictModeWrapper({ children }: StrictModeWrapperProps) {
  // E2Eテスト時はStrictModeを無効化
  // 理由: StrictModeのuseEffect二重実行がWebSocket切断→ユーザー削除を引き起こす
  // 本番環境ではStrictModeは機能しないため、E2Eテストも本番に近い環境で実行
  const disableStrictMode = process.env.NEXT_PUBLIC_DISABLE_STRICT_MODE === 'true'

  if (disableStrictMode) {
    return <>{children}</>
  }

  return <React.StrictMode>{children}</React.StrictMode>
}
