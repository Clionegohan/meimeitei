# Feature: User Session Management

---
feature: user-session-management
status: :TODO
priority: high
dependencies: [business-hours, user-entrance]
created: 2026-02-06
updated: 2026-02-06
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | ユーザーのセッション管理とブラウザリロード時の状態復元 |
| 目的 | リロードしても同一ユーザーとして認識し、チャット履歴を維持する |
| 対象ユーザー | 全入店ユーザー |
| スコープ | userId生成・保存、セッション管理、履歴復元。DB不要（メモリ＋localStorage） |

## 2. Acceptance Criteria

**AC-1: 初回訪問時にuserIdを生成・保存**
- Given: ユーザーが初めて入店する
- When: 名前を入力して入店ボタンをクリック
- Then: userIdが生成され、localStorageに保存される
- 検証方法: Unit - localStorage確認

**AC-2: リロード時に同一ユーザーとして認識**
- Given: ユーザーが入店済みでlocalStorageにuserIdが保存されている
- When: ブラウザをリロードする
- Then: 同じuserIdで再接続され、過去のチャット履歴が復元される
- 検証方法: E2E - リロード後の履歴確認

**AC-3: localStorage削除後は新規ユーザーとして扱う**
- Given: localStorageをクリアする
- When: 再度入店する
- Then: 新しいuserIdが生成される
- 検証方法: Unit - localStorage確認

**AC-4: 閉店後は全セッションをクリア**
- Given: 営業時間が終了（04:00 JST）
- When: 閉店処理が実行される
- Then: サーバー側のセッションがすべてクリアされる
- 検証方法: Integration - メモリ状態確認

## 3. User Story

```
As a 常連ユーザー
I want to ブラウザをリロードしても会話を継続したい
So that 誤ってリロードしてもチャットが消えない安心感を得られる
```

**メインシナリオ:**

1. ユーザーAが初回入店時にuserIdが自動生成される
2. システムがlocalStorageにuserIdを保存する
3. ユーザーAがチャットを楽しむ
4. ユーザーAが誤ってブラウザをリロードする
5. システムがlocalStorageからuserIdを読み取る
6. WebSocket再接続時にuserIdを送信
7. サーバーが過去のセッションを識別
8. 過去のチャット履歴を送信
9. ユーザーAのチャット画面が復元される

**代替シナリオ:**

- 7a. サーバー再起動でセッションが消失している場合: 新規セッションとして扱う（エラーなし）

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | localStorage | userId永続化 | `apps/frontend/src/lib/session.ts` |
| Frontend | WebSocket | userId送信・履歴受信 | `apps/frontend/src/ws/client.ts` |
| Backend | Map<userId, Session> | セッション管理（メモリ内） | `apps/backend/src/session-manager.ts` |
| Shared | Zod | セッションイベントスキーマ | `packages/shared/src/events.ts` |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| `apps/frontend/src/app/enter/page.tsx` | userId生成・保存ロジック追加 |
| `apps/frontend/src/ws/client.ts` | 接続時にauthenticateイベント送信 |
| `apps/backend/src/ws-handler.ts` | authenticateイベントハンドラ追加 |
| `apps/backend/src/store.ts` | セッション管理Map追加 |
| `packages/shared/src/events.ts` | AuthenticateEvent, HistorySyncEvent追加 |

## 5. Data Model

**Entity: UserSession**

```typescript
interface UserSession {
  userId: string         // UUID v4
  name: string          // 表示名
  socketId: string      // WebSocket接続ID
  connectedAt: number   // 接続時刻（timestamp）
  lastActivityAt: number // 最終アクティビティ時刻
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| userId | string (UUID) | Yes | - | ユーザー一意識別子 |
| name | string | Yes | - | 表示名（1-20文字） |
| socketId | string | Yes | - | WebSocket接続ID |
| connectedAt | number | Yes | - | 接続時刻 |
| lastActivityAt | number | Yes | - | 最終アクティビティ時刻 |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| userId | UUID v4 format | Invalid userId format |
| name | 1-20文字 | Name must be 1-20 characters |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | システム | 初回入店時 | crypto.randomUUID() | なし |
| Read | フロントエンド | ページ読み込み時 | localStorage.getItem() | なし |
| Update | システム | アクティビティ発生時 | lastActivityAt更新 | なし |
| Delete | システム | 閉店時（04:00） | sessions.clear() | なし |

**Relationships:**

```
UserSession ──1:N──> Message (タイムライン)
UserSession ──1:N──> PrivateChat
UserSession ──1:1──> WebSocketConnection
```

## 6. API Design

**WebSocket Event: authenticate**

```yaml
description: ユーザー認証とセッション確立
direction: Client → Server
```

Request:
```typescript
{
  type: 'authenticate',
  userId: string,      // localStorage から取得
  name: string         // 表示名
}
```

Response (Success):
```typescript
{
  type: 'authenticated',
  userId: string,
  session: {
    connectedAt: number,
    serverTime: number
  }
}
```

**WebSocket Event: history_sync**

```yaml
description: リロード時の履歴同期
direction: Server → Client
```

Response:
```typescript
{
  type: 'history_sync',
  timeline: Message[],
  counterChats: Message[],
  privateChats: {
    [partnerId: string]: Message[]
  }
}
```

## 7. Processing Flow

**詳細フロー:**

```
1. 初回入店時
   │
   ├─ Generate userId (crypto.randomUUID())
   │
   ├─ Save to localStorage
   │   └─ key: 'meimei_userId'
   │
   └─ WebSocket接続
       └─ Send authenticate event

2. リロード時
   │
   ├─ Read userId from localStorage
   │   ├─ Found → Use existing userId
   │   └─ Not Found → Generate new userId
   │
   ├─ WebSocket接続
   │   └─ Send authenticate event with userId
   │
   └─ Server処理
       ├─ Check sessions.has(userId)
       │   ├─ Found → Update socketId
       │   └─ Not Found → Create new session
       │
       └─ Send history_sync event
           ├─ Timeline messages
           ├─ Counter chat messages
           └─ Private chat messages

3. 閉店時（04:00 JST）
   │
   ├─ Clear all sessions
   │   └─ sessions.clear()
   │
   ├─ Clear all messages
   │   ├─ timeline = []
   │   ├─ counterChats = []
   │   └─ privateChats.clear()
   │
   └─ Disconnect all WebSockets
```

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | userId が localStorage にない | 新規UUID生成 |
| BR-2 | WebSocket切断 | lastActivityAt 更新、socketId をnullに |
| BR-3 | 閉店時刻（04:00） | 全セッションクリア |
| BR-4 | 非アクティブ30分 | セッション削除（オプション） |

## 8. UI Requirements

**画面: 入店画面（/enter）**

```yaml
route: /enter
layout: FullScreen
auth: none
```

**変更点:**

- userId生成・保存ロジック追加
- WebSocket接続時にauthenticateイベント送信

**画面: 店内画面（/bar）**

```yaml
route: /bar
layout: BarLayout
auth: required (userId必須)
```

**変更点:**

- 履歴復元処理追加
- history_syncイベントハンドラ追加

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| localStorage無効 | ブラウザ設定でlocalStorage無効 | 毎回新規userIdを生成（セッション間で維持不可） |
| userId衝突 | 極めて稀なUUID衝突 | サーバー側でチェック、新規ID再生成 |
| WebSocket切断 | ネットワーク不安定 | 自動再接続、同じuserIdで認証 |
| サーバー再起動 | デプロイ・クラッシュ | 全セッション消失、新規セッションとして再接続 |
| 複数タブ | 同じブラウザで複数タブ開く | 同じuserIdを共有（1つのセッション） |

**Error Handling Matrix:**

| Error Type | Condition | Error Code | User Message | Recovery Action |
|------------|-----------|------------|--------------|-----------------|
| Authentication Failed | 無効なuserId | AUTH_FAILED | 再接続しています | 新規userId生成 |
| Session Expired | サーバー再起動 | SESSION_EXPIRED | セッションが失われました | 新規セッション作成 |
| WebSocket Error | 接続失敗 | WS_ERROR | 接続できません | 自動リトライ |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E)
   ├── AC-1: 初回訪問時のuserId生成 → RED確認
   ├── AC-2: リロード時の履歴復元 → RED確認
   └── AC-3: localStorage削除後の動作 → RED確認

2. Integration Test
   ├── WebSocket authenticate イベント → RED確認
   └── history_sync イベント → RED確認

3. Unit Test
   ├── userId生成ロジック → RED確認
   ├── localStorage保存・読み込み → RED確認
   └── セッション管理Map操作 → RED確認

4. Implementation (GREEN)
   ├── Frontend: session.ts, client.ts
   ├── Backend: session-manager.ts, ws-handler.ts
   └── Shared: events.ts (AuthenticateEvent, HistorySyncEvent)

5. Refactor (IMPROVE)
   ├── エラーハンドリング強化
   ├── 自動再接続ロジック
   └── カバレッジ確認 (80%+)
```

**テストファイル:**

| Test Type | File Path | Priority | Status |
|-----------|-----------|----------|--------|
| E2E | `e2e/tests/user-session.spec.ts` | 1 | ⚪️ TODO |
| Integration | `apps/backend/tests/integration/session.integration.test.ts` | 2 | ⚪️ TODO |
| Unit | `apps/frontend/src/lib/__tests__/session.test.ts` | 3 | ⚪️ TODO |
| Unit | `apps/backend/src/__tests__/session-manager.test.ts` | 3 | ⚪️ TODO |

---

## Implementation Notes

### DB不要の理由

- メモリ内Map（sessions）で管理
- localStorage（クライアント側）でuserId永続化
- 営業時間内（6時間）のみ保持
- 閉店時にクリア

### メモリ使用量試算

```yaml
前提:
  同時接続: 100人
  Session情報: 約1KB/人

計算:
  100人 × 1KB = 100KB

結論: 問題なし
```

### Next Steps

1. F007（Timeline）、F008（Private Chat）の前提条件
2. この機能がないとリロード時にチャットが消える
3. 優先度: High（他機能の基盤）

### 技術的検討事項

- [ ] UUID v4 の衝突確率（実質ゼロだが、念のためチェックロジック）
- [ ] localStorage容量制限（通常5MB、userIdは十分小さい）
- [ ] WebSocket再接続戦略（exponential backoff）
- [ ] 複数タブ対応（BroadcastChannel API検討）
