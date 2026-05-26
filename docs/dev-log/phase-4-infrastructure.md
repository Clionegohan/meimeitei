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
