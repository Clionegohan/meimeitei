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

---

## Phase 5-3-b — Socket.IO によるリアルタイム DM

### 範囲

- `apps/web/package.json`: `socket.io-client@^4.8.1` 追加
- `src/server/realtime/io-bridge.ts`: process-wide な `SocketIOServer` ref を保持し、`broadcastToConversation` / `broadcastToUser` を提供
- `server.ts`: io を生成して `setIoServer(io)`。`io.use` で `handshake.auth.userId` の最小認証（MVPα 用）。`socket.data.userId` に保存。以下のイベントを実装:
  - `conversation:join` / `conversation:leave`（room 管理）
  - `typing:start` / `typing:stop` → `typing:update` を room broadcast（TypingRepository は経由せず transport-only）
  - `user:{userId}` room には接続時に自動 join
- `src/lib/socket-client.ts`: client side singleton `getSocket(userId)`
- `src/app/(app)/chats/[conversationId]/thread-view.tsx`:
  - `useEffect` で `conversation:join` → `message:new` / `typing:update` を購読
  - 入力時に typing 開始、3s idle で typing 停止（debounce）
  - 送信成功時に同じ id の重複追加を弾く（自分の broadcast を受けてしまう前提）
- `src/app/(app)/chats/[conversationId]/actions.ts`: `sendMessageAction` 内で `broadcastToConversation(convId, 'message:new', dto)` を呼ぶ

### 設計判断

- **transport-only な typing**: MVPα では TypingRepository を経由せず Socket.IO で broadcast のみ。サーバ再起動で消えてもユーザー体験への影響は実質ゼロ。Phase 3-4 の use case はそのまま温存
- **broadcast 単位は `conv:{conversationId}` room**: メッセージ送信は当該 conv の参加 socket のみへ。`user:{userId}` room は presence 通知用に確保（Phase 5-4 で使う）
- **client-side 認証は handshake の `userId` 直渡し**: production 化のときは cookie / JWT 検証に置換予定（Auth.js セッションを server.ts 側で parse する）
- **`io-bridge.ts` の module-level singleton**: tsx + custom server で同一 Node プロセス内なので、server action から module import で参照できる。Next.js の HMR は server.ts を再 evaluate しないので dev でも安定

### TDD cycle 記録（Phase 5-3-b）

UI ユニットテストは書かず、typecheck で締める。E2E（2 タブで送受信 / typing 表示）は Phase 6 で扱う。

- `pnpm install`: 緑（socket.io-client 追加）
- `pnpm -F @me-me-en/web typecheck`: 緑

次フェーズ: **Phase 5-4 (軒先 / Timeline end-to-end)**

---

## Phase 5-4 — 軒先（Timeline）UI

Phase 5-3 と同様に 2 PR に分割:

- **Phase 5-4-a**（本 PR）: Timeline UI + 投稿 + Like（server action）
- **Phase 5-4-b**: Reply (post → DM 起動 R1) + Socket.IO `post:new` リアルタイム反映

### Phase 5-4-a 範囲

- `src/app/(app)/timeline/page.tsx`: server component。`listTimeline({ viewerId })` で「今宵」の post を取得し、各 post について `likeRepository.findByPostAndUser` で `iLiked` を解決
- `src/app/(app)/timeline/composer.tsx`: client。`createPostAction` 呼び出し後 `router.refresh()` で server component 再 fetch
- `src/app/(app)/timeline/post-card.tsx`: client。like toggle ボタン（optimistic update + 失敗 rollback）
- `src/app/(app)/timeline/actions.ts`: `createPostAction` / `likePostAction` / `unlikePostAction`
- フィード末尾に「ここから 今宵 が 始まりました」マーカー（spec C 行）

### 設計判断

- **`iLiked` 解決は presentation 層で `likeRepository` 直叩き**: 「post + 自分が like 済か」の view-model を返す use case は domain に無く、application 層に追加するか、apps/web で組み立てるかの選択。MVPα では後者で済ませ、必要なら application に `listTimelineWithMyLikes` を切り出す
- **like の optimistic update**: ボタン押下時に即座に UI を反転、サーバ失敗時のみ rollback。「カウント他者非公開」仕様により他人の状態を待つ必要がないので素直に動く
- **`router.refresh()` で server component を更新**: WebSocket でリアルタイム化するのは Phase 5-4-b。それまでは投稿フォーム submit 後の手動再 fetch
- **「応える」ボタンは Phase 5-4-b 持ち越し**: post → R1 DM 起動 use case を呼ぶ + `/chats/[newConvId]` に遷移、という多段フローのため別 PR で扱う

### TDD cycle 記録（Phase 5-4-a）

UI ユニットテストは書かず、typecheck で締める。

- `pnpm -F @me-me-en/web typecheck`: 緑

次: **Phase 5-4-b (Reply + Socket.IO realtime)**

---

## Phase 5-4-b — Reply (post → DM 起動) + Socket.IO リアルタイム

### 範囲

- `src/server/realtime/io-bridge.ts`: `broadcastToAll(event, payload)` を追加（全 connected socket への fan-out）
- `(app)/timeline/actions.ts`:
  - `createPostAction` の戻り値を `PostDto` フル化、内部で `broadcastToAll('post:new', dto)` を呼ぶ
  - `replyToPostAction` 追加。`startConversationByPost` を呼び、戻りの conversationId を返す
- `(app)/timeline/post-card.tsx`:
  - 自分の post 以外にのみ「応える」ボタンを表示
  - クリックで `replyToPostAction` → 成功時 `router.push('/chats/{convId}')`
  - エラー時はカード内に表示
- `(app)/timeline/timeline-client.tsx`: 新規 client component。`initialPosts` を state で hold し、`socket.on('post:new', ...)` で新着を prepend（dedupe by id）
- `(app)/timeline/page.tsx`: `<TimelineClient initialPosts={postDtos} myUserId={userId} />` に切替

### 設計判断

- **`post:new` は全 broadcast**: spec の block filter を厳密に守るには room を user 単位に切る等の重い設計が必要。MVPα では全 broadcast し、block の反映は次回 page refresh 時。リアルタイムでは緩めの整合性
- **「応える」は自分の post に出さない**: 自分の post に R1 conv を切る意味がないため、`isMine` で button を隠す
- **`router.push('/chats/{convId}')` で遷移**: server action で conv 作成 → 即 DM 画面へ。新規 conv の場合は init 状態（messages 空）が見える
- **`createPostAction` 戻り値を `PostDto` フル化**: realtime fan-out 後、sender 自身のタブも broadcast を受信して duplicate しないよう、`id` を含む dto を返す

### TDD cycle 記録（Phase 5-4-b）

UI ユニットテストは書かず、typecheck で締める。E2E は Phase 6。

- `pnpm -F @me-me-en/web typecheck`: 緑

次フェーズ: **Phase 5-5 (己 / Profile)**

---

## Phase 5-5 — 己（Profile）

### 範囲

- `(app)/profile/actions.ts`: `updateProfileAction`（DI の `updateProfile` をラップ、`exactOptionalPropertyTypes` のため patch を条件付き build）+ `startDirectMessageAction`（R2 DM 起動）
- `(app)/profile/_components/sheep-avatar.tsx`: 簡素 avatar（円形 + tone カラー + 「羊」グリフ）
- `(app)/profile/profile-editor.tsx`: client。表示モード / 編集モード切替。編集 form:
  - nickname (1–20)、bio (0–200)
  - tone（6 色から 1 つ選択）
  - presenceVisibility（visible / invisible のラジオ）
  - currentSigns（8 種類トグル、複数選択可）
- `(app)/profile/page.tsx`: server component、自身の User を取得して `ProfileEditor` に渡し、来店帳統計（**置いた文** / **寄せられた燭** の 2 指標のみ）を表示。`入店した夜` / `連続来店` / `在席の刻 chart` / `親しい羊` は計算ロジック未実装のため「集計中…」プレースホルダ
- `(app)/profile/[userId]/page.tsx`: server component、対象 User を取得。`presence.visibleStatusTo` で非対称 stealth を反映、`OtherProfile` に渡す。自分の userId なら `/profile` へ redirect
- `(app)/profile/[userId]/other-profile.tsx`: client、他者表示 + 「直接話しかける」ボタン → `startDirectMessageAction` → `/chats/{convId}` 遷移

### 設計判断

- **profile 公開範囲**: spec の通り、他者表示では `avatar / nickname / bio / しるし / presence` のみ。来店帳・在席チャート・親しい羊は本人のみ
- **profile editor の表示/編集 toggle**: 1 画面で「整える」ボタンで切替。編集中は inputs を提示、「やめる」で破棄
- **R2 DM 起動**: 自分の userId と一致するなら `/profile/[id]` から `/profile` に redirect、それ以外は他者表示。`startConversationDirect` は既存会話があれば再利用するので、何度押しても同じ conv に飛ぶ
- **avatar は簡素実装**: spec の SheepBrush SVG はキメラ。MVPα では円形 + tone カラーで代用。SheepBrush の SVG 化は post-MVPα
- **patch を条件付き build**: `exactOptionalPropertyTypes` 配慮で、undefined を直接 set せず key を omit する形

### 集計未実装の指標（MVPβ 候補）

- **入店した夜** / **連続来店**: ログイン履歴のイベントログが必要。in-memory adapter は履歴 store を持たないため、event log を別途設けるか、`User.loginNights: Date[]` を追加するか。MVPβ で `LoginHistoryRepository` を新設する想定
- **在席の刻 chart（O）**: presence の online/offline 切替イベントを time-series で持つ必要。同じく event store が必要
- **親しい羊（M）**: `MessageRepository` に「直近 30 日の sender 別件数集計」query を追加すれば計算可能（spec の通り）。次フェーズで実装

### TDD cycle 記録（Phase 5-5）

UI ユニットテストは書かず、typecheck で締める。E2E は Phase 6。

- `pnpm -F @me-me-en/web typecheck`: 緑

---

## Phase 5 完了

| 章 | 内容 |
| --- | --- |
| Phase 5-0 | custom server + Auth.js + DI composition root |
| Phase 5-1 | 認証フロー end-to-end（login / onboarding / middleware）|
| Phase 5-2 | 閉店中 + 営業時間 middleware |
| Phase 5-3 | DM UI + Socket.IO リアルタイム |
| Phase 5-4 | Timeline UI + Reply (R1) + Socket.IO リアルタイム |
| Phase 5-5 | Profile（自分 + 他者 + R2 起動） |

- `apps/web` 全 route が型整合
- `pnpm -F @me-me-en/web typecheck`: 緑
- 集計系統計（来店夜数・在席チャート・親しい羊）は MVPβ 移行

次フェーズ: **Phase 6 (Render デプロイ + Playwright E2E)**
