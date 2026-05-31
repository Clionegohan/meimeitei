# CLAUDE.md

me-me-en — 夜限定の 1on1 DM + タイムライン Web アプリ。
製品仕様の正本は `docs/spec/product-spec.md`、各 Phase の作業ログは `docs/dev-log/`、全体像は `README.md`。

## アーキテクチャ（依存方向を厳守）

クリーンアーキテクチャ。依存は外→内のみ。内側（domain）は外側を知らない。

```
apps/web                  Next.js 16 (App Router) + React 19 + Socket.IO custom server (server.ts)
packages/contracts        クライアント・サーバ共有スキーマ（zod）
packages/infrastructure   adapter: in-memory / Prisma(Postgres)。DATA_STORE で切替
packages/application      Use Cases / Ports
packages/domain           Entities / Value Objects / Repository インターフェース
packages/config           共有設定
```

- domain → 他パッケージへ依存禁止。application は domain のみ。infrastructure が domain の IF を実装。
- 新機能は内側（domain）から外側（web）へ向けて積む。

## コマンド

```bash
pnpm install
pnpm -F @me-me-en/web dev          # custom server を tsx watch 起動（22:00-05:00 JST のみ利用可）
pnpm -r typecheck                  # 全 workspace 型検査
pnpm -r test                       # domain/application/infrastructure の Vitest
pnpm lint                          # eslint（flat config）
pnpm format                        # prettier 整形
pnpm -F @me-me-en/web e2e          # Playwright smoke（要 playwright install）
```

Prisma / Postgres・integration test・Render デプロイ手順は README.md を参照。

## 開発規約

- **TDD 必須** — test 先行（RED → GREEN → REFACTOR）。coverage 80%+。
- **Phase 毎に dev-log** — `docs/dev-log/` に方針と経緯を残す。
- **GitHub Flow 必須** — feature branch → PR → merge commit。main へ直 push 禁止。
- **spec は対話で詰める** — 仕様の曖昧点は 1 件ずつ合意してから実装。
- immutable パターン（mutation 禁止）、小さく多数のファイル、構造化 logger（`console.log` のデバッグ出力を残さない）。

## 環境メモ

- pnpm@9.15.0 / Node 20 LTS / TypeScript 5.7 / ESM（`"type": "module"`）
- データ層は `DATA_STORE=memory`（既定）/ `DATA_STORE=prisma`
- 営業時間 22:00-05:00 JST のロジックがログイン・タイムライン公開を制御する
