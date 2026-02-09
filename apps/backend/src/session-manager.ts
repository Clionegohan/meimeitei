import type { WebSocket } from 'ws'

// ユーザーセッション情報
// Why: WebSocket接続・メッセージ履歴を管理するために必要
export interface UserSession {
  userId: string // クライアント生成のUUID
  name: string // ユーザー表示名
  socketId: string // 現在のWebSocket接続ID（再接続時に更新）
  connectedAt: number // セッション作成日時
  lastActivityAt: number // 最終アクティビティ日時
  ws: WebSocket // 現在のWebSocket接続
  messages: Array<{
    // セッション内のメッセージ履歴（営業時間内のみ保持）
    userId: string
    name: string
    text: string
    timestamp: number
  }>
}

/**
 * セッション管理クラス
 *
 * Why: ブラウザリロード時にチャット履歴を復元するため
 * Why メモリ内Map: 営業時間内（6時間）のみ保持、閉店時にクリアするため
 * Why シングルトン: アプリケーション全体で1つのセッション管理インスタンスを共有
 */
class SessionManager {
  // Why Map: O(1)でユーザー検索可能、userId（UUID）をキーとして使用
  private sessions = new Map<string, UserSession>()

  /**
   * 新規セッション作成
   *
   * @param userId クライアント生成のUUID
   * @param name ユーザー表示名
   * @param ws WebSocket接続
   * @returns 作成されたセッション
   *
   * Why: 初回接続時にセッションを作成
   */
  createSession(userId: string, name: string, ws: WebSocket): UserSession {
    const session: UserSession = {
      userId,
      name,
      socketId: this.generateSocketId(),
      connectedAt: Date.now(),
      lastActivityAt: Date.now(),
      ws,
      messages: [],
    }
    this.sessions.set(userId, session)
    return session
  }

  /**
   * セッション取得
   *
   * @param userId ユーザーID
   * @returns セッション（存在しない場合はundefined）
   */
  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId)
  }

  /**
   * 既存セッションのWebSocket接続を更新（再接続時）
   *
   * @param userId ユーザーID
   * @param ws 新しいWebSocket接続
   *
   * Why: ブラウザリロード時に新しいWebSocket接続で既存セッションを再利用
   */
  updateSession(userId: string, ws: WebSocket): void {
    const session = this.sessions.get(userId)
    if (session) {
      session.ws = ws
      session.socketId = this.generateSocketId() // 新しい接続IDを生成
      session.lastActivityAt = Date.now()
    }
  }

  /**
   * セッションにメッセージを追加
   *
   * @param userId ユーザーID
   * @param message メッセージデータ
   *
   * Why: リロード後にチャット履歴を復元するため
   */
  addMessage(
    userId: string,
    message: { userId: string; name: string; text: string; timestamp: number }
  ): void {
    const session = this.sessions.get(userId)
    if (session) {
      session.messages.push(message)
    }
  }

  /**
   * セッション削除
   *
   * @param userId ユーザーID
   *
   * Why: 明示的なログアウトや不正なセッション削除時に使用
   */
  deleteSession(userId: string): void {
    this.sessions.delete(userId)
  }

  /**
   * 全セッションをクリア
   *
   * Why: 閉店時（04:00 JST）に全セッションをクリアするため
   */
  clearAllSessions(): void {
    this.sessions.clear()
  }

  /**
   * ランダムなソケットIDを生成
   *
   * Why: 同一ユーザーの複数接続を区別するため（デバッグ用）
   * Why Math.random(): セキュリティ要件なし、簡易的な識別子で十分
   *
   * @returns ランダムな6文字の文字列
   */
  private generateSocketId(): string {
    return Math.random().toString(36).substring(7)
  }
}

// シングルトンインスタンスをエクスポート
// Why: アプリケーション全体で1つのセッション管理インスタンスを共有
export const sessionManager = new SessionManager()
