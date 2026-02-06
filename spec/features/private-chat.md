# Feature: Private Chat

---
feature: private-chat
status: :TODO
priority: medium
dependencies: [user-session-management]
created: 2026-02-06
updated: 2026-02-06
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | ユーザー間の1対1プライベートチャット |
| 目的 | カウンターやタイムラインとは別に、特定のユーザーと個別に会話できる場を提供 |
| 対象ユーザー | 入店済みの全ユーザー |
| スコープ | 1対1チャット送受信、履歴表示。DB不要（メモリ内）。グループチャットは対象外。 |

## 2. Acceptance Criteria

**AC-1: ユーザーを選択して個人チャットを開始できる**
- Given: ユーザーが店内にいて、他のユーザーが参加者リストに表示されている
- When: 参加者リストから特定のユーザーを選択する
- Then: そのユーザーとの個人チャットウィンドウが開く
- 検証方法: E2E - チャットウィンドウ表示確認

**AC-2: 個人チャットでメッセージを送受信できる**
- Given: ユーザーAとユーザーBが個人チャット中
- When: ユーザーAがメッセージを送信
- Then: ユーザーBの画面にメッセージが表示される
- 検証方法: E2E - 2ブラウザ間のメッセージ送受信確認

**AC-3: リロード後も個人チャット履歴が復元される**
- Given: ユーザーAとユーザーBが個人チャットで会話している
- When: ユーザーAがブラウザをリロード
- Then: 過去の個人チャット履歴が復元される
- 検証方法: E2E - リロード後の履歴確認

**AC-4: 複数の個人チャットを同時に管理できる**
- Given: ユーザーAがユーザーB、ユーザーCと個人チャット中
- When: チャット相手を切り替える
- Then: 各相手ごとの会話履歴が正しく表示される
- 検証方法: E2E - 複数チャット切り替え確認

**AC-5: 相手がオフラインでもメッセージが保持される**
- Given: ユーザーAがユーザーBにメッセージを送信
- When: ユーザーBが接続していない（または一時的に切断）
- Then: ユーザーBが再接続時にメッセージを受信する
- 検証方法: Integration - オフライン時のメッセージ保持確認

## 3. User Story

```
As a ユーザー
I want to 特定のユーザーと個別に会話したい
So that カウンターやタイムラインを邪魔せず、プライベートな会話を楽しめる
```

**メインシナリオ:**

1. ユーザーAが参加者リストからユーザーBを選択
2. 個人チャットウィンドウが開く
3. ユーザーAがメッセージを入力・送信
4. WebSocketでサーバーに送信（private_chat_sendイベント）
5. サーバーが宛先ユーザーBに配信（private_chat_messageイベント）
6. ユーザーBの画面にメッセージが表示される
7. サーバーがメモリに保存（userId1-userId2ペアでキー）

**代替シナリオ:**

- 5a. ユーザーBがオフラインの場合: サーバーがメッセージを保持、再接続時に送信

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | React 19 | 個人チャットUI | `apps/frontend/src/components/PrivateChat.tsx` |
| Frontend | Zustand | 個人チャット状態管理 | `apps/frontend/src/stores/usePrivateChatStore.ts` |
| Frontend | WebSocket | メッセージ送受信 | `apps/frontend/src/ws/client.ts` |
| Backend | Map<chatKey, Message[]> | 個人チャット保存 | `apps/backend/src/store.ts` |
| Backend | WebSocket | 1対1配信 | `apps/backend/src/ws-handler.ts` |
| Shared | Zod | メッセージスキーマ | `packages/shared/src/events.ts` |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| `apps/frontend/src/app/bar/page.tsx` | PrivateChatコンポーネント追加 |
| `apps/frontend/src/components/ParticipantsList.tsx` | ユーザークリックでチャット開始 |
| `apps/backend/src/store.ts` | privateChats Map追加 |
| `apps/backend/src/ws-handler.ts` | private_chat_sendハンドラ追加 |
| `packages/shared/src/events.ts` | PrivateChatSendEvent, PrivateChatMessageEvent追加 |

## 5. Data Model

**Entity: PrivateChatMessage**

```typescript
interface PrivateChatMessage {
  id: string           // UUID v4
  senderId: string     // 送信者ID
  receiverId: string   // 受信者ID
  senderName: string   // 送信者名
  text: string         // メッセージ内容
  timestamp: number    // 送信時刻
  delivered: boolean   // 配信済みフラグ
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string (UUID) | Yes | - | メッセージ一意識別子 |
| senderId | string | Yes | - | 送信者ユーザーID |
| receiverId | string | Yes | - | 受信者ユーザーID |
| senderName | string | Yes | - | 送信者表示名 |
| text | string | Yes | - | メッセージ内容（1-500文字） |
| timestamp | number | Yes | - | 送信時刻 |
| delivered | boolean | Yes | false | 相手に配信済みか |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| text | 1-500文字 | Text must be 1-500 characters |
| receiverId | 存在するユーザーID | Receiver not found |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | ユーザー | メッセージ送信時 | WebSocket private_chat_send | Zod validation |
| Read | ユーザー | チャット開封時、リロード時 | WebSocket history_sync | なし |
| Update | システム | 配信完了時 | delivered フラグ更新 | なし |
| Delete | システム | 閉店時（04:00） | privateChats.clear() | なし |

**Relationships:**

```
UserSession ──1:N──> PrivateChatMessage (as sender)
UserSession ──1:N──> PrivateChatMessage (as receiver)

PrivateChatMessage は chatKey でグループ化:
  chatKey = sorted([userId1, userId2]).join('-')
```

**Chat Key生成:**

```typescript
function getChatKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-')
}

// 例
getChatKey('alice', 'bob')  // => 'alice-bob'
getChatKey('bob', 'alice')  // => 'alice-bob' (同じキー)
```

## 6. API Design

**WebSocket Event: private_chat_send**

```yaml
description: 個人チャットでメッセージを送信
direction: Client → Server
```

Request:
```typescript
{
  type: 'private_chat_send',
  receiverId: string,  // 宛先ユーザーID
  text: string         // 1-500文字
}
```

Response (Success - to receiver):
```typescript
{
  type: 'private_chat_message',
  message: {
    id: string,
    senderId: string,
    receiverId: string,
    senderName: string,
    text: string,
    timestamp: number
  }
}
```

Response (Echo - to sender):
```typescript
{
  type: 'private_chat_sent',
  message: {
    id: string,
    senderId: string,
    receiverId: string,
    senderName: string,
    text: string,
    timestamp: number
  }
}
```

Response (Error):
```typescript
{
  type: 'error',
  code: 'RECEIVER_NOT_FOUND' | 'INVALID_TEXT',
  message: string
}
```

**WebSocket Event: history_sync (拡張)**

```yaml
description: リロード時の履歴同期（個人チャット含む）
direction: Server → Client
```

Response:
```typescript
{
  type: 'history_sync',
  timeline: Message[],
  counterChats: Message[],
  privateChats: {
    [partnerId: string]: PrivateChatMessage[]
  }
}
```

## 7. Processing Flow

**詳細フロー:**

```
1. メッセージ送信
   │
   ├─ Validation (Client)
   │   ├─ receiverId が有効
   │   ├─ text.trim().length >= 1
   │   ├─ text.length <= 500
   │   └─ Invalid → Show error
   │
   ├─ Send WebSocket event
   │   └─ { type: 'private_chat_send', receiverId, text }
   │
   ├─ Server処理
   │   ├─ Zod validation
   │   ├─ Check receiver exists
   │   │   └─ Not found → Error
   │   │
   │   ├─ Create PrivateChatMessage
   │   │   ├─ id: randomUUID()
   │   │   ├─ senderId: from session
   │   │   ├─ receiverId: from event
   │   │   ├─ senderName: from session
   │   │   ├─ text: from event
   │   │   ├─ timestamp: Date.now()
   │   │   └─ delivered: false
   │   │
   │   ├─ Get chatKey
   │   │   └─ chatKey = getChatKey(senderId, receiverId)
   │   │
   │   ├─ Save to privateChats Map
   │   │   └─ privateChats.get(chatKey).push(message)
   │   │
   │   ├─ Send to receiver (if online)
   │   │   ├─ Find receiver's WebSocket
   │   │   └─ Send private_chat_message
   │   │   └─ Set delivered = true
   │   │
   │   └─ Echo to sender
   │       └─ Send private_chat_sent
   │
   └─ Client受信
       ├─ Add to Zustand store
       └─ UI更新

2. リロード時の復元
   │
   ├─ history_sync受信
   │
   ├─ privateChats オブジェクト取得
   │   └─ { [partnerId]: Message[] }
   │
   └─ 各チャット相手の履歴を復元

3. オフライン時の配信
   │
   ├─ Receiver がオフライン
   │
   ├─ メッセージを privateChats に保存
   │   └─ delivered = false
   │
   ├─ Receiver が再接続
   │
   └─ history_sync で未配信メッセージを送信
       └─ delivered = true に更新
```

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | receiverId が存在しない | エラー返却、送信拒否 |
| BR-2 | text が1-500文字 | 送信許可 |
| BR-3 | 相手がオンライン | 即座に配信、delivered=true |
| BR-4 | 相手がオフライン | 保存のみ、delivered=false |
| BR-5 | 閉店時刻（04:00） | privateChats.clear() |

## 8. UI Requirements

**画面: 店内画面（/bar）**

```yaml
route: /bar
layout: BarLayout
```

**コンポーネント構成:**

```
BarPage
├── BarScene (3D空間)
├── SidePanel
│   ├── Timeline
│   ├── CounterChat
│   └── ParticipantsList ← クリックでチャット開始
└── PrivateChatPanel ← 新規追加
    ├── ChatTabs (複数チャット切り替え)
    └── PrivateChatWindow
        ├── MessageList
        └── MessageForm
```

**個人チャットUI:**

```yaml
位置: 右サイドパネル（モーダルまたはポップアップ）
表示:
  - 複数チャット同時表示（タブ切り替え）
  - 相手の名前表示
  - メッセージ履歴（スクロール可能）
  - 送信フォーム

機能:
  - チャット開始（参加者リストからユーザー選択）
  - チャット閉じる（タブ閉じボタン）
  - 未読バッジ（新規メッセージ通知）
```

**状態遷移:**

```
[Closed] ──ユーザー選択──> [Open]
[Open] ──メッセージ入力──> [Typing]
[Typing] ──送信──> [Sending]
[Sending] ──成功──> [Sent] ──> [Open]
[Open] ──閉じる──> [Closed]
```

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| 自分自身にメッセージ | receiverId === senderId | エラー: 「自分自身には送信できません」 |
| 存在しないユーザー | receiverId が無効 | エラー: 「ユーザーが見つかりません」 |
| 相手が退店 | 送信中に相手が切断 | メッセージ保存、再接続時に配信 |
| 同時メッセージ | A→B、B→A を同時送信 | 両方正常配信 |
| 複数タブ | 同じユーザーが複数タブ | 全タブに同期（BroadcastChannel検討） |

**Error Handling Matrix:**

| Error Type | Condition | Error Code | User Message | Recovery Action |
|------------|-----------|------------|--------------|-----------------|
| Receiver Not Found | 無効なreceiverId | RECEIVER_NOT_FOUND | ユーザーが見つかりません | チャット閉じる |
| Self Message | receiverId === senderId | SELF_MESSAGE | 自分自身には送信できません | 送信拒否 |
| Validation Error | 空文字または500文字超 | INVALID_TEXT | 1-500文字で入力してください | フォーム再入力 |
| WebSocket Error | 接続切断 | WS_ERROR | 接続が切れています | 自動再接続 |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E)
   ├── AC-1: 個人チャット開始 → RED確認
   ├── AC-2: メッセージ送受信 → RED確認
   ├── AC-3: リロード後の履歴復元 → RED確認
   ├── AC-4: 複数チャット管理 → RED確認
   └── AC-5: オフライン時の保持 → RED確認

2. Integration Test
   ├── WebSocket private_chat_send イベント → RED確認
   ├── history_sync（個人チャット含む） → RED確認
   └── オフライン配信ロジック → RED確認

3. Unit Test
   ├── chatKey生成ロジック → RED確認
   ├── Zustand store操作 → RED確認
   └── バリデーションロジック → RED確認

4. Implementation (GREEN)
   ├── Frontend: PrivateChat.tsx, usePrivateChatStore.ts
   ├── Backend: privateChats Map、private_chat_sendハンドラ
   └── Shared: PrivateChatSendEvent, PrivateChatMessageEvent

5. Refactor (IMPROVE)
   ├── UI/UXブラッシュアップ
   ├── 未読バッジ機能
   └── カバレッジ確認 (80%+)
```

**テストファイル:**

| Test Type | File Path | Priority | Status |
|-----------|-----------|----------|--------|
| E2E | `e2e/tests/private-chat.spec.ts` | 1 | ⚪️ TODO |
| Integration | `apps/backend/tests/integration/private-chat.integration.test.ts` | 2 | ⚪️ TODO |
| Unit | `apps/frontend/src/stores/__tests__/usePrivateChatStore.test.ts` | 3 | ⚪️ TODO |
| Unit | `apps/backend/src/__tests__/chat-key.test.ts` | 3 | ⚪️ TODO |

---

## Implementation Notes

### メモリ使用量試算

```yaml
前提:
  営業時間: 6時間
  参加者: 100人
  個人チャットペア: 50組（100人 × 50%）
  メッセージ: 平均20件/ペア
  文字数: 平均200文字

計算:
  50ペア × 20件 × 200文字 = 200,000文字
  約200KB

上限設定:
  最大100件/ペア保持
  50ペア × 100件 × 500文字 = 2,500,000文字
  約2.5MB

結論: 問題なし
```

### chatKey設計の理由

```typescript
// NG: 方向性を持つキー
'alice-bob' と 'bob-alice' が別のキーになってしまう

// OK: ソートして一意なキー
getChatKey('alice', 'bob')  // => 'alice-bob'
getChatKey('bob', 'alice')  // => 'alice-bob' (同じキー)
```

### Next Steps

1. F006（User Session Management）の実装後に実装
2. F007（Timeline）と並行開発可能
3. UI/UXデザイン詳細化（モーダルorサイドパネル）
4. 未読バッジ機能の詳細設計
