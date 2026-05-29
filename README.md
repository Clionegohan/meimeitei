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

`render.yaml` で Postgres + Web Service が declarative に定義済。コード・設定は揃っており、必要なのは **外部 credential の取得と Render dashboard での env 投入のみ**。

### 1. Google OAuth client を発行

Google Cloud Console → APIs & Services → Credentials → "Create Credentials" → **OAuth client ID**（Application type: Web application）:

- **Authorized JavaScript origins**: `https://<your-app>.onrender.com`（カスタムドメインを使うならそれも）
- **Authorized redirect URIs**: `https://<your-app>.onrender.com/api/auth/callback/google`

発行された Client ID と Client Secret を控える。

### 2. Render dashboard で env を設定

`render.yaml` で `sync: false` 指定済の 4 件を手動投入:

| key | 値 |
| --- | --- |
| `AUTH_SECRET` | `openssl rand -base64 32` で生成 |
| `AUTH_GOOGLE_ID` | 上記の OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | 上記の OAuth Client Secret |
| `AUTH_URL` | 公開 URL（例: `https://me-me-en.onrender.com`、末尾スラッシュ無し） |

`DATABASE_URL` は `render.yaml` の `fromDatabase` で auto-inject、手動設定不要。

### 3. デプロイ

main にマージすると Render が render.yaml を拾って自動 build / deploy。build phase の処理:

1. `pnpm install --frozen-lockfile`
2. `prisma generate` → `prisma migrate deploy`（`0_init` + `1_add_favorite_moon` を適用）
3. `pnpm -F @me-me-en/web build`（Next.js 本番ビルド）
4. start: `pnpm -F @me-me-en/web start`（= `NODE_ENV=production tsx server.ts`）で listen

### 4. 動作確認

- `https://<your-app>.onrender.com/api/health` → `{"status":"ok",...}` を返せば listen OK
- `/login` で Google OAuth フロー → `/onboarding`（nickname 登録）→ `/timeline` / `/chats` 等が見える
- 営業時間外（05:00-22:00 JST）にアクセスすると `/closed` へ redirect されることも確認

### ⚠ 本番で「立ててはいけない」env

| key | 立てると |
| --- | --- |
| `E2E_TEST_ENABLED` | `/api/test/{login,seed,seed-dummy}` の dev seed/login endpoint が有効化され、誰でも任意ユーザーとしてログイン可能になる |
| `BYPASS_BUSINESS_HOURS` | 22:00-05:00 JST の営業時間ゲートが無効化される |

両者は内部で `NODE_ENV !== 'production'` の二重ガードを持つが、念のため Render dashboard で**絶対に設定しない**。

### プラン

- **Database**: free（90 日で削除、データ消える）。MVP 検証段階向け。長期運用は starter 以上へ移行
- **Web**: starter（sleep なし、常時稼働）

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
