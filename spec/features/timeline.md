# Feature: Timeline

---
feature: timeline
status: :TODO
priority: medium
dependencies: [user-session-management]
created: 2026-02-06
updated: 2026-02-06
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | 全ユーザーが閲覧できるタイムライン（呟き機能） |
| 目的 | カウンターチャットとは別に、独り言や短い呟きを投稿できる場所を提供 |
| 対象ユーザー | 入店済みの全ユーザー |
| スコープ | タイムライン表示・投稿。カウンターチャットとは独立。DB不要（メモリ内） |

## 2. Acceptance Criteria

**AC-1: タイムラインに呟きを投稿できる**
- Given: ユーザーが店内にいる
- When: タイムライン投稿フォームにテキストを入力して投稿ボタンをクリック
- Then: 呟きがタイムラインに表示される
- 検証方法: E2E - 投稿後の表示確認

**AC-2: 他のユーザーの呟きが表示される**
- Given: 他のユーザーが呟きを投稿した
- When: タイムラインを見る
- Then: 全ユーザーの呟きが時系列順に表示される
- 検証方法: E2E - 複数ユーザーの投稿確認

**AC-3: リロード後も過去の呟きが表示される**
- Given: 複数の呟きが投稿されている
- When: ブラウザをリロードする
- Then: 過去の呟き（最新50件）が復元される
- 検証方法: E2E - リロード後の表示確認

**AC-4: 文字数制限（最大500文字）**
- Given: ユーザーが投稿フォームに入力する
- When: 500文字を超える文字列を入力
- Then: 投稿ボタンが無効化される、またはエラーメッセージが表示される
- 検証方法: Unit - バリデーション確認

## 3. User Story

```
As a ユーザー
I want to 気軽に呟きたい
So that カウンターの会話を邪魔せずに独り言や短い感想を共有できる
```

**メインシナリオ:**

1. ユーザーがタイムライン投稿フォームを開く
2. テキストを入力（最大500文字）
3. 投稿ボタンをクリック
4. WebSocketでサーバーに送信
5. サーバーがタイムラインに追加
6. 全ユーザーにブロードキャスト
7. 全員のタイムライン画面に表示される

**代替シナリオ:**

- 3a. 500文字超過の場合: エラーメッセージ表示、投稿不可

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | React 19 | タイムラインUI | `apps/frontend/src/components/Timeline.tsx` |
| Frontend | Zustand | タイムライン状態管理 | `apps/frontend/src/stores/useTimelineStore.ts` |
| Frontend | WebSocket | 投稿送信・受信 | `apps/frontend/src/ws/client.ts` |
| Backend | Map/Array | タイムライン保存（メモリ内） | `apps/backend/src/store.ts` |
| Backend | WebSocket | ブロードキャスト | `apps/backend/src/ws-handler.ts` |
| Shared | Zod | メッセージスキーマ | `packages/shared/src/events.ts` |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| `apps/frontend/src/app/bar/page.tsx` | Timelineコンポーネント追加 |
| `apps/backend/src/store.ts` | timeline配列追加 |
| `apps/backend/src/ws-handler.ts` | timeline_postイベントハンドラ追加 |
| `packages/shared/src/events.ts` | TimelinePostEvent, TimelineMessageEvent追加 |

## 5. Data Model

**Entity: TimelineMessage**

```typescript
interface TimelineMessage {
  id: string           // UUID v4
  userId: string       // 投稿者ID
  name: string         // 投稿者名
  text: string         // 呟き内容
  timestamp: number    // 投稿時刻
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string (UUID) | Yes | - | メッセージ一意識別子 |
| userId | string | Yes | - | 投稿者ユーザーID |
| name | string | Yes | - | 投稿者表示名 |
| text | string | Yes | - | 呟き内容（1-500文字） |
| timestamp | number | Yes | - | 投稿時刻（Unix timestamp） |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| text | 1-500文字 | Text must be 1-500 characters |
| text | trim()後に空でない | Text cannot be empty |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | ユーザー | 投稿ボタンクリック時 | WebSocket timeline_post | Zod validation |
| Read | ユーザー | タイムライン表示時 | WebSocket history_sync | なし |
| Update | N/A | N/A | 編集機能なし | N/A |
| Delete | N/A | N/A | 削除機能なし（MVP） | N/A |

**Relationships:**

```
UserSession ──1:N──> TimelineMessage
```

## 6. API Design

**WebSocket Event: timeline_post**

```yaml
description: タイムラインに呟きを投稿
direction: Client → Server
```

Request:
```typescript
{
  type: 'timeline_post',
  text: string  // 1-500文字
}
```

Response (Success - Broadcast to all):
```typescript
{
  type: 'timeline_message',
  message: {
    id: string,
    userId: string,
    name: string,
    text: string,
    timestamp: number
  }
}
```

Response (Error):
```typescript
{
  type: 'error',
  code: 'INVALID_TEXT',
  message: 'Text must be 1-500 characters'
}
```

**WebSocket Event: history_sync (拡張)**

```yaml
description: リロード時の履歴同期（タイムライン含む）
direction: Server → Client
```

Response:
```typescript
{
  type: 'history_sync',
  timeline: TimelineMessage[],  // 最新50件
  counterChats: Message[],
  privateChats: { [partnerId: string]: Message[] }
}
```

## 7. Processing Flow

**詳細フロー:**

```
1. 投稿処理
   │
   ├─ Validation (Client)
   │   ├─ text.trim().length >= 1
   │   ├─ text.length <= 500
   │   └─ Invalid → Show error
   │
   ├─ Send WebSocket event
   │   └─ { type: 'timeline_post', text }
   │
   ├─ Server処理
   │   ├─ Zod validation
   │   ├─ Create TimelineMessage
   │   │   ├─ id: randomUUID()
   │   │   ├─ userId: from session
   │   │   ├─ name: from session
   │   │   ├─ text: from event
   │   │   └─ timestamp: Date.now()
   │   │
   │   ├─ Add to timeline array
   │   │   └─ timeline.push(message)
   │   │
   │   └─ Broadcast to all users
   │       └─ { type: 'timeline_message', message }
   │
   └─ Client受信
       ├─ Add to Zustand store
       └─ UI更新

2. 表示処理
   │
   ├─ タイムライン取得（history_sync）
   │   └─ timeline.slice(-50) // 最新50件
   │
   └─ 表示
       └─ 新しい順（timestamp降順）

3. リロード時
   │
   ├─ history_sync受信
   │
   └─ timeline配列を復元
```

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | text が1-500文字 | 投稿許可 |
| BR-2 | text が空または500文字超 | 投稿拒否、エラー表示 |
| BR-3 | タイムライン件数が1000件超 | 古いメッセージを削除（FIFO） |
| BR-4 | 閉店時刻（04:00） | timeline配列をクリア |

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
│   ├── Timeline ← 新規追加
│   │   ├── TimelineList
│   │   │   └── TimelineItem (各呟き)
│   │   └── TimelinePostForm
│   ├── CounterChat (既存)
│   └── ParticipantsList (既存)
└── PrivateChatPanel (F008で追加予定)
```

**タイムラインUI:**

```yaml
位置: サイドパネル上部
表示:
  - 最新50件
  - 新しい順
  - スクロール可能
  - 自動スクロール（新規投稿時）

投稿フォーム:
  - テキストエリア
  - 文字数カウンター（500/500）
  - 投稿ボタン
```

**状態遷移:**

```
[Idle] ──テキスト入力──> [Typing]
[Typing] ──500文字超過──> [Invalid]
[Typing] ──投稿ボタン──> [Posting]
[Posting] ──成功──> [Success] ──> [Idle]
[Posting] ──失敗──> [Error] ──> [Idle]
```

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| 空文字投稿 | text.trim() === '' | エラー: 「呟きを入力してください」 |
| 500文字ちょうど | text.length === 500 | 投稿許可 |
| 501文字 | text.length === 501 | エラー: 「500文字以内で入力してください」 |
| 絵文字・特殊文字 | 絵文字含む文字列 | 正常投稿（文字数カウント注意） |
| 連続投稿 | 1秒に複数回投稿 | Rate limit検討（Phase 2） |
| タイムライン満杯 | 1000件超 | 古いメッセージを自動削除 |

**Error Handling Matrix:**

| Error Type | HTTP Status | Error Code | User Message | Recovery Action |
|------------|-------------|------------|--------------|-----------------|
| Validation | - | INVALID_TEXT | 1-500文字で入力してください | フォーム再入力 |
| Empty Text | - | EMPTY_TEXT | 呟きを入力してください | フォーム再入力 |
| Server Error | - | SERVER_ERROR | 投稿に失敗しました | リトライボタン |
| WebSocket Disconnected | - | WS_ERROR | 接続が切れています | 自動再接続 |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E)
   ├── AC-1: 呟き投稿 → RED確認
   ├── AC-2: 他ユーザーの呟き表示 → RED確認
   ├── AC-3: リロード後の履歴復元 → RED確認
   └── AC-4: 文字数制限 → RED確認

2. Integration Test
   ├── WebSocket timeline_post イベント → RED確認
   └── history_sync（タイムライン含む） → RED確認

3. Unit Test
   ├── バリデーションロジック → RED確認
   ├── Zustand store操作 → RED確認
   └─ メッセージ生成ロジック → RED確認

4. Implementation (GREEN)
   ├── Frontend: Timeline.tsx, useTimelineStore.ts
   ├── Backend: timeline配列、timeline_postハンドラ
   └── Shared: TimelinePostEvent, TimelineMessageEvent

5. Refactor (IMPROVE)
   ├── UI/UXブラッシュアップ
   ├── パフォーマンス最適化（仮想スクロール）
   └── カバレッジ確認 (80%+)
```

**テストファイル:**

| Test Type | File Path | Priority | Status |
|-----------|-----------|----------|--------|
| E2E | `e2e/tests/timeline.spec.ts` | 1 | ⚪️ TODO |
| Integration | `apps/backend/tests/integration/timeline.integration.test.ts` | 2 | ⚪️ TODO |
| Unit | `apps/frontend/src/stores/__tests__/useTimelineStore.test.ts` | 3 | ⚪️ TODO |

---

## Implementation Notes

### メモリ使用量試算

```yaml
前提:
  営業時間: 6時間
  参加者: 100人
  呟き: 平均5件/人
  文字数: 平均200文字

計算:
  100人 × 5件 × 200文字 = 100,000文字
  約100KB

上限設定:
  最大1000件保持（FIFO）
  1000件 × 500文字 = 500,000文字
  約500KB

結論: 問題なし
```

### カウンターチャットとの違い

| 項目 | タイムライン | カウンターチャット |
|------|--------------|-------------------|
| 用途 | 独り言・呟き | 文脈のある会話 |
| 対象 | 全ユーザー | カウンター内ユーザー |
| 性質 | 一方向的 | 双方向的 |
| UI位置 | サイドパネル上部 | メイン画面下部 |

### Next Steps

1. F006（User Session Management）の実装後に実装
2. F008（Private Chat）と並行開発可能
3. UI/UXデザイン詳細化
