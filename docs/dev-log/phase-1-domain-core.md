# Phase 1 — Domain core (Conversation, Message, Post)

## 方針

spec Phase 計画の Phase 1。domain 最内層に **Conversation / Message / Post** entity を作る。

User refactor (PR #10) は完了済、SignTag / Tone も整っている。Phase 1a (BusinessHours / Night) も整備済 (PR #3)。本 Phase はその上に「会話と投稿」のコア型を載せる。

**進め方:** 各 entity を 1 PR ずつ切る。
- Phase 1-1: Conversation
- Phase 1-2: Message
- Phase 1-3: Post

3 entity すべて完了後、Phase 2（domain extras: Like, Block, Presence, Typing）に進む。

## Conversation 設計（Phase 1-1）

### Fields
- `id: ConversationId`
- `participantIds: readonly [UserId, UserId]`（正規化済 = lex 昇順ソート）
- `rootPostId: PostId | null`
  - `null` → R2 起動（直接話しかけ）。同じペアで 1 conversation のみ
  - `PostId` → R1 起動（投稿への返信）。投稿ごとに別 conversation
- `openedAt: Date`

### 不変条件（spec の R 行に対応）
- `(participantIds の正規化ペア, rootPostId)` で system-wide unique
  - factory ではペア正規化と self-conversation 拒否を行う
  - **DB レベルの unique 制約** は repository / use case 層の責務（domain entity 側で強制しない）
- `participantIds` は **異なる 2 人**（self-conversation 不可）

### Domain にあえて持たないもの
- `nightCount`: derived。Phase 3 で `ConversationRepository.countNightsFor(convId)` クエリとして計算
- ブロック関係チェック: use case 側
- 営業時間ガード: use case 側 `BusinessHoursGuard`

### TDD cycle 記録（Phase 1-1）

#### 1. RED

`packages/domain/src/conversation/conversation.test.ts` を spec 仕様で先行 Write（7 件: R1/R2 作成・正規化・self-pair 拒否・normalizeParticipants ユーティリティ）。

```
FAIL  src/conversation/conversation.test.ts
Error: Failed to load url ./conversation
```

User / time suite は緑のまま (39/39)。期待通り。

#### 2. GREEN

最小実装:
- `conversation.ts`: `Conversation` 型 + `createConversation` factory + `normalizeParticipants` ユーティリティ
- `repository.ts`: `ConversationRepository` interface
- `index.ts`: 公開 API に追加

```
Test Files  3 passed (3)
     Tests  46 passed (46)
```

typecheck も緑。

#### 3. REFACTOR

不要。entity は immutable readonly tuple、factory は spec の不変条件（lex 正規化 + self-pair 拒否）のみを担当。R2 既存再利用や R1 投稿ごと別 conv は repository / use case 層の責務として明確に分離。

## Message 設計（Phase 1-2）

- fields: `id` / `conversationId` / `senderId` / `body` / `sentAt` / `readAt: Date | null` / `deletedAt: Date | null`
- `body` 1–280 graphemes（空メッセージは送信不可、改行は保持）
- `deletedAt != null` の場合は body を返さず、presentation で「取り消されました」placeholder

`MessageRepository`:
- `findById` / `save` / `listByConversation`
- `listByConversation` は cursor-based pagination（`before: Date`, `limit?`）。並び順は **ascending by sentAt**（古い順、chat 慣例）

純粋関数:
- `markAsRead(msg, readAt)`: idempotent。既読なら同インスタンスを返す
- `markAsDeleted(msg, deletedAt)`: idempotent。`readAt` は維持

### TDD cycle 記録（Phase 1-2）

#### 1. RED

`message.test.ts` を spec 仕様で先行 Write（11 件: factory + validation + markAsRead / markAsDeleted の immutability・idempotency・read/delete 順序保持）。

```
FAIL  src/message/message.test.ts
Error: Failed to load url ./message
```

#### 2. GREEN

最小実装:
- `message.ts`: `Message` 型 + `createMessage` + `markAsRead` + `markAsDeleted`
- `repository.ts`: `MessageRepository` interface + `ListMessagesQuery` 型（cursor-based）
- `index.ts` 公開 API 更新

```
Test Files  4 passed (4)
     Tests  57 passed (57)
```

typecheck 緑。

#### 3. REFACTOR

不要。`markAsRead` / `markAsDeleted` は早期 return で副作用なし。`graphemeLength` は User と重複しているが、Phase 1 中に shared util 化するか後で判断する（YAGNI）。

## Post 設計（Phase 1-3） — Phase 1-2 完了後

- fields: `id` / `authorId` / `body` / `postedAt` / `nightId` / `deletedAt: Date | null`
- `body` 1–280 graphemes
- visibility は use case 側で判定:
  - `postedAt` の nightId == current nightId → 他者公開
  - それ以外 → 自分のみ可視
- Post への like 累計は別 read model（Phase 2 Like で扱う）
- Post 削除時、関連 R1 Conversation は orphan（cascade なし）— Phase 3 で扱う
