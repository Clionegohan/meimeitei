# Task #25 — 05:00 閉店時の強制 disconnect（spec B）

## 方針

spec B 行「05:00 を跨いだ瞬間、接続中ユーザーは強制 disconnect + 閉店中画面へ遷移」を実装する。MVPα のコア体験だが Phase 4/5 で後回しにしていた負債。

middleware は既に「営業時間外に (app) ページへ navigation したら /closed へ redirect」を担保している。不足しているのは **idle のまま夜を跨いだ接続中の tab を、閉店の瞬間に能動的に蹴る** 部分。これを Socket.IO の custom server 側スケジューラ + client の常駐 watcher で実装する。

## 範囲

### domain

- `packages/domain/src/shared/time.ts` に `nextCloseAfter(now: Date): Date` を追加（index.ts から export）
  - now より厳密に後の直近 05:00 JST を返す純粋関数。05:00 丁度は「閉店済み」とみなし翌日へ送る（閉店処理の二重発火を防ぐ）
  - bypass フラグは見ない。境界計算と「閉店を実行するか」は別関心

### presentation（custom server）

- `apps/web/server.ts` に `scheduleForceClose()`:
  - dev の `BYPASS_BUSINESS_HOURS` 時は予約しない
  - `nextCloseAfter(now)` までの delay を `setTimeout` で待ち、発火時に:
    1. `broadcastToAll('server:closed', { reason: 'business-hours' })`（trigger-only）
    2. `CLOSE_DRAIN_MS`（1 秒）後に `io.disconnectSockets(true)` で全切断（信号 flush の猶予）
    3. `scheduleForceClose()` で翌日の閉店を再予約

### presentation（client）

- `apps/web/src/app/(app)/_components/session-watcher.tsx`（新規, 'use client'）:
  - `getSocket(userId)` で共有 socket に接続し `server:closed` を listen
  - 受信したら `window.location.href = '/closed'`（middleware が営業時間外を見て /closed を確定）
  - 描画なし（null）
- `apps/web/src/app/(app)/layout.tsx` に `<SessionWatcher userId={session.userId} />` を常駐配置

## 設計判断

- **境界計算を domain の純粋関数に**: `setTimeout` の delay 算出は副作用のない時刻計算。domain に置けば単体テストでき、server.ts は「いつ・何をするか」の wiring に専念できる
- **server:closed は trigger-only**: payload に個人情報を載せない。client は受信を合図に full navigation するだけで、閉店の確定判断は middleware（`isOpen`）に委ねる。`presence:update` と同じ「信号だけ送って SSR / middleware で再評価」方針に揃えた
- **broadcast → 1 秒待ち → disconnect**: emit 直後に socket を閉じると `server:closed` が flush されず client が遷移を取りこぼす恐れがある。猶予を挟む。仮に取りこぼしても、次の navigation で middleware が /closed へ送るためフェイルセーフは効く
- **watcher を (app) layout に常駐**: timeline / thread だけが socket を張る現状では、profile 等を開いたまま夜を跨いだ tab が蹴られない。layout 常駐なら全 (app) ページで閉店信号を受けられる。socket は singleton なので接続は共有され二重接続にならない
- **副作用（presence）**: watcher が全 (app) ページで socket を張るため、従来 timeline / thread に限られていた presence:online イベント記録が profile 等でも走る。「在席」の意味としてはむしろ正確で、在席の刻 chart は max 正規化で吸収するため許容
- **bypass 時はスケジュールしない**: dev のローカル QA で 05:00 に突然蹴られると不便。production では必ず動く

## TDD cycle 記録

### 1. RED

- `time.test.ts` に `nextCloseAfter` の 5 ケース追加（深夜/夕方/05:00 丁度/午後/04:59）
- `pnpm -F @me-me-en/domain test time`: **5 failed**（`nextCloseAfter is not a function`）

### 2. GREEN

- `nextCloseAfter` を実装、export
- `pnpm -F @me-me-en/domain test`: **93 / 93 passed**（既存 88 + 新 5）
- server / client を wiring
- `pnpm -F {domain,web} typecheck`: 緑

### 3. REFACTOR

- 不要。domain の純粋関数 + server の最小スケジューラ + 描画なし client watcher に閉じる

## 検証

- domain 単体テストで境界（05:00 丁度・04:59・午後）を保証
- typecheck 緑
- **手動 / 将来**: 実際の 05:00 跨ぎは時刻 mock が要るため自動化は別途。staging で「閉店直前に接続 → 05:00 に /closed へ飛ぶ」を手動確認する。簡易には `nextCloseAfter` を一時的に数十秒後へ差し替えてのスモークも可

## 残課題

- 閉店スケジューラの統合テスト（fake timer + io mock）。`#28` test 拡充で検討
- 複数インスタンス運用時（spec 非機能では単一インスタンス前提）は各プロセスが個別に閉店スケジュールを持つ。horizontal scaling は v2
