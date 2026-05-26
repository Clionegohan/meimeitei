# me-me-en

夜限定の 1on1 DM + タイムライン Webアプリ。

## 概要

- **DM（手紙）**: 1対1のリアルタイムメッセージング（typing / 既読 / オンライン状態）
- **タイムライン（軒先）**: 営業日中のみ公開、営業日終了で他者からは非表示。自分の過去投稿は閲覧可
- **営業時間**: 22:00 - 翌05:00 JST のみログイン・利用可能
- **プレゼンス**: 表示・秘匿の切替可能（非対称 stealth）

## 技術スタック（採用）

- TypeScript / Node.js 20 LTS
- Next.js 16 (App Router) + React 19 + Tailwind 4
- Custom server (`server.ts`) で Next.js と Socket.IO v4 を同居
- Auth.js v5 + Google OAuth
- pnpm workspaces + Turborepo
- リポジトリ抽象 + In-Memory adapter（`DATA_STORE=memory`）、後に Prisma + PostgreSQL
- Render Web Service へデプロイ

## アーキテクチャ

クリーンアーキテクチャ。依存方向は外→内のみ。

```
apps/web                   ← Next.js + Socket.IO custom server
packages/
  contracts                ← クライアント・サーバ共有スキーマ
  infrastructure           ← in-memory adapter (将来 Prisma adapter)
  application              ← Use Cases / Ports
  domain                   ← Entities / Value Objects / Repository IF
```

## 開発

```bash
pnpm install
pnpm -F @me-me-en/web dev   # custom server を tsx watch で起動
```

- `pnpm -r typecheck` で全 workspace を型検査
- `pnpm -r test` で domain / application / infrastructure の Vitest
- `pnpm -F @me-me-en/web e2e` で Playwright E2E smoke（要 `pnpm exec playwright install` を一度実行）

## デプロイ（Render）

1. `render.yaml` を main にマージすれば Render が拾う
2. Render dashboard で env vars を設定（`sync: false` のもの）:
   - `AUTH_SECRET` — `openssl rand -hex 32` などで生成
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google Cloud Console で OAuth クライアントを発行
   - `AUTH_URL` — 公開 URL（例: `https://me-me-en.onrender.com`）
3. Render Web Service の Custom Domain を設定する場合、Google OAuth の redirect URI に `https://<your-domain>/api/auth/callback/google` を追加
4. デプロイ後、`https://<your-domain>/api/health` が `{"status":"ok"}` を返せば最低限の死活 OK
5. **データ永続化**: `render.yaml` で Postgres を declarative に作成、`DATABASE_URL` を自動 inject。build phase で `prisma migrate deploy` が実行され、pending migration を自動適用する

## ステータス

MVPα（コア体験）完了:
- 入店 / ご記帳 / 閉店中 / 軒先（投稿・Like・Reply）/ 手紙（DM realtime）/ 己（profile）

MVPβ 完了:
- β-1〜β-4: 来店帳統計 / 在席チャート / 親しい羊 / SheepBrush SVG / Moon / Block-aware broadcast
- β-5: Prisma + Postgres adapter（9 entity 全部 + migration + Render provision）

仕様の正本は `docs/spec/product-spec.md`、各 Phase の作業ログは `docs/dev-log/`。

## Prisma / Postgres 運用

```bash
# 初回: Prisma Client を生成
pnpm --filter @me-me-en/infrastructure exec prisma generate --schema=prisma/schema.prisma

# 開発時: ローカル Postgres を立ち上げ、DATABASE_URL を apps/web/.env.local に設定
# その後 migration を適用
pnpm --filter @me-me-en/infrastructure exec prisma migrate deploy --schema=prisma/schema.prisma

# DATA_STORE=prisma で起動すると 9 entity すべて Postgres に永続化される
DATA_STORE=prisma pnpm -F @me-me-en/web dev

# schema 変更時: 新しい migration を生成（実 DB が必要）
pnpm --filter @me-me-en/infrastructure exec prisma migrate dev --schema=prisma/schema.prisma --name <description>
```

### Integration test

実 Postgres に対する Prisma adapter のテスト:

```bash
# Postgres を起動 (docker compose)
docker compose up -d

# DATABASE_URL を環境変数で渡して integration test
DATABASE_URL=postgresql://meimeitei:meimeitei@localhost:5432/meimeitei?schema=public \
  pnpm --filter @me-me-en/infrastructure test:integration

# 後片付け
docker compose down -v
```

CI では GitHub Actions の `services.postgres` 経由で同じテストを走らせる（`verify` job が緑になった後に `integration` job が回る）。

### Migration

- `packages/infrastructure/prisma/migrations/0_init/migration.sql` が initial schema を作る
- 末尾に `conversations_pair_direct_key` partial unique index を手書きで追加している（`rootPostId IS NULL` の direct conversation を一意化、Prisma が partial unique index を schema で表現できない制限のため）
- 以降の migration は `prisma migrate dev` で自動生成し、Postgres 固有の制約は同様に手書きで足す
