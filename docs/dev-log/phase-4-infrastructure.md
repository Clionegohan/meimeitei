# Phase 4 — Infrastructure (in-memory repos + Auth.js + Socket.IO)

## 方針

`packages/infrastructure` を埋める。port (domain) の **production-grade な実装**を提供する。

3 つのサブフェーズに分ける:

- **Phase 4-a**: In-memory repository 実装（9 port、3 PR に細分）
  - **Phase 4-a-1**: User / Conversation / Message / Block（4 repo、本 PR）
  - **Phase 4-a-2**: Post / Like（2 repo）
  - **Phase 4-a-3**: Presence / Typing（2 repo、揮発）
- **Phase 4-b**: Auth.js v5 + Google OAuth provider 設定
- **Phase 4-c**: Socket.IO event-bus adapter（application の publisher port にアダプト）

## In-memory adapter の位置づけ

- application の test helpers（`__test-helpers__/fakes.ts`）と機能は重なるが、目的が違う:
  - test helpers: テスト用、state を露出して assertion 用に便利
  - infrastructure in-memory: production fallback（DATA_STORE=memory）、API 通り
- 将来 `DATA_STORE=prisma` 切替時にも、同じ interface で差し替え可能になるよう、本 adapter は **interface に忠実**に作る

## Phase 4-a-1 範囲

- `InMemoryUserRepository`
- `InMemoryConversationRepository`
- `InMemoryMessageRepository`
- `InMemoryBlockRepository`

### TDD cycle 記録（Phase 4-a-1）

#### 1. RED

`user-repository.test.ts` 5 件、`conversation-repository.test.ts` 4 件、`message-repository.test.ts` 3 件、`block-repository.test.ts` 5 件 = **17 件先行 Write**。

```
FAIL  src/in-memory/user-repository.test.ts
FAIL  src/in-memory/conversation-repository.test.ts
FAIL  src/in-memory/message-repository.test.ts
FAIL  src/in-memory/block-repository.test.ts
```

#### 2. GREEN

- `user-repository.ts`: `Map<UserId, User>`、findById / findByNickname / save / list
- `conversation-repository.ts`: `Map<ConversationId, Conversation>`。`findByPair` は input pair を正規化して domain の sorted tuple と比較
- `message-repository.ts`: `Map<MessageId, Message>`。`listByConversation` で `before` / `limit` cursor pagination、asc by sentAt
- `block-repository.ts`: `Map<BlockId, Block>`。`findBy` は方向付き、`existsBetween` は無向
- `index.ts` 公開 API

```
Test Files  4 passed (4)
     Tests  17 passed (17)
```

typecheck 緑。

#### 3. REFACTOR

不要。各 repo は Map ベースで小さい。application の test fakes と論理を共有するが、目的が違うので別パッケージで独立保持。

---

## Phase 4-a-2 範囲（残り 4 repo を 1 PR でまとめる）

- `InMemoryPostRepository`
- `InMemoryLikeRepository`（**`PostRepository` を依存に取る** — `countReceivedByUser` で author の post 集合を引くため）
- `InMemoryPresenceRepository`（揮発、Map keyed by userId）
- `InMemoryTypingRepository`（揮発、Map keyed by `${convId}:${userId}`、5s TTL filter）

### Like の countReceivedByUser

domain の `LikeRepository` は `countReceivedByUser(userId)` を契約しているが、自分の post への like を数えるには **post の author を知る必要**がある。in-memory adapter では:
- `createInMemoryLikeRepository(postRepository)` で `PostRepository` を依存注入
- `countReceivedByUser` は `postRepository.list({ authorId: userId })` で自分の post を取得 → like を filter

これで in-memory でも production-correct な実装になる。将来 Prisma 等の adapter では join クエリ 1 発で済む。

### TDD cycle 記録（Phase 4-a-2）

#### 1. RED

- `post-repository.test.ts` 4 件、`like-repository.test.ts` 5 件、`presence-repository.test.ts` 4 件、`typing-repository.test.ts` 4 件 = **17 件先行 Write**
- `pnpm test`: 4 file failed

#### 2. GREEN

- `post-repository.ts`: nightId / authorId / before / limit、desc by postedAt
- `like-repository.ts`: `createInMemoryLikeRepository(postRepository)` で post repo を依存注入。`countReceivedByUser` で自分の post を引き、その post への like を数える
- `presence-repository.ts`: `Map<UserId, Presence>`、揮発、`listOnline` で `online` のみ
- `typing-repository.ts`: `Map<\`${convId}:${userId}\`, Typing>`、揮発、`listActiveByConversation(now)` で 5s TTL 経過分を除外
- `index.ts` 公開 API 4 entries 追加

```
Test Files  8 passed (8)
     Tests  34 passed (34)
```

typecheck 緑。

#### 3. REFACTOR

不要。`like-repository` の依存注入 pattern は将来 Prisma adapter でも同じ shape を維持できる（join 1 発で済むのが利点）。

---

## Phase 4-a 完了

8 entity 全ての in-memory adapter が出揃った。

| Repository | File |
| --- | --- |
| User / Conversation / Message / Block | `packages/infrastructure/src/in-memory/*.ts`（PR #26） |
| Post / Like / Presence / Typing | （本 PR） |

- 累計 infrastructure test: **34 / 34**、typecheck 緑
- 公開 API: `@me-me-en/infrastructure` から `createInMemory*Repository` 8 件
- `DATA_STORE=memory` で全 use case が動く準備が整った

次フェーズ: **Phase 4-b (Auth.js v5 + Google OAuth provider)**
