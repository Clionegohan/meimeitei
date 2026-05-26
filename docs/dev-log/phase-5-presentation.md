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
