# Feature: Chat

---
feature: f004
status: :TEST_WRITTEN
priority: high
dependencies: [F002, F003]
created: 2026-02-06
updated: 2026-02-11
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | WebSocket経由でリアルタイムチャット機能を提供し、全ユーザーが送受信したメッセージを共有する |
| 目的 | 入店したユーザー同士がテキストメッセージでコミュニケーションできる基本機能を提供する |
| 対象ユーザー | 入店済みの全ユーザー |
| スコープ | テキストメッセージの送受信のみ（画像・スタンプ・編集・削除は対象外）。メッセージはセッションのみ保持（永続化なし） |

## 2. Acceptance Criteria

**重要: ACはこのフィーチャーの完了条件。ACを満たせば実装完了。**

**AC-1: メッセージ送信の基本機能**
- Given: ユーザーが入店済み
- When: メッセージを入力してフォームを送信
- Then:
  - メッセージがチャットリストに表示される
  - 送信者名（青色）とメッセージ本文（灰色）が表示される
  - 入力フォームが自動的にクリアされる
- 検証方法: E2E テスト（`chat.spec.ts#メッセージを送信すると表示される`）

**AC-2: 複数ユーザー間でメッセージが同期される**
- Given: 2人のユーザーが入店している
- When: User1がメッセージを送信
- Then:
  - User1の画面にメッセージが表示される
  - User2の画面にも同じメッセージが表示される（リアルタイム）
  - メッセージには送信者名が含まれる
- 検証方法: E2E テスト（`chat.spec.ts#複数ユーザー間でメッセージが同期される`）

**AC-3: 文字数制限（1-500文字）**
- Given: ユーザーが入力フォームにフォーカス
- When:
  - Case A: 空文字または空白のみを送信
  - Case B: 501文字以上を送信
- Then:
  - Case A: 送信されない（クライアント側でブロック）
  - Case B: 500文字でカット（HTML maxLength）+ サーバー側でリジェクト
- 検証方法: E2E テスト（`chat.spec.ts#空メッセージは送信されない`、`chat.spec.ts#長文メッセージの制限`）、Integration テスト（`chat.integration.test.ts#SendMessageEvent Validation`）

**AC-4: 前後の空白を自動トリミング**
- Given: ユーザーがメッセージを入力
- When: 前後にスペースを含むメッセージを送信（例: "  hello  "）
- Then:
  - トリミングされて送信される（"hello"）
  - 空白のみの場合は送信されない
- 検証方法: E2E テスト（`chat.spec.ts#前後空白のトリミング`）、Unit テスト（`Chat.test.tsx#should not submit empty message`）

**AC-5: 未入店ユーザーはメッセージ送信不可**
- Given: WebSocket接続済みだが、joinイベント未送信
- When: send_messageイベントを送信
- Then:
  - サーバー側で無視される（isJoinedガード）
  - エラーメッセージなし（静かに無視）
- 検証方法: Unit テスト（`ws-handler.test.ts#isJoinedガード`）

**AC-6: サーバー側Zodバリデーション**
- Given: サーバーがsend_messageイベントを受信
- When:
  - Case A: text フィールドが1-500文字
  - Case B: text フィールドが空文字
  - Case C: text フィールドが501文字以上
- Then:
  - Case A: バリデーション成功、処理継続
  - Case B, C: Zodエラー、処理中断
- 検証方法: Integration テスト（`chat.integration.test.ts#SendMessageEvent Validation`）

**AC-7: 名前とタイムスタンプの改竄防止**
- Given: クライアントがsend_messageを送信
- When: サーバーがmessageイベントをbroadcast
- Then:
  - name フィールドはstoreから取得される（クライアント指定不可）
  - timestamp フィールドはサーバー側で生成される（クライアント指定不可）
- 検証方法: Integration テスト（`chat.integration.test.ts#MessageEvent Validation`）、コードレビュー（ws-handler.ts:95-96）

**AC-8: メッセージはimmutableパターンで更新される**
- Given: 既存のメッセージリストが存在
- When: 新しいメッセージを受信
- Then:
  - 新しいmessages配列が生成される（元の配列は変更されない）
  - 新しいメッセージは配列の末尾に追加される
- 検証方法: Unit テスト（`useBarStore.test.ts#should maintain immutability`）

**AC-9: メッセージはセッションのみ保持（永続化なし）**
- Given: ユーザーがメッセージを送受信
- When: ページをリロード
- Then:
  - メッセージ履歴は消える（永続化されない）
- 検証方法: E2E テスト（`chat.spec.ts#ページリロード後の履歴消失`）

## 3. User Story

```
As a 入店済みユーザー
I want to テキストメッセージを送信し、他のユーザーのメッセージを受信する
So that カウンターに座っている人たちとリアルタイムで会話できる
```

**メインシナリオ（時系列順）:**

1. ユーザーが入店画面で名前を入力し、入店する（F002）
2. システムが店内画面を表示し、チャット入力フォームを表示する
3. ユーザーがメッセージを入力し、Enterキーまたは送信ボタンを押す
4. システムがメッセージをトリミングし、1-500文字の範囲内か検証する
5. クライアントがWebSocket経由で`send_message`イベントを送信する
6. サーバーがZodバリデーション、isJoinedチェック、ユーザー存在チェックを実施
7. サーバーが全ユーザーに`message`イベントをブロードキャスト（送信者名とタイムスタンプをサーバー側で設定）
8. 全ユーザーの画面にメッセージが表示される
9. 送信者の入力フォームが自動的にクリアされる

**代替シナリオ:**

- 3a. メッセージが空白のみの場合: クライアント側でブロック、送信されない
- 4a. メッセージが501文字以上の場合: HTML5 maxLengthで500文字にカット + サーバー側でリジェクト
- 6a. 未入店ユーザーの場合: サーバー側で無視される
- 6b. 存在しないユーザーの場合: サーバー側で無視される
- WebSocket切断中: イベント送信スキップ（自動再接続待ち）

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | React 19 | UIレンダリング、フォーム管理 | `apps/frontend/src/components/Chat.tsx` |
| Frontend | Zustand | メッセージ状態管理（immutable更新） | `apps/frontend/src/stores/useBarStore.ts` |
| Backend | Node.js + ws | WebSocketサーバー、メッセージブロードキャスト | `apps/backend/src/ws-handler.ts` |
| Shared | Zod | イベントバリデーション（SendMessageEvent, MessageEvent） | `packages/shared/src/events.ts` |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| `apps/backend/src/ws-handler.ts` | 実装済み（L85-100: send_messageイベント処理） |
| `apps/frontend/src/components/Chat.tsx` | 実装済み（L11-19: 送信フォーム、L24-29: メッセージリスト） |
| `apps/frontend/src/stores/useBarStore.ts` | 実装済み（L62-74: messageイベントハンドラ） |
| `packages/shared/src/events.ts` | 実装済み（L13-16: SendMessageEventSchema、L63-69: MessageEventSchema） |

**注記**: 実装は完了済み。本仕様書は既存実装の文書化とテスト追加を目的とする。

## 5. Data Model

**Entity: Message**

```typescript
interface Message {
  userId: string      // 送信者のユーザーID（サーバー生成）
  name: string        // 送信者の表示名（storeから取得、改竄防止）
  text: string        // メッセージ本文（1-500文字）
  timestamp: number   // 送信時刻（Unix timestamp in ms、サーバー生成）
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| userId | string | Yes | - | 送信者のユーザーID（サーバー側で設定） |
| name | string | Yes | - | 送信者の表示名（サーバー側storeから取得） |
| text | string | Yes | - | メッセージ本文（1-500文字、トリミング済み) |
| timestamp | number | Yes | - | 送信時刻（Unix timestamp in ms、サーバー側でDate.now()生成） |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| text | min: 1, max: 500 | "メッセージは1文字以上500文字以内で入力してください" |
| text (client) | trim()後に長さチェック | - |
| text (server) | Zodバリデーション | Zodエラー（自動） |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | Client | メッセージ送信時 | WebSocket `send_message` イベント | HTML5 maxLength + Client JS + Server Zod |
| Read | Client | リアルタイム受信 | WebSocket `message` イベント | - |
| Update | - | - | 不可（編集機能なし） | - |
| Delete | - | - | 不可（削除機能なし） | - |

**Relationships:**

```
User ──1:N──> Message
```

| From | To | Relation | Description |
|------|----|----------|-------------|
| User | Message | 1:N | 1人のユーザーは複数のメッセージを送信できる |

## 6. API Design

**WebSocket Events:**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `send_message` | C→S | `SendMessageEvent` | クライアントがメッセージを送信 |
| `message` | S→C | `MessageEvent` | サーバーがメッセージを全ユーザーにブロードキャスト |

**Event: send_message (Client → Server)**

```typescript
const SendMessageEventSchema = z.object({
  type: z.literal('send_message'),
  text: z.string().min(1).max(500),
})
```

Request Payload:
```typescript
{
  type: 'send_message',
  text: string  // 1-500文字、トリミング済み
}
```

**Event: message (Server → Client)**

```typescript
const MessageEventSchema = z.object({
  type: z.literal('message'),
  userId: z.string(),
  name: z.string(),
  text: z.string(),
  timestamp: z.number(),
})
```

Response Payload:
```typescript
{
  type: 'message',
  userId: string,        // サーバー側で設定（送信者のID）
  name: string,          // サーバー側storeから取得（改竄防止）
  text: string,          // クライアントから受信したtext
  timestamp: number      // サーバー側でDate.now()生成（改竄防止）
}
```

## 7. Processing Flow

**概要フロー:**

```
[ユーザー入力] → [Client Validation] → [WebSocket send_message] → [Server Validation] → [Broadcast message] → [全ユーザーのUI更新]
                         ↓
                    [エラー: 送信スキップ]
```

**詳細フロー:**

```
1. ユーザーがメッセージを入力
   │
   ├─ Client-side Validation (Chat.tsx:14-15)
   │   ├─ trim()で前後空白を削除
   │   ├─ 長さチェック: 0文字 → ブロック
   │   ├─ 長さチェック: 501文字以上 → ブロック（HTML5 maxLength=500）
   │   └─ 1-500文字 → Continue
   │
   ├─ WebSocket Event送信 (Chat.tsx:17)
   │   └─ sendEvent({ type: 'send_message', text: trimmed })
   │
   └─ フォームクリア (Chat.tsx:18)
       └─ setText('')

2. サーバーがsend_messageイベントを受信 (ws-handler.ts:85-100)
   │
   ├─ Zod Validation (自動、L32)
   │   ├─ text: min(1), max(500) → Pass
   │   └─ Invalid → Zodエラー、処理中断
   │
   ├─ isJoinedガード (L86)
   │   ├─ true → Continue
   │   └─ false → 処理中断（静かに無視）
   │
   ├─ ユーザー存在チェック (L88-89)
   │   ├─ user exists → Continue
   │   └─ user not found → 処理中断（静かに無視）
   │
   ├─ Message Event作成 (L92-98)
   │   └─ {
   │         type: 'message',
   │         userId: userId,           // 現在のWebSocket接続のuserID
   │         name: user.name,          // storeから取得（改竄防止）
   │         text: event.text,         // クライアントから受信
   │         timestamp: Date.now()     // サーバー生成（改竄防止）
   │       }
   │
   └─ Broadcast to all users (L92)
       └─ 全ユーザー（送信者含む）にイベント送信

3. クライアントがmessageイベントを受信
   │
   ├─ useBarStore.handleServerEvent (useBarStore.ts:62-74)
   │   └─ messages: [...state.messages, newMessage]  // Immutable更新
   │
   └─ React 再レンダリング
       └─ Chat.tsx でメッセージリスト更新 (L24-29)
```

**Validation Rules:**

| Input | Rule | Error Code | Error Message |
|-------|------|------------|---------------|
| text (client) | trim().length >= 1 && <= 500 | - | 送信スキップ（silent） |
| text (server) | z.string().min(1).max(500) | ZodError | Zodエラーメッセージ（自動） |

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | isJoined === false | メッセージ送信を無視 |
| BR-2 | user not found in store | メッセージ送信を無視 |
| BR-3 | text.trim().length === 0 | クライアント側で送信ブロック |
| BR-4 | name と timestamp | サーバー側で生成（クライアント指定不可） |

## 8. UI Requirements

**画面: 店内画面（Bar Inside）**

```yaml
route: /bar
layout: BarLayout
auth: required (入店済み)
```

**コンポーネント構成:**

```
BarLayout
├── Seats (F003)
└── Chat (F004)
    ├── MessageList
    │   └── MessageItem (name + text)
    └── MessageForm
        └── Input (maxLength=500)
```

**Chat Component 仕様:**

| 要素 | スタイル | 説明 |
|------|---------|------|
| Container | `flex flex-col h-full` | 縦方向レイアウト、高さ100% |
| MessageList | `flex-1 overflow-y-auto p-4 space-y-2` | スクロール可能、パディング付き |
| MessageItem | `text-sm` | 小さめフォント |
| 送信者名 | `font-bold text-blue-400` | 太字、青色 |
| メッセージ本文 | `text-gray-200` | 灰色 |
| MessageForm | `p-4 border-t border-gray-700` | 上部ボーダー、パディング |
| Input | `maxLength={500}` | HTML5バリデーション |
| Placeholder | "メッセージを入力 (最大500文字)" | ユーザー向けヒント |

**状態遷移:**

```
[初期状態: 入力フォーム空]
    ↓ ユーザーが入力
[入力中: テキスト入力中]
    ↓ Enter or Submit
[送信処理: trim & validation]
    ↓ 成功
[フォームクリア: 空に戻る]
    ↓ WebSocket経由
[メッセージ受信: リスト更新]
```

| State | Display | User Actions | Next States |
|-------|---------|--------------|-------------|
| Empty | 空の入力フォーム | テキスト入力 | Typing |
| Typing | 入力中のテキスト | Enter/Submit | Submitting |
| Submitting | Loading（なし） | - | Empty |
| Received | メッセージリスト更新 | - | Empty |

**レスポンシブ対応:**

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| mobile (<640px) | 同一レイアウト | 入力フォームは固定下部 |
| tablet (640-1024px) | 同一レイアウト | - |
| desktop (>1024px) | 同一レイアウト | - |

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| Empty input | 空文字列 | クライアント側で送信ブロック（silent） |
| Whitespace only | "   " | トリミング後に空 → 送信ブロック |
| Boundary value (500 chars) | 500文字ちょうど | 送信成功 |
| Boundary value (501 chars) | 501文字以上 | HTML5 maxLengthでカット + サーバー側リジェクト |
| 未入店ユーザー | isJoined === false | サーバー側で無視（silent） |
| 存在しないユーザー | store.getUser() === null | サーバー側で無視（silent） |
| WebSocket切断中 | ws.readyState !== 1 | イベント送信スキップ（自動再接続待ち） |
| Concurrent messages | 複数ユーザーが同時送信 | 各メッセージが順番にブロードキャスト |
| Page reload | ページリロード | メッセージ履歴が消える（セッションのみ） |
| Malicious input | XSS試行（`<script>alert('XSS')</script>`） | ReactのJSXエスケープにより無害化 |
| Name spoofing | クライアントがnameを偽装しようとする | サーバー側storeから取得、改竄不可 |
| Timestamp manipulation | クライアントがtimestampを偽装しようとする | サーバー側でDate.now()生成、改竄不可 |

**Error Handling Matrix:**

| Error Type | Trigger | Error Code | User Message | Recovery Action |
|------------|---------|------------|--------------|-----------------|
| Validation (client) | 空文字/501文字以上 | - | なし（silent） | 再入力 |
| Validation (server) | Zodエラー | ZodError | なし（silent） | 自動リトライなし |
| Unauthorized (未入店) | isJoined === false | - | なし（silent） | 入店が必要 |
| Not Found (ユーザー) | store.getUser() === null | - | なし（silent） | - |
| WebSocket Disconnected | ws.readyState !== 1 | - | なし（silent） | 自動再接続待ち |
| Server Error | try-catch (L102-104) | console.error | なし | ログ出力のみ |

**セキュリティ対策:**

| 脅威 | 対策 | 実装箇所 |
|------|------|---------|
| XSS攻撃 | ReactのJSXエスケープ | Chat.tsx:26-27 |
| 名前なりすまし | サーバー側storeから取得 | ws-handler.ts:95 |
| タイムスタンプ改竄 | サーバー側でDate.now()生成 | ws-handler.ts:97 |
| スパム送信 | 文字数制限（1-500文字） | events.ts:15, Chat.tsx:15, ws-handler.ts:85-100 |
| 未入店ユーザーの送信 | isJoinedガード | ws-handler.ts:86 |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E)
   ├── AC-1: メッセージ送信の基本機能 → RED確認
   ├── AC-2: 複数ユーザー間でメッセージが同期される → RED確認
   ├── AC-3, AC-4: 空メッセージは送信されない → RED確認
   ├── AC-3: 長文メッセージの制限 → RED確認
   ├── AC-4: 前後空白のトリミング → RED確認
   └── AC-9: ページリロード後の履歴消失 → RED確認

2. Integration Test
   ├── AC-6: SendMessageEvent Zodバリデーション → RED確認
   └── AC-7: MessageEvent Zodバリデーション → RED確認

3. Unit Test
   ├── AC-1: Chat Component メッセージリスト表示 → RED確認
   ├── AC-1: Chat Component フォームクリア → RED確認
   ├── AC-3, AC-4: Chat Component 空メッセージブロック → RED確認
   ├── AC-5: ws-handler isJoinedガード → RED確認
   ├── AC-2, AC-8: useBarStore メッセージ追加 → RED確認
   └── AC-8: useBarStore Immutability → RED確認

4. Implementation (GREEN)
   ※ 既に実装済み → 全テストGREENになるはず

5. Refactor (IMPROVE)
   ├── コード品質確認
   ├── カバレッジ確認 (80%+)
   └── spec/_index.md 更新
```

**テストファイル:**

| Test Type | File Path | Priority | Test Count |
|-----------|-----------|----------|------------|
| E2E | `e2e/tests/chat.spec.ts` | 1 | 6 tests |
| Integration | `apps/backend/tests/integration/chat.integration.test.ts` | 2 | 16 tests |
| Unit (Frontend) | `apps/frontend/src/components/__tests__/Chat.test.tsx` | 3 | 16 tests |
| Unit (Frontend) | `apps/frontend/src/stores/__tests__/useBarStore.test.ts` | 3 | 13 tests (追加) |

**カバレッジ目標:**

| Area | Minimum | Target | Critical Paths |
|------|---------|--------|----------------|
| Statements | 80% | 90% | 100% |
| Branches | 80% | 90% | 100% |
| Functions | 80% | 90% | 100% |
| Lines | 80% | 90% | 100% |

**Critical Paths:**
- メッセージ送信フロー（入力 → バリデーション → WebSocket送信 → ブロードキャスト → 表示）
- 複数ユーザー同期
- セキュリティ対策（名前/タイムスタンプ改竄防止、isJoinedガード）

---

## Appendix

**実装完了状態:**

このフィーチャーは既に実装されています。以下のファイルで実装を確認できます：

- Backend: `apps/backend/src/ws-handler.ts` (L85-100)
- Frontend Component: `apps/frontend/src/components/Chat.tsx`
- Frontend Store: `apps/frontend/src/stores/useBarStore.ts` (L10-15, L62-74)
- Shared Events: `packages/shared/src/events.ts` (L13-16, L63-69)

**次のステップ:**

1. E2Eテスト作成（`e2e/tests/chat.spec.ts`）
2. Integrationテスト作成（`apps/backend/tests/integration/chat.integration.test.ts`）
3. Unitテスト作成（Frontend Component & Store）
4. 全テストGREEN確認
5. カバレッジ80%以上確認
6. `spec/features/_index.md` 更新

---

**Version History:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-06 | 初版作成（スケルトン） |
| 2.0.0 | 2026-02-10 | 完全な仕様書作成（既存実装の文書化、AC定義、テスト計画） |
