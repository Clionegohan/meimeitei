# セキュリティ棚卸し（リリース前）

最終更新: 2026-05-31 / 対象 branch: `feat/ui-polish-profile-dm-timeline`

me-me-en（夜限定 1on1 DM + タイムライン。Next.js 16 App Router + Socket.IO custom server +
Prisma/in-memory・クリーンアーキ）のリリース前セキュリティ現状整理。次回以降の脆弱性対応の起点。

総括：基盤（Server Action 認可・入力検証・XSS 防御・secret 管理）は堅牢。
ただし **Socket.IO のコネクション認証欠如（CRITICAL）がリリースブロッカー**。
本番リスクは presence/typing 偽装と DM のリアルタイム盗聴に集中。

凡例 — 深刻度: 🔴CRITICAL / 🟠HIGH / 🟡MEDIUM / 🔵LOW、状態: ☐未対応 / ☑対応済 / ◽受容

---

## 1. 問題ない部分（確認済み・OK）

| 項目                                  | 根拠                                                                                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Action の認可（IDOR なし）** | 全 action が `session.userId` を使い、クライアント供給 id を信用しない。`updateProfileAction`/`blockUserAction`/`deleteAccountAction`/`sendMessageAction`/`createPostAction` 等すべて session 由来。 |
| **会話参加者チェック**                | `send-message.ts` が `conv.participantIds.includes(senderId)` で `ForbiddenError` + block チェック。閲覧ページ `chats/[conversationId]/page.tsx` も参加者検証。                                      |
| **XSS 防御**                          | `dangerouslySetInnerHTML` 使用ゼロ。`Linkify` は http/https のみリンク化（`javascript:` 等は平文）、非 URL は React 自動エスケープ、外部リンクに `rel="noopener noreferrer nofollow ugc"`。          |
| **入力検証（domain）**                | message 280字+空、post 280字+空+営業時間、nickname 20字 / bio 200字 / tone は allowlist / favoriteMoon は enum。updateProfile は `createUser` で全検証再実行 + nickname 重複チェック。               |
| **投稿レート制限**                    | `create-post.ts` に 30 秒クールダウン。削除済みも `postedAt` 残存で「削除→連投」回避を阻止。                                                                                                         |
| **secret 管理**                       | ハードコード secret なし。全て `process.env`。`.env.local` は gitignore 済、追跡は `.env.local.example` のみ。                                                                                       |
| **認証/cookie 属性**                  | Auth.js v5 / JWT strategy。cookie は httpOnly + sameSite=lax + 本番 secure（Auth.js 既定）。middleware は edge で営業時間 + 未認証 gate のみ、userId 判定は server component に集約。                |
| **CSRF**                              | Next.js Server Actions の origin 検証（フレームワーク内蔵）に依拠。                                                                                                                                  |
| **SQL injection**                     | Prisma パラメータ化クエリ。raw SQL なし。                                                                                                                                                            |
| **Socket.IO CORS**                    | `cors: { origin: false }` で外部 origin 拒否（同一 origin のみ）。                                                                                                                                   |
| **presence のプライバシー**           | `presence:update` は trigger-only（payload に userId を載せない）。「誰が変わったか」を漏らさず、block/visibility は SSR 側で再評価。                                                                |
| **block 配慮の fan-out**              | `post:new` は著者の blocker/blocked を除外して配信（`broadcastToAllExcept`）。                                                                                                                       |

---

## 2. 問題点

### 🔴 C-1. Socket.IO がクライアント供給の userId を無検証で信用（なりすまし） ☐未対応

- 場所: `apps/web/server.ts:36-46`、`apps/web/src/lib/socket-client.ts`
- 内容: handshake 認証が `socket.handshake.auth.userId`（クライアントが任意指定可能）を非空チェックのみで受理。Auth.js セッション cookie を検証していない。コード自身が「Future hardening: parse the Auth.js session cookie here」と認める。
- 影響:
  - 任意 userId で `user:{userId}` room に join → 将来 DM 個別配信を載せると盗聴。
  - `conversation:join` は room 名チェックのみで**参加者認可なし** → conversationId を知れば任意会話の `message:new` / typing を受信可能（永続取得は守られているがリアルタイム経路が抜けている）。
  - presence/typing イベントの偽装（他人の「入力中」表示、online 記録）。
- 対処: handshake で `authjs.session-token` を `next-auth/jwt` の `decode` で検証し、`socket.data.userId` をトークン由来に限定。クライアントから userId を送らせない。`conversation:join` で `conversationRepository.findById` + 参加者チェック後に join 許可。

### 🟠 H-1. dev/test ルートが env 設定次第で本番暴露 → 完全な認証バイパス ☐未対応

- 場所: `apps/web/src/app/api/test/{login,seed,seed-dummy}/route.ts`
- 内容: ガードは `NODE_ENV !== 'production' && E2E_TEST_ENABLED === 'true'`（AND、設計は妥当）。だが `/api/test/login` は**任意の id/nickname で AUTH_SECRET 署名済み有効セッションを発行**する。有効化されれば任意ユーザーへのセッション偽造。middleware は `/api/test/*` を public 素通し。
- 影響: 本番で `NODE_ENV` が production 以外（誤デプロイ）かつ `E2E_TEST_ENABLED=true` 残存時、`/api/test/login?id=<被害者>` で任意セッション奪取。
- 対処: 本番ビルドからテストルートを物理除外。最低限、起動時に `production && E2E_TEST_ENABLED` を検知したら fatal で起動拒否。デプロイ環境で `E2E_TEST_ENABLED` 未設定を CI/IaC で保証。

### 🟠 H-2. メッセージ送信にレート制限なし ☐未対応

- 場所: `packages/application/src/use-cases/message/send-message.ts`
- 内容: `createPost` は 30 秒クールダウンを持つが `sendMessage` は無制限。
- 影響: DM スパム/フラッディング。C-1 と組むと被害拡大。
- 対処: 投稿同様の最小間隔 or トークンバケットを `sendMessage` に導入。

### 🟡 M-1. typing イベントの userId なりすまし ☐未対応（C-1 の派生）

- 場所: `apps/web/server.ts:71-87`。C-1 の cookie 認証で根治。

### 🟡 M-2. テストルートの `to` パラメータが open redirect ☐未対応

- 場所: `apps/web/src/app/api/test/login/route.ts`、`seed-dummy/route.ts`
- 内容: `to` を `new URL(to, origin)` に渡すため絶対 URL（`https://evil.com`）で外部 302。テストルート有効時のみ。
- 対処: `/` 始まりの相対パスのみ許可（`if (!to.startsWith('/') || to.startsWith('//')) to = '/chats'`）。

### 🟡 M-3. エラーメッセージの内部詳細露出 ☐未対応

- 場所: 全 Server Actions（`e instanceof Error ? e.message` をそのまま返却）
- 内容: `nickname "x" is already taken` 等でユーザー列挙、`not found` で存在推測が可能。
- 対処: `ValidationError`/`RateLimitError` 等の既知ユーザー向けエラーのみ message を通し、`NotFoundError`/`ForbiddenError`/想定外は汎用文言に丸める分類層を挟む。

### 🔵 L-1. セキュリティヘッダ / CSP 未設定 ☐未対応

- 内容: `next.config` に CSP・`X-Content-Type-Options`・`Referrer-Policy`・HSTS の設定が見当たらず。Linkify は安全だが多層防御として推奨。

### 🔵 L-2. `BYPASS_BUSINESS_HOURS` / `E2E_TEST_ENABLED` の本番残存 ☐未対応

- 内容: 営業時間 bypass や E2E フラグが本番に残ると営業時間制御・テストルート gate が破れる。デプロイ設定で未設定を保証する運用課題。

---

## 3. これからの機能追加・スケールアップで出る課題

### スケール（パフォーマンス／DoS 耐性）

- **N+1 クエリ**: `chats/page.tsx`（会話ごとに `listMessages`）、`sheep/page.tsx`・`settings`・`listOnlineUsers`（id ごとに `findById`）。ユーザー/会話増で線形悪化。→ バッチ取得（`findManyByIds`）や集約クエリへ。
- **presence event 書き込み増幅**: socket 接続ごとに `recordPresenceEvent` を DB 書き込み。多タブ・再接続で増幅。→ デバウンス or 集約。
- **タイムライン/メッセージのページング**: domain には `before`/`limit` があるが UI で無限取得していないか要確認。上限を強制し DoS を防ぐ。
- **Socket.IO の水平スケール**: 単一プロセス前提（`setIoServer`）。複数インスタンス時は Redis adapter 等が必要。room broadcast が跨らない。

### 機能追加で顕在化する脆弱性

- **DM 個別配信を載せる前に C-1 必須**: `broadcastToUser` を private message に使うと、現状の room join 認可欠如が即漏洩になる。
- **退苑（アカウント削除）の足跡 cascade**: 現状 user/auth-identity のみ削除。投稿・手紙は Prisma schema の `onDelete` 依存。**FK cascade 未設定だと本番で `user.delete` が実行時失敗**。GDPR 的な完全削除要件が出たら content 削除の設計が必要。in-memory では孤立し「名なし」で degrade。
- **画像/添付アップロード**を追加する場合: ファイル種別検証・サイズ制限・ストレージの署名付き URL・EXIF 除去・SSRF（リモート取得時）。
- **通知（push/mail）**: 宛先検証・レート制限・テンプレートインジェクション・opt-out。
- **検索/フィルタ**: ReDoS、過大クエリ、列挙。
- **管理機能/モデレーション**: 権限分離（現状ロール概念なし）、監査ログ。
- **OAuth provider 追加**: アカウント乗っ取り（email 衝突での provider 跨ぎ紐付け。現 `findByEmail` は将来 providerId 主軸へ移行予定）。

### 運用・可観測性

- **構造化ログ/監査**: 認証イベント・block・退苑・rate limit ヒットのログ。
- **依存脆弱性**: `pnpm audit` を CI に。Renovate/Dependabot。
- **rate limit の集中管理**: 現状 post のみ in-process。スケール時は分散ストア（Redis）ベースへ。

---

## 4. リリース前チェックリスト

- ☐ C-1: Socket.IO cookie 認証 + `conversation:join` 参加者認可（**ブロッカー**）
- ☐ H-1: 本番ビルドからテストルート除外 + 起動時アサーション
- ☐ H-2: message レート制限
- ☐ M-2: open redirect 防御（`to` の相対パス限定）
- ☐ M-3: エラー分類層（内部詳細を丸める）
- ☐ L-1: CSP / security headers
- ☐ L-2: デプロイ env 検証（`E2E_TEST_ENABLED`/`BYPASS_BUSINESS_HOURS` 未設定保証）
- ☐ Prisma schema の `onDelete` 確認（退苑の cascade、本番 FK）
- ☐ `pnpm audit` 実行・既知脆弱性の解消

---

参照: `apps/web/server.ts` / `apps/web/src/lib/socket-client.ts` / `apps/web/src/app/api/test/*` /
`packages/application/src/use-cases/message/send-message.ts` / `apps/web/src/server/realtime/io-bridge.ts` /
`apps/web/src/app/**/actions.ts`
