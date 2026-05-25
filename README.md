# me-me-en

夜限定の 1on1 DM + タイムライン Webアプリ。

## 概要

- **DM**: 1対1のリアルタイムメッセージング（typing / 既読 / オンライン状態）
- **タイムライン**: 営業日中のみ公開、営業日終了で他者からは非表示。自分の過去投稿は閲覧可
- **営業時間**: 22:00 - 翌05:00 のみログイン・利用可能
- **プレゼンス**: 表示・秘匿の切替可能

## 技術スタック（採用予定）

- TypeScript / Node.js 22 LTS
- Next.js 15 (App Router) + React 19
- Socket.IO v4（Next.js Custom Server に同居）
- Tailwind CSS + shadcn/ui
- Zod / Vitest / Playwright
- pnpm workspaces + Turborepo
- リポジトリ抽象 + In-Memory adapter から開始（後に Prisma + PostgreSQL）
- Render Web Service へデプロイ

## アーキテクチャ

クリーンアーキテクチャ。依存方向は外→内のみ。

```
apps/web                   ← Next.js + Socket.IO Custom Server
packages/
  contracts                ← クライアント・サーバ共有スキーマ（Zod）
  infrastructure           ← DB / Realtime adapters
  application              ← Use Cases / Ports
  domain                   ← Entities / Value Objects / Repository IF
```

## ステータス

初期セットアップ中。実装フェーズは `/Users/chiba_haruta/.claude/plans/purrfect-honking-lemur.md` の Plan を参照。
