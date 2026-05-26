# Phase 5 — Presentation (apps/web)

## 方針

spec Phase 計画 Phase 5。`apps/web` を厚く育てる。Phase 4-b/c (Auth.js / Socket.IO) を本 Phase に統合。

層スライス 6 PR:

- **Phase 5-0**（本 PR）: 共通基盤 — custom server + Auth.js v5 + DI composition root
- Phase 5-1: 認証フロー end-to-end（`/login` + `/onboarding` + 入店時の `registerUser`）
- Phase 5-2: 閉店中 + middleware（営業時間ガード + auth check）
- Phase 5-3: 手紙（DM）end-to-end（UI + Socket.IO リアルタイム）
- Phase 5-4: 軒先（Timeline）end-to-end（UI + Socket.IO）
- Phase 5-5: 己（Profile）

## Phase 5-0 範囲

- `apps/web/auth.ts`: Auth.js v5（Google provider、JWT session）
- `apps/web/.env.local.example`: AUTH_SECRET / AUTH_GOOGLE_* / DATA_STORE のテンプレ
- `apps/web/src/server/di/`: composition root
  - `repositories.ts`: 8 in-memory adapter を singleton として組み立て
  - `use-cases.ts`: 19 use case を ports と repo で結線
  - `index.ts`: re-export
- `apps/web/server.ts`: Next.js + Socket.IO 同居の HTTP server skeleton
- `apps/web/package.json`: deps 追加（`next-auth@5.0.0-beta.25` / `socket.io@4` / `tsx@4`）と scripts 変更（`tsx watch server.ts`）

## 設計判断

### Auth.js v5 vs v4
v5 (`next-auth@5.0.0-beta.25`) を採用。peer dep が現状 `next@^14 || ^15` を要求し、`next@16` で unmet peer 警告が出るが、API は安定動作する想定。仮に v5 が 16 対応リリースで stable になればすぐ更新。

### DI composition root を `apps/web/src/server/di/`に置く
- application 層は port を介して動くため、ここで in-memory adapter を結線
- 将来 Prisma adapter に切替する場合、`repositories.ts` 内の factory を差し替えるだけで完結
- use case は機能ごとに export し、Next.js の Server Component / API route から直接 import

### Custom server を採用
- spec で「Next.js Custom Server で Socket.IO 同居」確定
- `server.ts` を tsx で起動（`pnpm dev` / `pnpm start`）
- production も tsx 実行（後段で compiled JS に切替える余地）

### Auth と me-me-en User の関係
- Auth.js は Google OAuth identity のみ管理
- me-me-en の `User` entity の作成は別ステップ（onboarding 画面で `registerUser` を呼ぶ）
- session に Auth.js の `sub` が乗り、それを me-me-en User と紐付ける map を別途持つ（Phase 5-1 で実装）

## TDD cycle 記録（Phase 5-0）

Phase 5-0 は **構成のみ**のため unit test は書かない（factory 結線の test は Phase 5-1 以降の use case 呼び出し動作確認で代替）。`pnpm -F @me-me-en/web typecheck` を緑にして締める。

### 検証

- `pnpm install`: 緑（next-auth v5 beta + socket.io + tsx 追加）
- `pnpm -F @me-me-en/web typecheck`: 緑
- Auth.js peer warning は許容（v5 が next 16 対応すれば消える）

次フェーズ: **Phase 5-1 (認証フロー end-to-end)**

---

## Phase 5-1 — 認証フロー end-to-end

### 範囲

- `apps/web/auth.ts` を `apps/web/src/auth.ts` に移動（`@/auth` で参照可能に）
- callbacks 拡張: `jwt` で `findUserIdByEmail` 解決、`session` callback で `userId` を session に載せる
- `src/server/auth/session-bridge.ts`: 揮発 `Map<email, UserId>`（DATA_STORE=memory 用）
- `src/types/next-auth.d.ts`: `Session.userId? : UserId` / `JWT.userId? : UserId` 型 augmentation
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth `handlers` を re-export
- `src/middleware.ts`: 未ログイン→`/login`、ログイン済 + User 未登録→`/onboarding`、登録済が `/login` `/onboarding` 訪問時→`/chats`
- `src/app/(auth)/login/page.tsx`: 「暖簾をくぐる」server form → `signIn('google', { redirectTo: '/onboarding' })`
- `src/app/(auth)/onboarding/page.tsx`: server component で session check
- `src/app/(auth)/onboarding/onboarding-form.tsx`: client, server action 呼び出し
- `src/app/(auth)/onboarding/actions.ts`: `registerUserAction` で DI の `registerUser` を呼び `bindEmailToUser`

### 設計判断

- **email を bridge key**: User entity を変更せず in-memory map で対応。Postgres 切替時には `User.authProvider` + `User.authSub` + `findByAuthSub` repository method で置換予定
- **server action から DI を直接 import**: `@/server/di` を読み込む。tRPC や追加 API route を挟まない最短経路
- **middleware の責務分割**: auth gate のみを本 Phase に入れ、営業時間 redirect は Phase 5-2 に追加
- **next-auth v5 beta の JWT 型緩み**: callback signature で `token.userId` が `{} | null` に緩む現象あり。`(token as { userId?: UserId }).userId` で局所 cast して回避

### TDD cycle 記録（Phase 5-1）

UI 直接の unit test は書かず、typecheck を緑にして締める（E2E は Phase 6 で Playwright）。

主な躓き:
1. `@/auth` から `GET / POST` を直接 export しようとして失敗 → `handlers` を介す形に修正
2. `session.userId = token.userId` で branded type 不一致 → 局所 cast

検証:
- `pnpm -F @me-me-en/web typecheck`: 緑

次フェーズ: **Phase 5-2 (閉店中画面 + 営業時間 middleware)**

---

## Phase 5-2 — 閉店中画面 + 営業時間 middleware

### 範囲

- `src/app/(auth)/closed/page.tsx`: 営業時間外画面（server component）
  - 「閉店」大見出し
  - 「日が沈む頃、暖簾を出します。/ 月の昇る刻、またここでお会いしましょう。」
  - defensive redirect: `isOpen(new Date())` なら `/chats` に転送
- `src/app/(auth)/closed/closed-countdown.tsx`: 開店までのカウントダウン（client）
  - 1 秒ごとに残時間を再計算
  - 22:00 になったら `router.replace('/chats')`
- `src/middleware.ts`: business hours gate を auth より**先**に追加
  - 営業時間外 → `/closed`（`/closed`, `/api/auth`, `/api/health` を除く）
  - 営業時間内に `/closed` → `/chats`

### 設計判断

- **business hours gate を auth より前に**: 閉店中は誰も入れない（spec の「夜限定」コンセプト）。auth 状態に関わらず `/closed` へ
- **`/closed` 自体は public route**: 営業時間外でも表示可能、auth 不要
- **カウントダウンの基準時刻**: client 側で `new Date()` → JST 換算 → 当日 22:00 JST までの差分
- **server-side defensive redirect**: middleware で十分だが、`/closed` page 内でも `isOpen(now)` を確認して redirect（middleware を bypass される稀ケースへの保険）

### TDD cycle 記録（Phase 5-2）

UI レベルの unit test は書かず、typecheck を緑にして締める。E2E（営業時間外 → /closed redirect、22:00 跨ぎでの遷移）は Phase 6 で扱う。

- `pnpm -F @me-me-en/web typecheck`: 緑

次フェーズ: **Phase 5-3 (手紙 / DM end-to-end)**

---

## Phase 5-3 — 手紙（DM）UI

Phase 5-3 は範囲が大きいため、2 PR に分割:

- **Phase 5-3-a**: 共通 layout + `/chats` list + `/chats/[id]` thread + server action による送信
- **Phase 5-3-b**: Socket.IO server handlers + client 接続でリアルタイム反映

### Phase 5-3-a 範囲

- `src/app/(app)/layout.tsx`: server component、session + userId 二重 guard、`TopBar` + `Sidebar` + main slot
- `src/app/(app)/_components/top-bar.tsx`: 「迷羊苑 / 営業 二十二時 — 翌五時」固定表示
- `src/app/(app)/_components/sidebar.tsx`: 軒先 / 手紙 / 己 の 3 リンク
- `src/app/(app)/chats/page.tsx`: server component で `listConversations({ userId })` → list UI
- `src/app/(app)/chats/[conversationId]/page.tsx`: server component、`listConversations` で participant check（unknown は `notFound()`）→ `listMessages` → `ThreadView` に渡す
- `src/app/(app)/chats/[conversationId]/thread-view.tsx`: client、messages 表示 + composer。送信は server action 経由で即時 `setMessages`
- `src/app/(app)/chats/[conversationId]/actions.ts`: `sendMessageAction` → DI の `sendMessage` を呼び ISO 化した `MessageDto` を返す

### 設計判断

- **Server action ベースで先に動かす**: Socket.IO 結線を待たずに DM の「送れる/読める」を確認できる。Phase 5-3-b で Socket.IO リアルタイムを上に被せる
- **Date は ISO で client へ渡す**: Server Component / Client Component 境界で Date instance を渡すと serialization warning が出るため `MessageDto` で全部 string 化
- **layout の二重 guard**: middleware が auth + business hours を担うが、layout 側でも `session.userId === undefined` のときの redirect を明示
- **`/chats/[conversationId]` の participant check**: use case `listMessages` も participant 検証するが、UI で 404 を返したいので `listConversations` で事前確認

### TDD cycle 記録（Phase 5-3-a）

UI ユニットテストは書かず、typecheck で締める。

- `pnpm -F @me-me-en/web typecheck`: 緑

次: **Phase 5-3-b (Socket.IO 結線でリアルタイム化)**
