// ユーザーセッション管理ユーティリティ
// localStorage経由でuserIdを永続化し、ブラウザリロード後もセッションを維持

const USER_ID_KEY = 'meimei_userId'

/**
 * UUID v4形式のユーザーIDを生成
 *
 * Why: ブラウザ環境でユニークなIDを生成する必要がある
 * Why crypto.randomUUID(): 暗号学的に安全なランダムIDを生成できる標準API
 */
export function generateUserId(): string {
  return crypto.randomUUID()
}

/**
 * userIdをlocalStorageに保存
 *
 * Why: ブラウザリロード後もセッションを維持するため
 * Why localStorage: セッション情報を永続化する最もシンプルな方法
 */
export function saveUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

/**
 * localStorageからuserIdを取得
 *
 * @returns userId（存在しない場合はnull）
 */
export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

/**
 * localStorageからuserIdを削除
 *
 * Why: テスト時や明示的なログアウト時に使用
 */
export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY)
}

/**
 * 既存のuserIdを取得、なければ新規生成して保存
 *
 * Why: 初回訪問時は新規ID生成、再訪時は既存ID再利用
 *
 * @returns userId（既存または新規生成）
 */
export function getOrCreateUserId(): string {
  const existingId = getUserId()
  if (existingId) return existingId

  const newId = generateUserId()
  saveUserId(newId)
  return newId
}
