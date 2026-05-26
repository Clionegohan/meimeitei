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
5. **データ永続化**: 現状 `DATA_STORE=memory` のため、Render のインスタンス再起動でデータは消える。Prisma 切替は MVPβ で対応

## ステータス

MVPα（コア体験）完了:
- 入店 / ご記帳 / 閉店中 / 軒先（投稿・Like・Reply）/ 手紙（DM realtime）/ 己（profile）

MVPβ（進行中）:
- β-1〜β-4: 来店帳統計 / 在席チャート / 親しい羊 / SheepBrush SVG / Moon / Block-aware broadcast 完了
- β-5 進行中: Prisma + Postgres adapter
  - β-5-a: schema + User pilot adapter（完）
  - β-5-b 以降: 他 entity の adapter / DI 完全切替 / Render Postgres provision

仕様の正本は `docs/spec/product-spec.md`、各 Phase の作業ログは `docs/dev-log/`。

## Prisma (β-5)

```bash
# 初回 generate（postinstall でも走らせるか検討中）
pnpm --filter @me-me-en/infrastructure exec prisma generate --schema=prisma/schema.prisma

# Postgres を立ち上げ、DATABASE_URL を .env.local に設定後、migration を実行
pnpm --filter @me-me-en/infrastructure exec prisma migrate dev --schema=prisma/schema.prisma --name init

# DATA_STORE=prisma で起動すると User entity だけ Postgres に永続化
DATA_STORE=prisma pnpm -F @me-me-en/web dev
```
