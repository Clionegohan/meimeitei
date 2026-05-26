# Phase 3 — Application use cases + BusinessHoursGuard

## 方針

spec Phase 計画の Phase 3。`packages/application` を埋めていく。entity 単位に 5 PR で分割（spec で合意済）:

- **Phase 3-0**: 共通基盤（`Clock` port、`BusinessHoursGuard` port + factory）
- **Phase 3-1**: User 系 use cases（`registerUser` / `updateProfile`）
- **Phase 3-2**: Conversation + Message 系（`startConversationByPost` (R1) / `startConversationDirect` (R2) / `sendMessage` / `markAsRead` / `listConversations` / `listMessages`）
- **Phase 3-3**: Post + Like 系（`createPost` / `deletePost` / `likePost` / `unlikePost` / `listTimeline` / `listOwnPosts`）
- **Phase 3-4**: Block + Presence + Typing 系（`blockUser` / `unblockUser` / `updatePresence` / `listOnlineUsers` / `updateTyping` / `clearTyping`）

`BusinessHoursGuard` はほぼすべての use case の冒頭で噛ます（読み取り系を含む。閉店中は閲覧もブロック）。

## Phase 3-0 設計

### Clock port
- `Clock.now(): Date`
- production では `() => new Date()` で実装。test では fixed clock を渡せる
- 「外部 input」を抽象化するシンプルなパターン

### BusinessHoursGuard port
- `ensureOpen(): void`（throws `ForbiddenError` if outside）
- 内部で `Clock.now()` を呼び、`domain` の `isOpen` で判定
- factory `createBusinessHoursGuard(clock: Clock)` で組み立て

### ApplicationError 命名

ApplicationError 独自階層は作らず、`@me-me-en/domain` の `ForbiddenError` / `NotFoundError` / `ValidationError` を再利用する（最小 dependency）。

### TDD cycle 記録（Phase 3-0）

#### 1. RED

`business-hours-guard.test.ts` 6 件先行 Write（境界カバー: 22:00 / 04:59 / 05:00 / 12:00 JST + clock 再評価テスト）。

```
FAIL  src/ports/business-hours-guard.test.ts
Error: Failed to load url ./clock ; Failed to load url ./business-hours-guard
```

#### 2. GREEN

- `ports/clock.ts`: `Clock` interface + `systemClock`（production 用）
- `ports/business-hours-guard.ts`: `BusinessHoursGuard` interface + `createBusinessHoursGuard(clock)` factory（domain の `isOpen` に委譲）
- `index.ts` 公開 API（application package 初の export）

```
Test Files  1 passed (1)
     Tests  6 passed (6)
```

typecheck 緑。

#### 3. REFACTOR

不要。`isOpen` は domain にあり、application は clock 経由でそれを呼ぶ薄い層。Phase 3-1 以降の use case は冒頭で `guard.ensureOpen()` を呼ぶパターンを踏襲する。

---

## Phase 3-1 — User use cases

### 範囲

- `IdGenerator` port + `systemIdGenerator`（branded id 生成、application 層）
- `registerUser` use case
- `updateProfile` use case

### 設計

#### `IdGenerator`
- 各 entity の brand id を返す port（`user()` / `conversation()` / `message()` / `post()` / `like()` / `block()`）
- production: `crypto.randomUUID()` で実装した `systemIdGenerator`
- test: deterministic sequential generator を helper として用意

#### `registerUser`
- 入力: `{ nickname }`
- 挙動: `BusinessHoursGuard.ensureOpen` → `findByNickname` で uniqueness → `createUser` factory → `save` → 戻り値 `User`
- onboarding 最小（nickname のみ必須、bio / tone / 等は default）

#### `updateProfile`
- 入力: `{ userId, patch: { nickname?, bio?, tone?, presenceVisibility?, currentSigns? } }`
- 挙動: `ensureOpen` → `findById`（無ければ `NotFoundError`）→ nickname 変更時のみ uniqueness（本人除く）→ `createUser` で再構築して validation 再実行 → `save` → 戻り値 `User`
- 「patch + 再 factory」パターンで immutability と validation を両立

### TDD cycle 記録（Phase 3-1）

#### 1. RED

- `__test-helpers__/fakes.ts` を共有 helper として用意（`jst` / `fixedClock` / `openGuard` / `closedGuard` / `sequentialIdGen` / `inMemoryUserRepo`）
- `id-generator.test.ts` 3 件、`register-user.test.ts` 5 件、`update-profile.test.ts` 7 件を先行 Write
- `pnpm test`: 3 file failed（`Cannot find module './id-generator' / './register-user' / './update-profile'`）
- 既存 6 件は緑のまま

#### 2. GREEN

- `ports/id-generator.ts`: `IdGenerator` interface + `systemIdGenerator`（`globalThis.crypto.randomUUID()`）
- `use-cases/user/register-user.ts`: `createRegisterUser` factory（ensureOpen → uniqueness → `createUser` → save → return）
- `use-cases/user/update-profile.ts`: `createUpdateProfile` factory（ensureOpen → findById [NotFoundError] → 変更時のみ uniqueness [self 除外] → `createUser` で再構築 → save → return）
- `index.ts` 公開 API 更新

```
Test Files  4 passed (4)
     Tests  21 passed (21)
```

typecheck 緑。

#### 3. REFACTOR

不要。`updateProfile` の「patch + `createUser` 再構築」パターンは domain factory の全 validation をそのまま再利用できるので簡潔。他の use case でも同じパターンを踏襲予定。

---

## Phase 3-2 — Conversation + Message use cases

予定の use case が 6 個（startConversationByPost / startConversationDirect / listConversations / sendMessage / markAsRead / listMessages）と多いため、**Phase 3-2-a（Conversation 系 3 件）** と **Phase 3-2-b（Message 系 3 件）** に分割して PR を立てる。

### Phase 3-2-a 範囲

- `startConversationByPost`（R1）
- `startConversationDirect`（R2）
- `listConversations`

新規 test helpers: `inMemoryConversationRepo`、`inMemoryPostRepo`、`inMemoryBlockRepo`。

### 設計

#### `startConversationByPost`（R1）
- 入力: `{ initiatorId, postId }`
- 挙動: `ensureOpen` → `PostRepository.findById(postId)` [`NotFoundError`] → ブロック関係チェック [`ForbiddenError`] → `ConversationRepository.findByPair([initiatorId, post.authorId], postId)` で**既存再利用** → 無ければ `createConversation` + `save`
- spec R: 投稿ごとに別 conversation

#### `startConversationDirect`（R2）
- 入力: `{ initiatorId, partnerId }`
- 挙動: `ensureOpen` → `UserRepository.findById(partnerId)` [`NotFoundError`] → ブロック関係チェック [`ForbiddenError`] → `findByPair([initiatorId, partnerId], null)` で**既存再利用** → 無ければ `createConversation` + `save`
- self-DM は `createConversation` factory が `ValidationError` を投げる
- spec R: 同じ相手で R2 は 1 conversation のみ

#### `listConversations`
- 入力: `{ userId }`
- 挙動: `ensureOpen` → `listByUser(userId)` → ブロック関係（相手側 / 自分側いずれかの方向に block があるもの）を除外 → 返却

### TDD cycle 記録（Phase 3-2-a）

#### 1. RED

- `fakes.ts` に `inMemoryConversationRepo` / `inMemoryPostRepo` / `inMemoryBlockRepo` を追加
- `start-conversation-by-post.test.ts` 5 件、`start-conversation-direct.test.ts` 6 件、`list-conversations.test.ts` 4 件を先行 Write
- `pnpm test`: 3 file failed（`Cannot find module ...`）
- 既存 21 件は緑のまま

#### 2. GREEN

- `start-conversation-by-post.ts`: ensureOpen → `PostRepository.findById` [`NotFoundError`] → `BlockRepository.existsBetween` [`ForbiddenError`] → `findByPair([initiator, postAuthor], postId)` で既存再利用 → なければ `createConversation` + `save`
- `start-conversation-direct.ts`: ensureOpen → `UserRepository.findById(partner)` [`NotFoundError`] → block check → `findByPair([initiator, partner], null)` で既存再利用 → なければ create（self-DM は factory が `ValidationError`）
- `list-conversations.ts`: ensureOpen → `listByUser` → 相手側との block 関係を順次 filter
- `index.ts` 公開 API 更新

```
Test Files  7 passed (7)
     Tests  36 passed (36)
```

typecheck 緑。

#### 3. REFACTOR

不要。**「ensureOpen → 関連 entity 探索 → block check → repository operation」** の use case パターンが確立。Phase 3-2-b 以降も踏襲する。

---

## Phase 3-2-b — Message use cases

### 範囲

- `sendMessage`
- `markAsRead`
- `listMessages`

### 設計

#### `sendMessage`
- 入力: `{ senderId, conversationId, body }`
- 挙動: `ensureOpen` → `ConversationRepository.findById` [`NotFoundError`] → sender が participant か（[`ForbiddenError`]）→ 相手とブロック関係なら [`ForbiddenError`] → `createMessage` factory（body validation）→ `MessageRepository.save` → return
- 「夜を跨いで残る手紙」(spec D) として永続化されるのは MessageRepository 実装の責務

#### `markAsRead`
- 入力: `{ readerId, messageId }`（`readAt` は clock）
- 挙動: `ensureOpen` → `findById(messageId)` [`NotFoundError`] → 当該 conversation を fetch して reader が participant か（[`ForbiddenError`]）→ `markAsRead(msg, clock.now())` で idempotent 更新 → save → return

#### `listMessages`
- 入力: `{ viewerId, conversationId, before?, limit? }`
- 挙動: `ensureOpen` → `findById(conv)` [`NotFoundError`] → viewer が participant か → `listByConversation(query)` で取得 → return

### TDD cycle 記録（Phase 3-2-b）

#### 1. RED

- `fakes.ts` に `inMemoryMessageRepo` を追加（asc by sentAt、`before` で cursor フィルタ）
- `send-message.test.ts` 6 件、`mark-as-read.test.ts` 5 件、`list-messages.test.ts` 5 件を先行 Write
- `pnpm test`: 3 file failed（`Cannot find module ...`）
- 既存 36 件は緑のまま

#### 2. GREEN

- `send-message.ts`: ensureOpen → `findById(conv)` [`NotFoundError`] → participant check [`ForbiddenError`] → counterpart block check → `createMessage` factory → save
- `mark-as-read.ts`: ensureOpen → `findById(message)` → `findById(conv)` → reader が participant か → `markAsRead` entity helper（idempotent）→ 変化時のみ save
- `list-messages.ts`: ensureOpen → conv 探索 → viewer participant check → `listByConversation` cursor pagination
- `index.ts` 公開 API 更新

```
Test Files  10 passed (10)
     Tests  52 passed (52)
```

typecheck 緑。

#### 3. REFACTOR

不要。「ensureOpen → 関連 entity 探索 → participant/block guard → entity op → repo op」 のパターンが完全に固まった。

---

## Phase 3-2 完了

Conversation 系（PR #19）+ Message 系（本 PR）の 6 use case 全てが実装済。

- 累計 application test: **52 / 52**
- 次フェーズ: **Phase 3-3 (Post + Like use cases)**

---

## Phase 3-3 — Post + Like use cases

予定 use case は 6 件、Phase 3-2 同様に 2 PR に分割:
- **Phase 3-3-a**（本 PR）: Post 系 4 件
  - `createPost`
  - `deletePost`
  - `listTimeline`
  - `listOwnPosts`
- **Phase 3-3-b**: Like 系 2 件（次 PR）
  - `likePost`
  - `unlikePost`

### 設計（Phase 3-3-a）

#### `createPost`
- 入力: `{ authorId, body }`
- 挙動: `ensureOpen` → `createPost` factory（`postedAt = clock.now()` から `nightIdOf` で nightId 導出。営業時間外なら domain が `ValidationError`、二重防御）→ `save` → return

#### `deletePost`
- 入力: `{ actorId, postId }`
- 挙動: `ensureOpen` → `findById` [`NotFoundError`] → `actor !== authorId` なら [`ForbiddenError`] → `markPostAsDeleted`（idempotent）→ 変化時のみ save → return
- spec で「Post 削除時、関連 R1 conv は orphan として残す」 — cascade なし

#### `listTimeline`
- 入力: `{ viewerId, nightId? }`
- 挙動: `ensureOpen` → `nightId` 未指定なら `currentNightId(clock.now())`（営業時間外なら ensureOpen で先に弾かれているので必ず非 null）→ `PostRepository.list({ nightId })` → block filter（viewer-author 間に block 関係があるものを除外）+ `deletedAt = null` の post のみ → return

#### `listOwnPosts`
- 入力: `{ authorId }`
- 挙動: `ensureOpen` → `PostRepository.list({ authorId })` → `deletedAt = null` のみ → return（spec C: 自分の過去 post を閲覧可、ただし削除済は履歴からも消える）

### TDD cycle 記録（Phase 3-3-a）

#### 1. RED

- `fakes.ts`: `inMemoryPostRepo` を `nightId` / `authorId` / `before` / `limit` 対応に拡張（desc by postedAt）
- `create-post.test.ts` 4 件、`delete-post.test.ts` 5 件、`list-timeline.test.ts` 5 件、`list-own-posts.test.ts` 4 件 = **18 件先行 Write**
- `pnpm test`: 4 file failed（`Cannot find module ...`）
- 既存 52 件は緑のまま

#### 2. GREEN

- `create-post.ts`: ensureOpen → `createPost` factory（domain で nightId 導出 + body validation を強制）→ save
- `delete-post.ts`: ensureOpen → `findById` [`NotFoundError`] → author check [`ForbiddenError`] → `markPostAsDeleted`（idempotent）→ 変化時のみ save
- `list-timeline.ts`: ensureOpen → `nightId` 解決（input 優先、なければ `currentNightId(clock.now())`）→ `list({ nightId })` → `deletedAt = null` + block filter
- `list-own-posts.ts`: ensureOpen → `list({ authorId })` → `deletedAt = null` filter
- `index.ts` 公開 API 更新

```
Test Files  14 passed (14)
     Tests  70 passed (70)
```

typecheck 緑。

#### 3. REFACTOR

不要。pattern 通り。`createPost` は domain factory が営業時間（`nightIdOf`）+ body validation を強制してくれるので use case は薄い。

---

### Phase 3-3-b 設計

#### `likePost`
- 入力: `{ userId, postId }`
- 挙動: `ensureOpen` → `findById(post)` [`NotFoundError`] → `post.deletedAt != null` なら [`ForbiddenError`]（defensive、UI からは到達しない）→ block check (post.authorId との間) → `findByPostAndUser(postId, userId)` で **既存があれば idempotent に return** → なければ `createLike` + `save` → return
- 戻り値: `Like`

#### `unlikePost`
- 入力: `{ userId, postId }`
- 挙動: `ensureOpen` → `findByPostAndUser` → あれば `delete` → なければ no-op（idempotent）
- 戻り値: `void`
- `deletedAt != null` の post でも unlike は許容（過去に付けた like を整理する用途）

### TDD cycle 記録（Phase 3-3-b）

#### 1. RED

- `fakes.ts` に `inMemoryLikeRepo` 追加（`countReceivedByUser` は cross-repo 依存のため 0 を返す簡素実装、コメントで明記）
- `like-post.test.ts` 6 件、`unlike-post.test.ts` 3 件 = 9 件先行 Write
- `pnpm test`: 2 file failed
- 既存 70 件は緑のまま

#### 2. GREEN

- `like-post.ts`: ensureOpen → `findById(post)` [`NotFoundError`] → `post.deletedAt != null` [`ForbiddenError`] → block check → `findByPostAndUser` で idempotent → なければ `createLike` + save
- `unlike-post.ts`: ensureOpen → `findByPostAndUser` → あれば `delete` → no-op（idempotent）
- `index.ts` 公開 API 更新

```
Test Files  16 passed (16)
     Tests  79 passed (79)
```

typecheck 緑。

#### 3. REFACTOR

不要。idempotent pattern は markAsRead / markPostAsDeleted と同じ流儀。

---

## Phase 3-3 完了

Post 系（PR #21）+ Like 系（本 PR）の 6 use case 全てが実装済。

- 累計 application test: **79 / 79**
- 次フェーズ: **Phase 3-4 (Block + Presence + Typing use cases)**

---

## Phase 3-4 — Block + Presence + Typing use cases

予定 6 use case を 2 PR に分割:
- **Phase 3-4-a**（本 PR）: Block 2 件
  - `blockUser`
  - `unblockUser`
- **Phase 3-4-b**（次 PR）: Presence + Typing 4 件
  - `updatePresence`
  - `listOnlineUsers`
  - `updateTyping`
  - `clearTyping`

### Phase 3-4-a 設計

#### `blockUser`
- 入力: `{ blockerId, blockedId }`
- 挙動: `ensureOpen` → `findBy(blockerId, blockedId)` で既存確認 → あれば idempotent return → なければ `createBlock` factory（self-block は ValidationError）+ save → return

#### `unblockUser`
- 入力: `{ blockerId, blockedId }`
- 挙動: `ensureOpen` → `findBy` → あれば `delete` → no-op（idempotent）

### TDD cycle 記録（Phase 3-4-a）

#### 1. RED

- `block-user.test.ts` 4 件、`unblock-user.test.ts` 3 件 = 7 件先行 Write
- `pnpm test`: 2 file failed
- 既存 79 件は緑のまま

#### 2. GREEN

- `block-user.ts`: ensureOpen → `findBy(blocker, blocked)` で idempotent → なければ `createBlock` factory（self-block reject）+ save
- `unblock-user.ts`: ensureOpen → `findBy` → あれば `delete`（idempotent）
- `index.ts` 公開 API 更新

```
Test Files  18 passed (18)
     Tests  86 passed (86)
```

typecheck 緑。

#### 3. REFACTOR

不要。block / unblock の idempotent pattern は like / unlike と同じ流儀。
