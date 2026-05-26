# Phase β-5-a — Prisma + Postgres schema + User pilot adapter

## 方針

β-5 巨大ピース（schema 設計 + 12 repository × Prisma adapter + DI 切替 + integration test + Render Postgres provision）を 4 つに分割し、本 phase は **最初のスライス** を実装する:

- schema.prisma の全 entity を一気に定義（後で部分追加すると migration ハシゴ）
- pilot として User 1 entity だけ Prisma adapter を実装し、DI で `DATA_STORE` 切替の素地を作る
- 他 entity は in-memory のまま残し、混在モードで動くことを type で保証
- 移行手順を README に追記

## 範囲

### schema.prisma

全 entity を 1 ファイルに（`packages/infrastructure/prisma/schema.prisma`）:

- `User` — id / nickname / bio / tone / presenceVisibility / currentSigns[] / joinedAt
- `Conversation` — participantA/B + rootPostId? + R1/R2 unique 制約
- `Message` — readByIds[] / deletedAt? + (conversationId, sentAt) index
- `Post` — nightId / deletedAt? + (nightId, postedAt) / authorId indexes
- `Like` — (postId, userId) unique
- `Block` — (blockerId, blockedId) unique
- `LoginHistory` — (userId, nightId) 複合 PK（idempotent）
- `PresenceEvent` — append-only、(userId, occurredAt) index
- `UserAuthIdentity`（新規）— provider/providerId → userId bridge。β-5-c で session-bridge.ts と置換

揮発系の Presence / Typing はスキーマに含めない（TTL 内のみ意味があるため）。

### User pilot adapter

- `packages/infrastructure/src/prisma/client.ts` — PrismaClient singleton（dev HMR で再生成しない globalThis pattern）
- `packages/infrastructure/src/prisma/user-repository.ts` — UserRepository を満たす実装
  - `findById` / `findByNickname`（findFirst で 1 件）/ `list`（joinedAt asc）/ `save`（upsert）
  - `toUser` で row → domain entity の hydration（branded 型は unsafe cast で復元）
- `packages/infrastructure/src/index.ts` から export

### DI 切替素地

- `apps/web/src/server/di/repositories.ts`:
  - `process.env.DATA_STORE === 'prisma'` の時は Prisma adapter、それ以外は in-memory
  - 他 entity は in-memory のままなので「User だけ Postgres、他は memory」の混在モードが動く

### env / docs

- `apps/web/.env.local.example` に `DATABASE_URL` をコメントアウトで追加
- `README.md` の「ステータス」「Prisma (β-5)」セクション追記

## 設計判断

- **branded ID は Prisma 側で再現しない**: domain layer の TypeScript branding（`UserId & { __brand: 'UserId' }`）は schema には伝わらないが、adapter の hydration 時に `as UserId` で復元すれば runtime コストはゼロ。schema は素の `String` に統一
- **schema を 1 ファイルに集約**: 部分 schema を追加していくと migration ファイルが分裂してメンテが辛い。本 phase で全 entity を確定させ、後続 phase は adapter 実装に集中する
- **Conversation の R2 制約**: `(participantAId, participantBId, rootPostId)` の Prisma `@@unique` は `rootPostId IS NULL` の場合 Postgres が「distinct」とみなしてしまうため、本来は partial unique index が必要。本 phase ではコメントだけ残し、migration ファイル生成時に手書きする（β-5-b or 後続）
- **Presence / Typing を除外**: 揮発、TTL 5s〜数秒、再起動で消えてよい。Postgres に乗せると IO 負荷が高い割に得るものが少ない。Redis 切替判断は β-5 完了後
- **UserAuthIdentity を新設**: 既存の email→userId in-memory bridge を将来 Postgres に置く前提のテーブル。β-5-a ではスキーマだけ用意、code 移行は β-5-c
- **PrismaClient singleton**: Next.js dev mode の HMR で client を作り直すと connection pool が枯渇する。`globalThis.prisma` に逃がす公式 pattern を採用
- **generated client は git ignore**: `packages/infrastructure/prisma/generated/` は postinstall / build で生成。commit しない
- **Prisma 5.x 固定**: Node 20.11 を要求する Prisma 7.x は手元の Node では起動できない。Prisma 5.22 で固定

## TDD cycle 記録

### 1. RED

- 本 phase は schema 設計 + pilot adapter のみ。新しい use case / port は無し
- 既存 application / domain test は port 経由なので、adapter 実装の正しさは型で保証される
- Postgres 実 DB を立てた integration test は β-5-c に分離

### 2. GREEN

- schema.prisma 作成、`prisma format` / `prisma generate` で Prisma Client 生成
- User pilot adapter 実装、infrastructure index.ts に export 追加
- DI 切替素地を repositories.ts に実装
- env.local.example と README 更新
- `pnpm -r typecheck`: 全 workspace 緑
- `pnpm -r test`: domain 88, application 125, infrastructure 42（既存維持、新 test 追加なし）
- `pnpm -F web build`: 緑

### 3. REFACTOR

- 不要。pilot を最小限に絞った
- 残課題: 他 11 adapter（Conversation, Message, Post, Like, Block, LoginHistory, PresenceEvent, …）、partial unique index、integration test、Render Postgres provision

## 残課題

- β-5-b: 主要 entity の Prisma adapter（Conversation, Message, Post, Like, Block）
- β-5-c: stats 系 entity の adapter（LoginHistory, PresenceEvent）+ UserAuthIdentity による session-bridge 置換 + integration test
- β-5-d: Render Postgres provision + render.yaml 更新 + migration 運用
- Task #4: ESLint 境界ルール
