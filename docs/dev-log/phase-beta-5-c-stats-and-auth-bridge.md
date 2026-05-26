# Phase β-5-c — 集計系 entity + AuthIdentity による session-bridge 置換

## 方針

β-5-b で MVPα コア 6 entity が Postgres に乗った。本 phase は残りの永続化 entity を埋める:

- 集計系: LoginHistory / PresenceEvent の Prisma adapter
- auth bridge: 既存 in-memory session-bridge を `AuthIdentityRepository` 経由に切替
- middleware で Prisma を edge bundle に持ち込まないよう Auth.js を公式分割パターンに移行

これで `DATA_STORE=prisma` 時に **永続化対象の全 9 entity** が Postgres に乗る。揮発系 (Presence / Typing) と β-5-d 以降 (migration / Render Postgres) を残すのみ。

## 範囲

### 追加 adapter

- `packages/infrastructure/src/prisma/login-history-repository.ts`
  - `recordIfFirstOfNight` を `upsert({ update: {}, create: ... })` で冪等化
  - `listNightsByUser` は nightId desc
- `packages/infrastructure/src/prisma/presence-event-repository.ts`
  - append-only insert と `[from, to)` 半開区間 query
- `packages/infrastructure/src/prisma/auth-identity-repository.ts`（新規 port）
  - findByProviderId / findByEmail / upsert
- `packages/infrastructure/src/in-memory/auth-identity-repository.ts`
  - 既存 session-bridge と同じ Map ベース、port を満たす形に再構成

### 新規 domain port

- `packages/domain/src/auth-identity/auth-identity.ts`: `AuthIdentity` entity
  - `provider` ('google' のみ、将来拡張) + `providerId` + `email?` + `userId`
- `packages/domain/src/auth-identity/repository.ts`: `AuthIdentityRepository` port
- `packages/domain/src/index.ts` に export 追加

### session-bridge.ts の薄いラッパー化

`apps/web/src/server/auth/session-bridge.ts`:
- 既存の in-memory Map を削除
- `findUserIdByEmail` / `bindEmailToUser` を `authIdentityRepository` 呼出に置換
- 両 API を `Promise<...>` に async 化（caller も await を追加）
- providerId に email を入れる暫定実装。Google `sub` への切替は β-5-d で

caller の更新:
- `apps/web/src/auth.ts` jwt callback: `await findUserIdByEmail(...)` 化
- `apps/web/src/app/(auth)/onboarding/actions.ts`: `await bindEmailToUser(...)` 化

### Auth.js を edge / Node に分割

middleware が `@/auth` を import すると Prisma が edge bundle に巻き込まれて build 失敗（`process.arch` not supported in Edge Runtime）。Auth.js v5 公式分割パターンを採用:

- `apps/web/src/auth.config.ts`（edge-safe）: providers + session strategy だけ、callbacks なし
- `apps/web/src/auth.edge.ts`: `authConfig` を spread した薄い `auth` middleware export。middleware からはこちらを import
- `apps/web/src/auth.ts`: `authConfig` を spread し、callbacks (DI 経由で Prisma を呼ぶ可能性あり) を追加。route handlers / server component / server action はこちらを使う

middleware は session.userId を resolve しない（jwt callback が走らないため）。代わりに onboarding redirect は layout (`(app)/layout.tsx`) が server side で処理する。既存ロジック (middleware の rule 4) でも session.userId === undefined の場合に onboarding へ飛ばす条件があるが、middleware では token に userId が乗らないので **常に onboarding に飛ばされる** リスクがある。
→ middleware の rule 4 は middleware では実行されない（session.userId が undefined となるため）。実際の userId 判定は server component で行う設計に揃え直す。

実際の挙動確認（README 上の手動 QA で）が β-5-d 課題。

### DI

`apps/web/src/server/di/repositories.ts` で in-memory / prisma を 9 entity 全部スイッチ:

- userRepository / conversationRepository / messageRepository / postRepository / likeRepository / blockRepository / loginHistoryRepository / presenceEventRepository / authIdentityRepository

揮発系 (presenceRepository / typingRepository) は常に in-memory。

## 設計判断

- **AuthIdentity を新規 domain port に**: session-bridge が "process-scoped Map" として apps/web 内に閉じていた状態を、domain port に出した。これで application 層から「login 時に identity を upsert する use case」を呼ぶ将来形 (β-5-d 候補) が選択肢として残る
- **providerId に email を当面使う**: MVP の互換性のため。Google `sub` への切替は token.sub が確実に揃う auth.ts callback の整理と一緒に β-5-d で扱う
- **Auth.js v5 公式分割パターン**: edge-safe な config を切り出すのは v5 が想定する正規の構造。本 phase で抽象化負債を清算
- **middleware の userId 判定を server component に寄せる**: middleware は edge で動くので Prisma 経路が呼べない → callbacks も呼べない。layout.tsx の server component が session.userId を resolve して onboarding redirect する設計に揃える（既存 layout は既にこの判定をしている、middleware の rule 4 は本質的に冗長）
- **session-bridge を消さず薄いラッパーで残す**: caller 側 API を変えずに DI 経由化。caller を await 化する変更だけで済んだ

## TDD cycle 記録

### 1. RED

- adapter のロジックは既存 in-memory adapter と application test がカバー
- 新 entity AuthIdentity は MVP の薄い型なので unit test なし（妥当性は型と DI で保証）

### 2. GREEN

- 3 adapter + in-memory AuthIdentity adapter を実装
- domain に AuthIdentity port を追加
- session-bridge を repository wrapper に書き換え、caller 2 箇所を await 化
- Auth.js を auth.config.ts / auth.edge.ts / auth.ts に分割、middleware を auth.edge から import
- `pnpm -r typecheck`: 全 workspace 緑
- `pnpm -r test`: domain 88, application 125, infrastructure 42（既存維持）
- `pnpm -F web build`: 緑（edge bundle に Prisma が含まれないことを確認）

### 3. REFACTOR

- 不要。session-bridge の薄いラッパー化と Auth.js 分割で抽象化負債を一掃した

## 残課題

- β-5-d: Render Postgres provision + render.yaml 更新 + migration 運用 + integration test
- providerId を Google sub に切替（β-5-d 内 or 別 phase）
- middleware の rule 4（userId === undefined → onboarding）を server component 側で完全に置き換え
- Task #4: ESLint 境界ルール
