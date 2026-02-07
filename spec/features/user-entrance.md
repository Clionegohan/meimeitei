# Feature: User Entrance

---
feature: user-entrance
status: :SPEC_DONE
priority: high
dependencies: [business-hours]
created: 2026-02-06
updated: 2026-02-07
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | ユーザーが名前を入力して店内に入店する機能 |
| 目的 | バーチャルバーの参加者として識別され、他のユーザーとコミュニケーションできるようにする |
| 対象ユーザー | 営業時間内にアクセスした全ての訪問者（認証不要・ゲストモード） |
| スコープ | 名前入力・バリデーション・localStorage保存・店内画面への遷移・WebSocket接続による参加通知を含む。パスワード認証、プロフィール画像、ユーザー設定は含まない。 |

## 2. Acceptance Criteria

**重要: ACはこのフィーチャーの完了条件。ACを満たせば実装完了。**

**AC-1: 空の名前入力時のエラー表示**
- Given: ユーザーが入店画面にいる
- When: 名前を入力せず（空文字列またはスペースのみ）送信ボタンをクリック
- Then: "名前を入力してください"というエラーメッセージが表示される
- 検証方法: E2E Test (Playwright)

**AC-2: 有効な名前での入店成功**
- Given: ユーザーが入店画面にいる
- When: 1-20文字の有効な名前を入力して送信ボタンをクリック
- Then: 名前がlocalStorageに保存され、`/bar`画面にリダイレクトされる
- 検証方法: E2E Test (Playwright)

**AC-3: 20文字超過時のエラー表示**
- Given: ユーザーが入店画面にいる
- When: 21文字以上の名前を入力して送信ボタンをクリック
- Then: "名前は20文字以内で入力してください"というエラーメッセージが表示される
- 検証方法: E2E Test (Playwright)

**AC-4: 前後の空白文字の自動トリミング**
- Given: ユーザーが入店画面にいる
- When: "  Alice  "（前後にスペース）を入力して送信
- Then: "Alice"（トリム後）がlocalStorageに保存される
- 検証方法: Unit Test (Vitest)

**AC-5: サーバーサイドZodバリデーション**
- Given: クライアントから不正な名前でjoinイベントが送信される
- When: バックエンドがイベントを受信
- Then: Zodバリデーションが失敗し、エラーがログに記録される
- 検証方法: Integration Test (Vitest)

**AC-6: WebSocket参加イベントのブロードキャスト**
- Given: ユーザーが有効な名前で入店成功
- When: バックエンドがjoinイベントを受信
- Then: `user_joined`イベントが他の全ユーザーにブロードキャストされる
- 検証方法: Integration Test (Vitest)

**AC-7: 重複入店の防止**
- Given: ユーザーが既に入店済み（isJoined = true）
- When: 同じ接続から2回目のjoinイベントが送信される
- Then: イベントが無視され、重複ブロードキャストが発生しない
- 検証方法: Integration Test (Vitest)

**AC-8: localStorage永続化**
- Given: ユーザーが"Alice"という名前で入店
- When: ページをリロード
- Then: localStorageに"Alice"が保持されている
- 検証方法: E2E Test (Playwright)

## 3. User Story

```
As a めぃめぃ亭の訪問者
I want to 名前を入力して店内に入る
So that 他の人とチャットしたり席に座ったりできる
```

**メインシナリオ（時系列順）:**

1. ユーザーが営業時間内に`/enter`にアクセスする
2. システムが入店画面（名前入力フォーム）を表示する
3. ユーザーが名前を入力し、「入店」ボタンをクリックする
4. システムがクライアント側でバリデーション（1-20文字、トリム）を実行する
5. システムが名前をlocalStorage（キー: `meimei_username`）に保存する
6. システムが`/bar`にリダイレクトする
7. `/bar`画面でWebSocket接続が確立される
8. クライアントが`join`イベントを送信する
9. バックエンドがサーバー側バリデーション（Zod）を実行する
10. バックエンドがユーザーをストアに追加し、`state_sync`イベントを送信する
11. バックエンドが他のユーザーに`user_joined`イベントをブロードキャストする

**代替シナリオ:**

- 3a. 名前が空の場合: エラーメッセージ"名前を入力してください"を表示、フォームに留まる
- 3b. 名前が21文字以上の場合: エラーメッセージ"名前は20文字以内で入力してください"を表示、フォームに留まる
- 9a. サーバー側バリデーション失敗: エラーログ出力、接続は維持されるがユーザー追加されず

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | Next.js 15 (App Router) | ページルーティング、SSR | `apps/frontend/src/app/enter/page.tsx` |
| Frontend | React 19 | UIコンポーネント（状態管理、フォーム制御） | `apps/frontend/src/app/enter/page.tsx` |
| Frontend | localStorage API | 名前の永続化 | `apps/frontend/src/app/enter/page.tsx` |
| Frontend | Tailwind CSS v4 | スタイリング | `apps/frontend/src/app/enter/page.tsx` |
| Backend | WebSocket (ws) | リアルタイム通信（join イベント受信、ブロードキャスト） | `apps/backend/src/ws-handler.ts` |
| Backend | Zod | サーバー側バリデーション | `apps/backend/src/ws-handler.ts` |
| Shared | @meimei-tei/shared | イベントスキーマ共有 | `packages/shared/src/events.ts` |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| `apps/frontend/src/app/enter/page.tsx` | 実装済み（テスト追加のみ） |
| `apps/backend/src/ws-handler.ts` | 実装済み（テスト追加のみ） |
| `packages/shared/src/events.ts` | 実装済み（変更なし） |

## 5. Data Model

**Entity: UserData (localStorage)**

```typescript
interface UserData {
  meimei_username: string  // ユーザーの表示名（1-20文字、トリム済み）
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| meimei_username | string | Yes | - | ユーザーの表示名（1-20文字） |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| meimei_username | `trim().min(1)` | "名前を入力してください" |
| meimei_username | `max(20)` | "名前は20文字以内で入力してください" |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | ユーザー | 入店時（送信ボタンクリック） | `localStorage.setItem('meimei_username', trimmedName)` | 1-20文字、トリム |
| Read | システム | `/bar`画面ロード時 | `localStorage.getItem('meimei_username')` | - |
| Update | ユーザー | 再入店時 | `localStorage.setItem()` で上書き | 1-20文字、トリム |
| Delete | システム | 退店時（将来実装） | `localStorage.removeItem('meimei_username')` | - |

**Relationships:**

```
UserData (localStorage) ──1:1──> WebSocket User (backend store)
```

| From | To | Relation | Description |
|------|----|----------|-------------|
| UserData | WebSocket User | 1:1 | localStorageの名前がWebSocket接続時にサーバーに送信され、サーバー側ストアに保存される |

## 6. API Design

**WebSocket Events (this feature):**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join` | C→S | `{type: 'join', name: string}` | クライアントが入店意思を通知 |
| `state_sync` | S→C | `{type: 'state_sync', users: User[]}` | 新規参加者に既存ユーザー一覧を送信 |
| `user_joined` | S→C | `{type: 'user_joined', userId: string, name: string}` | 他のユーザーに新規参加を通知 |

```typescript
// Join Event Schema (Client → Server)
const JoinEventSchema = z.object({
  type: z.literal('join'),
  name: z.string().trim().min(1).max(20),
})

// State Sync Event Schema (Server → Client)
const StateSyncEventSchema = z.object({
  type: z.literal('state_sync'),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      seated: z.boolean(),
    })
  ),
})

// User Joined Event Schema (Server → Client)
const UserJoinedEventSchema = z.object({
  type: z.literal('user_joined'),
  userId: z.string(),
  name: z.string(),
})
```

**Validation Errors:**

| Input | Validation Error | Handling |
|-------|------------------|----------|
| `name: ""` | Zod validation fails (min 1) | Error logged, event ignored |
| `name: "A".repeat(21)` | Zod validation fails (max 20) | Error logged, event ignored |

## 7. Processing Flow

**概要フロー:**

```
[名前入力] → [クライアントバリデーション] → [localStorage保存] → [/bar遷移]
                                ↓
                           [エラー表示]

[WebSocket接続] → [join送信] → [サーバーバリデーション] → [ストア追加] → [ブロードキャスト]
                                      ↓
                                 [エラーログ]
```

**詳細フロー:**

```
1. ユーザーが名前入力して送信ボタンクリック
   │
   ├─ Client-side Validation
   │   ├─ trim() 実行
   │   ├─ length === 0 → Error: "名前を入力してください"
   │   ├─ length > 20 → Error: "名前は20文字以内で入力してください"
   │   └─ Valid → Continue
   │
   ├─ localStorage Save
   │   └─ setItem('meimei_username', trimmedName)
   │
   ├─ Router Push
   │   └─ router.push('/bar')
   │
   └─ /bar画面に遷移

2. /bar画面でWebSocket接続確立
   │
   ├─ WebSocket "open" イベント
   │   └─ send({ type: 'join', name: trimmedName })
   │
   ├─ Server-side Processing
   │   ├─ Zod Validation (JoinEventSchema)
   │   │   ├─ Invalid → Error logged, return
   │   │   └─ Valid → Continue
   │   │
   │   ├─ Duplicate Check
   │   │   ├─ isJoined === true → return (ignore)
   │   │   └─ isJoined === false → Continue
   │   │
   │   ├─ Add User to Store
   │   │   └─ store.addUser({ id, name, seated: false, ws })
   │   │
   │   ├─ Set isJoined = true
   │   │
   │   ├─ Send state_sync to new user
   │   │   └─ send(ws, { type: 'state_sync', users })
   │   │
   │   └─ Broadcast user_joined to others
   │       └─ broadcast({ type: 'user_joined', userId, name }, ws)
   │
   └─ Client receives state_sync
       └─ Update local user list
```

**Validation Rules:**

| Input | Rule | Error Code | Error Message |
|-------|------|------------|---------------|
| name | `trim().min(1)` | CLIENT_VALIDATION_ERROR | "名前を入力してください" |
| name | `max(20)` | CLIENT_VALIDATION_ERROR | "名前は20文字以内で入力してください" |
| name (server) | ZodSchema | ZOD_VALIDATION_ERROR | (logged to console) |

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | isJoined === true | 2回目のjoinイベントを無視 |
| BR-2 | WebSocket切断 | ユーザーをストアから削除（別フィーチャー） |

## 8. UI Requirements

**画面: 入店画面**

```yaml
route: /enter
layout: default (full screen centered)
auth: none
```

**状態遷移:**

```
[初期状態] ──{入力}──> [入力中] ──{送信}──> [バリデーション] ──{成功}──> [リダイレクト]
                                        ↓
                                   [エラー表示]
```

| State | Display | User Actions | Next States |
|-------|---------|--------------|-------------|
| 初期状態 | 空のフォーム | テキスト入力、送信ボタンクリック | 入力中 |
| 入力中 | 入力値表示、エラークリア | テキスト編集、送信 | バリデーション |
| エラー表示 | エラーメッセージ表示 | 再入力、送信 | 入力中 → バリデーション |
| リダイレクト | - | - | /bar画面へ遷移 |

**コンポーネント構成:**

```
EnterPage (Client Component)
├── <h1> タイトル "めぃめぃ亭"
├── <form>
│   ├── <label> "お名前"
│   ├── <input> テキスト入力（maxLength: 20）
│   ├── <p> エラーメッセージ（条件付き表示）
│   └── <button> "入店"
└── (状態管理: name, error)
```

**レスポンシブ対応:**

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| mobile (<640px) | 中央揃え、フォーム幅80vw | - |
| tablet (640-1024px) | 中央揃え、フォーム幅320px | - |
| desktop (>1024px) | 中央揃え、フォーム幅320px | - |

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| Empty input | `""` | エラー表示: "名前を入力してください" |
| Whitespace only | `"   "` | trim後`""`となり、エラー表示 |
| Exactly 20 chars | `"A".repeat(20)` | 有効、localStorage保存、遷移 |
| 21 chars | `"A".repeat(21)` | エラー表示: "名前は20文字以内で入力してください" |
| Leading/trailing spaces | `"  Alice  "` | `"Alice"`としてトリム、保存 |
| Special characters | `"@#$%"` | 有効（文字種制限なし） |
| Emoji | `"😀😁😂"` | 有効（UTF-8対応） |
| Duplicate join | 既にisJoined=true | 2回目のjoinイベント無視 |
| WebSocket切断 | 接続中に切断 | ユーザー削除イベント発火（F005） |
| localStorage無効 | プライベートモード等 | エラーハンドリング未実装（将来対応） |

**Error Handling Matrix:**

| Error Type | HTTP Status | Error Code | User Message | Recovery Action |
|------------|-------------|------------|--------------|-----------------|
| 名前が空 | - | CLIENT_VALIDATION | "名前を入力してください" | フォーム再入力 |
| 名前が長すぎ | - | CLIENT_VALIDATION | "名前は20文字以内で入力してください" | フォーム再入力 |
| Zod validation失敗 | - | ZOD_ERROR | (ログのみ、UI表示なし) | 接続維持 |
| WebSocket切断 | - | WS_DISCONNECTED | (将来: 再接続UI) | 自動再接続（F005） |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E) - Playwright
   ├── AC-1: 空の名前でエラー表示 → RED確認
   ├── AC-2: 有効な名前で入店成功 → RED確認
   ├── AC-3: 21文字以上でエラー表示 → RED確認
   └── AC-8: localStorage永続化 → RED確認

2. Integration Test - Vitest (Backend)
   ├── AC-5: サーバー側Zodバリデーション → RED確認
   ├── AC-6: user_joinedブロードキャスト → RED確認
   └── AC-7: 重複入店防止 → RED確認

3. Unit Test - Vitest (Frontend)
   └── AC-4: 前後の空白トリミング → RED確認

4. Implementation Verification (GREEN)
   ├── 既存実装が全テストをパス
   └── カバレッジ確認 (80%+)

5. Refactor (IMPROVE)
   ├── console.log削除
   ├── コード品質チェック
   └── 不要なコメント削除
```

**テストファイル:**

| Test Type | File Path | Priority |
|-----------|-----------|----------|
| E2E | `e2e/tests/user-entrance.spec.ts` | 1 |
| Integration | `apps/backend/tests/integration/user-entrance.integration.test.ts` | 2 |
| Unit | `apps/frontend/src/app/enter/__tests__/page.test.tsx` | 3 |

**カバレッジ目標:**

| Area | Minimum | Target |
|------|---------|--------|
| Statements | 80% | 90% |
| Branches | 80% | 90% |
| Functions | 80% | 90% |
| Lines | 80% | 90% |
| Critical Paths | 100% | 100% |

**Critical Paths (100% coverage required):**

- 有効な名前入力 → localStorage保存 → /bar遷移
- join イベント → サーバー側バリデーション → ブロードキャスト
- 空の名前 → エラー表示
- 21文字以上 → エラー表示
