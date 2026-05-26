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
