# Phase β-4 — Block-aware realtime broadcast + presence:update fan-out

## 方針

β-3-b で「灯ともる羊リスト」を SSR で出したが、realtime 更新がなかった。さらに既存 `post:new` の broadcast は `broadcastToAll` で block を考慮していなかった（既存コメント自身が認めていた）。本 phase で 2 つを同時に解決する。

## 範囲

### (A) post:new の block-aware broadcast

- `domain` `BlockRepository.listBlockersOf(blockedId)` を追加（逆向き列挙）
- `infrastructure` in-memory adapter に実装 + 1 件のテスト
- `application/__test-helpers__/fakes.ts` の fake にも同実装
- `apps/web/src/server/realtime/io-bridge.ts` に `broadcastToAllExcept(excludeUserIds, event, payload)`
  - Socket.IO の `io.except(rooms)` を使い `user:{userId}` rooms を除外
- `apps/web/src/app/(app)/timeline/actions.ts`: `createPost` 後、
  - `listBlockedBy(authorId)` + `listBlockersOf(authorId)` を Promise.all で並列取得
  - 和集合を Set で重複除去し `broadcastToAllExcept` を呼ぶ
  - listConversations / listTimeline と同じ無向 block ポリシーに揃った

### (B) presence:update broadcast → router.refresh()

- `apps/web/server.ts`:
  - socket `connection` で `broadcastToAll('presence:update', { type: 'changed' })`
  - socket `disconnect` でも同様
- `apps/web/src/app/(app)/timeline/timeline-client.tsx`:
  - `presence:update` を listen し `useRouter().refresh()` を呼ぶ
  - → Server Component の `OnlineSheepList` が再 render され、`listOnlineUsers` の visibility / block が再評価される

## 設計判断

- **payload に userId を載せない**: presence:update を trigger-only にすることで、blocker / blocked / invisible 相手間で「誰が変わったか」がリークしない。client は SSR で正しい visibility / block 適用済の状態を取り直すだけ
- **author 単位の except scheme**: post 作成時に 2 query（`listBlockedBy` + `listBlockersOf`）で N＝block 数の小さい配列を取り、socket room 除外で broadcast。Postgres 切替時も `WHERE blocker_id = $author OR blocked_id = $author` 1 query にまとまる
- **trigger-only revalidate**: SSR を素直に再評価する方式は無駄が多いように見えるが、in-memory adapter なら `listOnlineUsers` は O(N) で済むため十分。Postgres 化後も「presence 変動は連発しないシグナル」なので影響は限定的
- **disconnect の broadcast 副作用**: socket.io の disconnect は graceful close でも abrupt drop でも発火するため、`broadcastToAll` を呼んでも他 client の revalidate は冪等。何度走っても結果同じ
- **既存 `broadcastToAll` は presence:update 専用に格下げ**: 既存コメント「block を MVPα では反映できない」を解消し、新しい責務（trigger broadcast）にコメントを更新

## TDD cycle 記録

### 1. RED

- `block-repository.test.ts` に `listBlockersOf` の test を追記（既存 5 → 6 件）
- `pnpm -F @me-me-en/infrastructure test`: fail（impl 未追加）

### 2. GREEN

- domain interface 拡張 → in-memory adapter / fakes に同実装
- io-bridge に `broadcastToAllExcept` 追加
- timeline/actions.ts と server.ts と timeline-client.tsx を結線
- `pnpm -r test`: 全 workspace 緑
  - domain 88 / 88
  - application 125 / 125
  - infrastructure **42 / 42**（既存 41 + 新 1）
- `pnpm -r typecheck`: 緑
- `pnpm -F web build`: 緑

### 3. REFACTOR

- 不要。block-aware の責務は author 単位で完結、presence:update は trigger-only に絞った最小設計
- 残課題: own profile page も presence:update で revalidate するかは検討（β-5 以降）。realtime は timeline page にとどめる

## 残課題

- β-5: Prisma + Postgres adapter（DATA_STORE=prisma の本実装）
- Task #4: ESLint 境界ルール
- 親しい羊 / chats list を realtime 反映するかは検討事項
