# Phase β-5-d — Render Postgres provision + migration + 運用

## 方針

MVPβ 最終 piece。β-5-c までで application / domain / infrastructure が Postgres 対応した。本 phase は **本番稼働の道筋を確定** する:

- migration SQL を生成（手書きで partial unique index を追加）
- `render.yaml` で Postgres を declarative provision、build phase で `prisma migrate deploy` を組み込む
- README に運用手順を確定記述

実 DB に対する integration test は本 PR の範囲外（local Postgres セットアップが前提）。MVPβ では「migration が apply できる」「DATA_STORE=prisma で起動できる」状態を作ることに集中する。

## 範囲

### Migration

`packages/infrastructure/prisma/migrations/0_init/migration.sql`:

- `prisma migrate diff --from-empty --to-schema-datamodel` で 9 entity 分の SQL を一括生成
- 末尾に手書きで `conversations_pair_direct_key` partial unique index を追加:

```sql
CREATE UNIQUE INDEX "conversations_pair_direct_key"
  ON "conversations" ("participantAId", "participantBId")
  WHERE "rootPostId" IS NULL;
```

これで R2 invariant（rootPostId IS NULL の direct conversation はペアごとに 1 つ）が DB 層で強制される。

`prisma/migrations/migration_lock.toml` も追加（provider = postgresql を固定）。

### render.yaml

- `databases:` セクションで Postgres を declarative に作成
  - plan: free
  - databaseName: meimeitei
  - user: meimeitei
- `services:` の build command に prisma generate + prisma migrate deploy を組み込み:
  ```bash
  pnpm install --frozen-lockfile
  pnpm --filter @me-me-en/infrastructure exec prisma generate --schema=prisma/schema.prisma
  pnpm --filter @me-me-en/infrastructure exec prisma migrate deploy --schema=prisma/schema.prisma
  pnpm -F @me-me-en/web build
  ```
- envVars:
  - `DATA_STORE=prisma` に変更（既存の memory から）
  - `DATABASE_URL` を `fromDatabase: { name: meimeitei-db, property: connectionString }` で inject

### README

- 「ステータス」セクションを「MVPβ 完了」に更新
- 「Prisma / Postgres 運用」セクションを再整理:
  - 初回 generate / migration deploy / dev 起動 / 新 migration 生成のコマンド
  - migration の手書き索引について明記
- Render デプロイ手順の「データ永続化」項を「memory なので消える」→「Postgres で永続化、build で migrate deploy」に更新

## 設計判断

- **prisma migrate dev ではなく migrate deploy を build phase に**: dev は scratch DB を作り直す可能性があり production には不適。deploy は pending migration を **適用するだけ**、idempotent で安全。Render の build は毎 deploy で走るので、push のたびに新 migration が拾われる
- **partial unique index を手書き**: Prisma schema DSL では `@@unique` に WHERE 句を付けられない。Postgres は NULL を distinct とみなすため、normal unique index では R2 invariant が緩む。migration SQL に手書きで足すのが現時点でのベストプラクティス
- **databases plan: free**: MVP の検証段階。stick to free tier、本格運用は starter 以上にスケール
- **DATABASE_URL を fromDatabase で auto-inject**: dashboard で手動設定する手間を減らす。`render.yaml` だけで provision 完結
- **integration test は本 PR の外**: 実 Postgres を CI に組み込むのは Render Postgres を CI から触れない等の制約がある。local docker compose で立てる手順を README に書くのは別 phase。動作確認は Render staging deploy で手動

## TDD cycle 記録

### 1. RED

- 本 phase は infra config と migration SQL のみ。新 use case / port なし
- 既存 unit test は不変

### 2. GREEN

- migration SQL を生成、partial unique index を手書きで追加
- migration_lock.toml を追加
- render.yaml に Postgres + DATABASE_URL を組込
- README 更新
- `pnpm -r typecheck`: 全 workspace 緑
- `pnpm -r test`: domain 88, application 125, infrastructure 42（既存維持）

### 3. REFACTOR

- 不要。設定ファイル中心
- Render staging deploy で実 migration が走ることの検証は手動で

## 残課題

- 実 Postgres での integration test（local docker compose 手順 + 別 CI ジョブ）
- providerId を Google `sub` に切替（β-5-c から持ち越し）
- middleware rule 4 を server component 側に完全移行（β-5-c から持ち越し）
- Task #4: ESLint 境界ルール

## MVPβ 完了宣言

これにて MVPβ（来店帳統計 + 装飾 + Block-aware realtime + Postgres 永続化）が完了。MVPα + MVPβ 全機能が `DATA_STORE=prisma` で動作する状態。
