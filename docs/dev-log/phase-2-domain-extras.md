# Phase 2 — Domain extras (Like, Block, Presence, Typing)

## 方針

spec Phase 計画の Phase 2。domain 層に「補助 entity」を 4 つ加える。Phase 1 で構築した User / Conversation / Message / Post の上に積む。

進め方は Phase 1 と同様、entity 単位で 1 PR ずつ:
- Phase 2-1: **Like** （+ `CandleId` を `LikeId` にリネーム — spec 語彙統一）
- Phase 2-2: Block
- Phase 2-3: Presence（volatile）
- Phase 2-4: Typing（volatile）

## Like 設計（Phase 2-1）

spec の I 行に対応。

### Fields
- `id: LikeId`
- `postId: PostId`
- `userId: UserId`
- `addedAt: Date`

### 不変条件
- `(postId, userId)` で system-wide unique（1 ユーザー 1 投稿に対して 1 like のみ）
  - DB unique 制約は repository / use case 層の責務
- カウントを他者に公開しない仕様は **集約 query の存在 / 不在** によって守る:
  - `countByPost(postId)` は提供する（自分の post 用、来店帳の "寄せられた燭" 用）
  - 他者の post に対する `countByPost` 呼び出しは use case 層で拒否する

### Domain にあえて持たないもの
- like 解除（unlike）は repository の `delete` のみ。entity を「toggled」状態で持たない
- count は read model（repository が query を返す）

### Like vs Candle の命名

design HTML では「燭を寄せる」UI 表現だが、spec の語彙ポリシー（BE は英語の generic 用語、UI で迷羊苑表現にマッピング）により BE では `Like`。既存の `CandleId` brand 型を `LikeId` にリネームして揃える。

### TDD cycle 記録（Phase 2-1）

#### 1. RED

`like.test.ts` 2 件先行 Write（factory の正常系 + readonly フィールド集合）。
`id.ts` で `CandleId` → `LikeId` rename、`index.ts` も追随。

```
FAIL  src/like/like.test.ts
Error: Failed to load url ./like
```

既存 69 件は緑のまま（rename は他に影響なし）。

#### 2. GREEN

最小実装:
- `like.ts`: `Like` 型 + `createLike` factory（validation は brand 型に委ねる）
- `repository.ts`: `LikeRepository` interface（`findById` / `findByPostAndUser` / `save` / `delete` / `countByPost` / `countReceivedByUser`）
- `index.ts` 公開 API 更新

```
Test Files  6 passed (6)
     Tests  71 passed (71)
```

typecheck 緑。

#### 3. REFACTOR

不要。Like は最小限の entity。「カウント他者非公開」仕様は port の存在/不在ではなく **use case 層で identity に基づき gate** する設計を選択。

## Block 設計（Phase 2-2）

- 互いに DM 不可、互いの post を Timeline 上で非表示、互いの presence 不可視
- fields: `id` / `blockerId` / `blockedId` / `createdAt`
- 一方向。「A が B をブロック」と「B が A をブロック」は別 record
- ただし **「両者のいずれかがブロック中なら相互的に影響する」** という解釈で use case 側が判定

`BlockRepository`:
- `findById` / `findBy(blockerId, blockedId)` / `save` / `delete`
- `existsBetween(a, b)` は無向で「いずれか方向に block があれば true」
- `listBlockedBy(blockerId)` で blocker が block している相手の UserId 一覧

### TDD cycle 記録（Phase 2-2）

#### 1. RED

`block.test.ts` 2 件先行 Write（正常系 + self-block 拒否）。`id.ts` に `BlockId` brand 追加。

```
FAIL  src/block/block.test.ts
Error: Failed to load url ./block
```

#### 2. GREEN

最小実装:
- `block.ts`: `Block` + `createBlock` factory（self-block 拒否）
- `repository.ts`: `BlockRepository`
- `index.ts` 公開 API 更新

```
Test Files  7 passed (7)
     Tests  73 passed (73)
```

typecheck 緑。

#### 3. REFACTOR

不要。entity は最小、ポリシー（相互的影響）は use case 側に持たせる方針を貫いた。

## Presence 設計（Phase 2-3）

- **揮発**（永続化しない、in-memory のみ）
- fields: `userId` / `status: 'online' | 'offline'` / `lastSeenAt`
- `User.presenceVisibility = 'invisible'` の場合、他者 view からは強制 `offline`（**完全非対称**: 秘匿者自身は他者の online を見える）

## Typing 設計（Phase 2-4）

- **揮発**
- fields: `conversationId` / `userId` / `startedAt`
- `TYPING_TTL_MS = 5_000`、`hasExpired(typing, now)` で expire 判定（boundary は inclusive）

`TypingRepository`:
- `findByConversationAndUser` / `set` / `clear`
- `listActiveByConversation(convId, now)`: implementer が `now` を見て expired を除外する

### TDD cycle 記録（Phase 2-3 + 2-4 統合）

両者とも volatile な小さい entity のため **1 PR に統合**。

#### 1. RED

- `presence.test.ts` 6 件 + `typing.test.ts` 6 件先行 Write
- `pnpm test`: `Failed to load url ./presence` / `./typing`
- 既存 73 件は緑のまま

#### 2. GREEN

- `presence.ts`: `Presence` + `createPresence` + **`visibleStatusTo`**（非対称 stealth を pure function として entity に閉じ込めた）
- `presence/repository.ts`: `PresenceRepository`（raw を返し viewer filter は entity 関数で）
- `typing.ts`: `Typing` + `createTyping` + `hasExpired` + `TYPING_TTL_MS`
- `typing/repository.ts`: `TypingRepository`
- `index.ts` 公開 API 更新

```
Test Files  9 passed (9)
     Tests  85 passed (85)
```

typecheck 緑。

#### 3. REFACTOR

不要。`visibleStatusTo` を entity に置いたことで、use case 側はこの純粋関数を呼ぶだけで秘匿仕様を強制できる。

---

## Phase 2 完了

Like / Block / Presence / Typing と各 Repository port が出揃った。

- 累計 test: **85 / 85**（27 time + 12 user + 7 conv + 11 msg + 12 post + 2 like + 2 block + 6 presence + 6 typing）
- 公開 API: `@me-me-en/domain` から全 entity + repo port が import 可能

次フェーズ: **Phase 3 (application use cases + BusinessHoursGuard)**
