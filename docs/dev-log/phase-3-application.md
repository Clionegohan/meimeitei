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

### TDD cycle 記録

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
