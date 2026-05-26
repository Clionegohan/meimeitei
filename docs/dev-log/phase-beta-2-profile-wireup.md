# Phase β-2 — profile UI を β-1 use case に結線する

## 方針

β-1 で `recordLogin` / `recordPresenceEvent` / `getProfileStats` / `getHourlyPresenceChart` / `getCloseSheep` を作った。本 phase で **集計起点（write）** と **表示側（read）** の両方を resolve し、profile page の placeholder を実値化する。

## 範囲

### 集計起点（write path）

- `apps/web/src/app/(app)/layout.tsx`: `(app)` route group の Server Component で `recordLogin({ userId })` を毎リクエスト呼ぶ
- `apps/web/server.ts`: socket `connection` で `recordPresenceEvent({ type: 'online' })`、`disconnect` で `recordPresenceEvent({ type: 'offline' })`

### 表示側（read path）

- `apps/web/src/app/(app)/profile/page.tsx` 全面書き換え:
  - `postRepository.list` + `likeRepository.countReceivedByUser` の直接呼び出しを `getProfileStats` 1 発に集約
  - 「入店した夜」「連続来店」を実値化（placeholder「集計中…」を除去）
  - 「在席の刻」セクション新設、`getHourlyPresenceChart` で 8 buckets を取得
  - 「親しい羊」セクション新設、`getCloseSheep` で Top 3 を取得
- `apps/web/src/app/(app)/profile/_components/hourly-presence-chart.tsx`（新規）
  - 縦棒チャート。intensity 0..1 を高さと opacity の両方で表現
  - 0 件時は placeholder 文
- `apps/web/src/app/(app)/profile/_components/close-sheep-list.tsx`（新規）
  - userRepository.findById で nickname / tone を補完
  - 各羊 → `/profile/[userId]` リンク
  - 0 件時は placeholder 文

## 設計判断

- **`recordLogin` を layout で**: middleware は edge runtime 制約があるので DI module が動かない。`(app)` layout の Server Component が「営業時間 + 認証済」の交差を保証する最上位なので、ここを起点にする。idempotent なので redirect ループの心配なし
- **`recordPresenceEvent` を server.ts で**: socket の lifecycle が presence のソース。複数タブ接続で複数 online が積まれるが、hourly chart は max 正規化で吸収する（spec の MVPβ 近似）
- **page で `Promise.all`**: 3 つの use case は互いに独立、並列実行
- **HourlyPresenceChart は intensity を高さ + opacity 両方で**: intensity 0 でも骨格バーは描く（「ここに灯らなかった」を可視化）。最低高さ 2% で潰れ防止
- **干支ラベル**: hour ラベル下に薄く「亥子丑寅卯辰」を補助表示。世界観を維持
- **other-profile.tsx には stats を出さない**: spec L51「来店帳 / 在席チャート / 親しい羊は本人のみ可視」。`profile/[userId]/page.tsx` は触らない

## TDD cycle 記録

### 1. RED

- 本 phase は presentation 層 + DI wire。新 use case 追加なし → 新 unit test なし
- β-1 で全 use case のロジックは TDD 済（application 125 件）

### 2. GREEN

- 集計起点 2 箇所 + 表示 3 セクションを実装
- `pnpm -F web typecheck`: 緑
- `pnpm -F web build`: 緑

### 3. REFACTOR

- 不要。Server Component が `Promise.all` で 3 use case を並列 resolve
- 残課題: realtime 反映（β-4 候補）、profile 以外のページからの login 起点排除（layout 1 箇所に集約済なので問題なし）

## 残課題

- β-4: Block-aware realtime broadcast、presence:update broadcast
- β-5: Prisma adapter
- 親しい羊リスト内の自己除外チェック（自分自身は会話のあり方上 peer に出ない設計のはずだが UI で念のため filter 追加を検討）
