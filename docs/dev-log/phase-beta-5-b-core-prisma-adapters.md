# Phase β-5-b — 主要 entity の Prisma adapter

## 方針

β-5-a の User pilot に続き、コア entity の Prisma adapter を一気に揃える。これで `DATA_STORE=prisma` 起動時に **MVPα コア機能**（DM / Timeline / Like / Block）がそのまま Postgres に乗る。残りは集計系（LoginHistory / PresenceEvent）と auth bridge（UserAuthIdentity）で、β-5-c で扱う。

## 範囲

### 追加した adapter

| Entity | 主な query | 注意点 |
| --- | --- | --- |
| Conversation | findById / findByPair / save / listByUser | participants を lex-asc 正規化（schema は participantAId / participantBId のペア） |
| Message | findById / save / listByConversation / countByConversationsInWindow | groupBy で bulk count、`gte from, lt to` 半開区間 |
| Post | findById / save / list(nightId? / authorId? / before? / limit?) | postedAt desc |
| Like | findById / findByPostAndUser / save / delete / countByPost / countReceivedByUser | countReceivedByUser は PostRepository を DI で受け取り cross-repo |
| Block | findById / findBy / save / delete / existsBetween / listBlockedBy / listBlockersOf | existsBetween は OR で両向き |

### schema 修正

実装中に 2 つの mismatch を発見、合わせて訂正:

- `Message.readByIds String[]` → `Message.readAt DateTime?` — domain 側は DM 1on1 の単一 readAt 値だった
- `Like.createdAt DateTime` → `Like.addedAt DateTime` — domain 側の field 名と統一

### DI 切替

`apps/web/src/server/di/repositories.ts`:

- DATA_STORE=prisma で 6 entity 全部を Prisma adapter に切替
- 揮発系 Presence / Typing は常に in-memory
- 集計系 LoginHistory / PresenceEvent は β-5-c まで in-memory のまま

## 設計判断

- **Like の countReceivedByUser を cross-repo**: in-memory 版と同じく `PostRepository.list({ authorId })` で post 一覧を取り、`prisma.like.count({ where: { postId: { in: ids } } })` で count。クエリ 2 発になるが、relation を schema に張らない方針なので素直
- **Conversation の participants 正規化を adapter 側で**: domain entity は既に正規化された tuple を持つ前提だが、findByPair 入口で念のため再正規化（防御的）
- **Message countByConversationsInWindow を groupBy で**: in-memory より明確に効率的。0 件の conversation は Map に含めて application 層の期待を満たす
- **Like.delete を `deleteMany({ where: { id } })`**: `delete` だと存在しない時に throw する。冪等性が欲しいので deleteMany を使う（in-memory 版と同じ挙動）
- **Block.delete も同様の冪等 deleteMany**
- **branded ID の取り扱い**: `ids as readonly string[] as string[]` で readonly キャスト → mutable string[] へ unsafe 二段キャスト。Prisma の `in` が `string[]` を要求するため
- **TS の build cache に注意**: schema 修正後に `prisma generate` で型は更新されたが `tsconfig.tsbuildinfo` が古い型を読み続けた。`rm -f *.tsbuildinfo` で解決

## TDD cycle 記録

### 1. RED

- adapter のロジックは既存 in-memory adapter と application test がカバーしている範囲
- 本 phase は port 同等性を type で保証するのみ。実 DB integration test は β-5-c に分離

### 2. GREEN

- 5 adapter を実装
- schema を 2 箇所訂正、`prisma generate` 再実行
- DI で全 6 entity を切替分岐に
- `pnpm -r typecheck`: 全 workspace 緑
- `pnpm -r test`: domain 88, application 125, infrastructure 42（既存維持）
- `pnpm -F web build`: 緑

### 3. REFACTOR

- 不要。adapter は in-memory と同じ shape の関数オブジェクトで、各 port メソッドが Prisma 呼出 1〜2 発に対応する素直な構造
- 残課題: integration test を実 Postgres で走らせる仕組み（β-5-c）、partial unique index for Conversation R2（migration 時）

## 残課題

- β-5-c: LoginHistory / PresenceEvent adapter + UserAuthIdentity による session-bridge 置換 + integration test
- β-5-d: Render Postgres provision + migration ファイル生成 + render.yaml 更新
- Task #4: ESLint 境界ルール
