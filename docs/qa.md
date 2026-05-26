# me-me-en — Local QA Guide

ローカル環境で MVPα + MVPβ の主要シナリオを手動 QA する手順。spec の正本は `docs/spec/product-spec.md`、自動 CI は GitHub Actions の `verify` / `integration` / `e2e` job で回す。本ドキュメントは **人間が画面を触って動作を確認する** ための補助。

## 0. 前提

- Node.js 20.11+ / pnpm 9.15 / Docker (Postgres モード時)
- Google Cloud Console で OAuth クライアントが発行済（redirect URI に `http://localhost:3000/api/auth/callback/google`）
- **営業時間**: JST 22:00 - 翌 05:00 のみ機能。それ以外は `/closed` に強制 redirect される

## 1. env 準備

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

`apps/web/.env.local` を編集:

- `AUTH_SECRET` = `openssl rand -hex 32` の出力
- `AUTH_GOOGLE_ID` = Google Cloud Console の OAuth クライアント ID
- `AUTH_GOOGLE_SECRET` = 同 secret
- `DATA_STORE=memory` (in-memory) または `prisma`
- `DATABASE_URL=postgresql://meimeitei:meimeitei@localhost:5432/meimeitei?schema=public` (prisma 時)

## 2. 起動

### A. in-memory モード（最速、process 再起動で消える）

```bash
pnpm install
pnpm -F @me-me-en/web dev
# → http://localhost:3000
```

### B. Postgres モード（永続化検証）

```bash
docker compose up -d
DATABASE_URL=postgresql://meimeitei:meimeitei@localhost:5432/meimeitei?schema=public \
  pnpm --filter @me-me-en/infrastructure exec prisma migrate deploy --schema=prisma/schema.prisma

DATA_STORE=prisma \
DATABASE_URL=postgresql://meimeitei:meimeitei@localhost:5432/meimeitei?schema=public \
  pnpm -F @me-me-en/web dev
```

後片付け:

```bash
docker compose down -v
```

## 3. QA チェックリスト

営業時間内（JST 22:00-05:00）に実行する。それ以外は (1) の `/closed` redirect だけが検証可能。

| カテゴリ | 確認項目 | 期待 |
| --- | --- | --- |
| (1) 営業時間 | 未認証 `/` | `/login` redirect |
| (1) 営業時間 | 営業時間外 `/login` | `/closed` に強制 redirect、カウントダウン表示 |
| (2) sign-in | `/login` 「暖簾をくぐる」 | Google OAuth → 戻ってきて `/onboarding` |
| (2) sign-in | `/onboarding` 名前送信 | `/chats` に到達 |
| (2) sign-in | 再度 `/login` 訪問（onboarding 済）| `/chats` に即 redirect |
| (3) Timeline | `/timeline` 投稿 | 自タブに表示 + 別タブ別 user で `post:new` realtime 反映 |
| (3) Timeline | Like / Reply | Like カウント更新、Reply は新規 conversation 起動 |
| (3) Timeline | 灯ともる羊リスト（右 rail）| 別タブ user の online 表示、disconnect で消える |
| (3) Timeline | Moon SVG（ヘッダ右上）| 当日の月相が描画 |
| (3) Timeline | 営業日終了（翌 05:00）| timeline 全 post が消える、自分の post は profile で見える |
| (4) DM | profile → 「直接話しかける」 | conversation 生成、`/chats/[id]` 遷移 |
| (4) DM | typing | 別タブで「入力中」表示、停止で消える（5s TTL）|
| (4) DM | message:new | 別タブにメッセージ即時表示 |
| (4) DM | 既読 | `readAt` セット、別タブで既読印が出る |
| (5) Profile | 自分の `/profile` | 来店帳 N（入店した夜が増える）、在席チャート、親しい羊 |
| (5) Profile | tone / nickname / bio / しるし 編集 | 保存後 reload しても反映 |
| (5) Profile | `presenceVisibility = invisible` 切替 | 別 user から「灯ともる羊」に出なくなる |
| (5) Profile | 他者 `/profile/[userId]` | stats 非表示、avatar / nickname / bio / しるし / presence のみ可視 |
| (6) Block | Block UI 動線 | **本セッションで未実装**。BE は完備 (`blockUser` use case + Prisma 永続化) |
| (6) Block | Block 効果検証（手動 DB 投入）| `psql` で `blocks` 行を入れる → 相手の post が timeline に出ない、DM 不可、灯ともる羊で消える |
| (7) health | `/api/health` | `{"status":"ok","service":"me-me-en"}` |

## 4. 既知の留意点

- `next-auth@5.0.0-beta.25` は `next@^14||^15` の peer warning が出るが next@16 で動作確認済
- Postgres モード再ログイン時、providerId（Google `sub`）が JWT に焼き付けられているなら identity 継続
- DM 1on1 + 同 process 内 socket.io 同居設計のため、別マシン / 別 instance からの接続は MVPβ 範囲外（Render 1 instance 想定）
- Render の再 deploy で in-memory データは消える（Postgres モードでは消えない）
- 営業時間判定は `Date.now()` ベース。OS の時計が JST 連動していること（CI / Render は UTC で動くが、`time.ts` の `isOpen` が JST に変換する）

## 5. bug を見つけたら

- 再現手順 + 期待 / 実際 + 該当 PR / commit を記録
- application 層の bug → `packages/application/.../*.test.ts` に regression test を追加して RED → 修正で GREEN
- presentation 層の bug → Playwright spec で再現できるなら `apps/web/tests/e2e/` に追加

## 6. 自動化済の項目（CI で常時検証）

- ESLint 境界ルール（clean architecture 層間依存）
- TypeScript（全 workspace `tsc --noEmit`）
- Vitest（domain 88 + application 125 + infrastructure 42 = 255 件）
- Postgres integration test（9 adapter × smoke、計 32 件）
- Playwright public-surface smoke（/api/health / / → redirect / /login or /closed render）

GitHub Actions の 3 job (`verify` / `integration` / `e2e`) で PR ごとに自動実行。
