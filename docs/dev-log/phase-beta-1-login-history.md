# Phase β-1 — 来店帳統計の event log 基盤

## 方針

MVPα では「入店した夜」「連続来店」「在席チャート」「親しい羊」が placeholder。実数値化のために必要なログ基盤を作る。Phase β-1 を 3 つに細分:

- **Phase β-1-a**（本 PR）: `LoginHistory` entity + repository（ユーザーが「夜」単位で来店したことを記録）
- **Phase β-1-b**: `PresenceEvent` log + 集計 use case（在席チャート + 連続来店）
- **Phase β-1-c**: 親しい羊 集計（`MessageRepository.countRecentBySender` 等の query 追加）

## β-1-a 範囲

- `packages/domain/src/login-history/login-history.ts`: `LoginRecord` 型（userId / nightId / firstSeenAt）+ `createLoginRecord` factory
- `packages/domain/src/login-history/repository.ts`: `LoginHistoryRepository` port
  - `recordIfFirstOfNight(userId, nightId, at)`: 同じ夜に既に記録があれば no-op、なければ insert
  - `listNightsByUser(userId)`: 来店した夜の `NightId[]`（重複なし、降順）
- `packages/domain/src/index.ts`: 公開 API
- Vitest で entity factory の動作確認

application 側の use case（`recordLogin`、`countTotalNights`、`countConsecutiveNights`）と infrastructure adapter は Phase β-1-b/c または別 PR で扱う。本 PR は domain port までを揃える。

## 設計判断

- **「夜単位」で重複排除**: 1 夜に何度ログインしても 1 record。spec の「入店した夜」「連続来店」は夜単位なので、event log の粒度を夜に揃える
- **`recordIfFirstOfNight` を idempotent に**: アプリ側で「session 開始時に毎回呼ぶ」運用にしても問題なし
- **`firstSeenAt` を保持**: 「その夜に最初に灯ったのは何時か」を後で分析できる余地

### TDD cycle 記録（Phase β-1-a）

#### 1. RED

`login-history.test.ts` 1 件先行 Write（`createLoginRecord` の正常系）。

```
FAIL  src/login-history/login-history.test.ts
Error: Failed to load url ./login-history
```

#### 2. GREEN

- `login-history.ts`: `LoginRecord` 型 + `createLoginRecord` factory
- `repository.ts`: `LoginHistoryRepository` interface（`recordIfFirstOfNight` / `listNightsByUser`）
- `index.ts` 公開 API 更新

```
Test Files  10 passed (10)
     Tests  86 passed (86)
```

typecheck 緑。

#### 3. REFACTOR

不要。entity / repository 1 セット、最小限。Phase β-1-b で use case と adapter を追加する。

---

## β-1-b — PresenceEvent domain + 両 in-memory adapter

### 範囲

- `domain/presence-event/presence-event.ts`: `PresenceEvent`（userId / type / occurredAt） + `createPresenceEvent`
- `domain/presence-event/repository.ts`: `PresenceEventRepository` port
  - `record(event)`: append-only
  - `listByUserInWindow(userId, from, to)`: `[from, to)` 範囲を ascending で返す
- `domain/index.ts`: 公開 API
- `infrastructure/in-memory/login-history-repository.ts`: `Map<UserId, Map<NightId, Date>>` で idempotent 記録、列挙は lex desc
- `infrastructure/in-memory/presence-event-repository.ts`: 配列ベースの append-only log、window filter + asc 並び
- `infrastructure/index.ts`: 公開 API
- `packages/contracts/package.json` の test script を `vitest run --passWithNoTests` に変更（test ファイル無しでも緑にするため）

### 設計判断

- **PresenceEvent は append-only**: 履歴を集計するので、書換えではなく log を積む。`recordIfFirstOfNight` のような重複排除は LoginHistory 側に持たせる
- **listByUserInWindow の `[from, to)` 半開区間**: 「過去 30 日」の集計時に境界の重複を避けるため、to は exclusive
- **NightId の lex 比較**: `YYYY-MM-DD` は lex desc == 時系列 desc。専用の比較関数を作らず string 比較で十分
- **production swap path**: in-memory adapter は無制限に成長する。MVPβ Postgres 切替時に「N 日以上前は trim」する運用に変える前提

### TDD cycle 記録（β-1-b）

#### 1. RED

- `presence-event.test.ts` 2 件、`login-history-repository.test.ts` 4 件、`presence-event-repository.test.ts` 3 件を先行 Write
- 一部 file で domain index.ts と infra index.ts の Edit が「File has not been read yet」エラー → Read してから再 Edit で復旧
- `pnpm test`: 該当 file fail

#### 2. GREEN

- domain / infra の各実装ファイル Write
- `domain/index.ts` / `infrastructure/index.ts` に新 export を追加
- `pnpm -r test`:
  - domain: **88 / 88**
  - infrastructure: **41 / 41**（既存 34 + 新 7）
  - application: 既存 101 / 101
  - contracts: `--passWithNoTests` で skip
- `pnpm -r typecheck`: 全 workspace 緑

#### 3. REFACTOR

不要。Phase β-1-b 続き or β-1-c で application 層 use case（`recordLogin`, `recordPresenceEvent`, `getProfileStats`, `getHourlyPresenceChart`）を追加する。

## β-1 application use cases 範囲

domain + infrastructure の event log 基盤を application 層から呼ぶための use case を追加する。UI への結線（profile placeholder の置き換え）は β-2 で扱う。

### 追加した use case

| Use case | 入力 | 出力 | 主な責務 |
| --- | --- | --- | --- |
| `recordLogin` | `{ userId }` | `void` | businessHoursGuard 通過後、`currentNightId(clock.now())` を解決し `LoginHistoryRepository.recordIfFirstOfNight` を呼ぶ。同じ夜に複数回呼んでも no-op |
| `recordPresenceEvent` | `{ userId, type: 'online' \| 'offline' }` | `void` | 営業時間外でも呼べる（05:00 force-disconnect で offline を記録する必要があるため、`BusinessHoursGuard` は意図的に外す） |
| `getProfileStats` | `{ userId }` | `ProfileStats` | `totalLoginNights` / `consecutiveLoginNights` / `postCount` / `candleReceivedCount` を返す。post は `deletedAt === null` のみカウント |
| `getHourlyPresenceChart` | `{ userId }` | `HourlyPresenceBucket[]`（22, 23, 0..5 JST の 8 個） | 過去 30 日の `online` イベントを JST 時間でビン分け、ピーク基準で 0..1 正規化 |

### 設計判断

- **`recordPresenceEvent` だけ BusinessHoursGuard を外す**: 05:00 JST の close edge でサーバー側が socket を切る際、その offline を必ず記録するため。営業時間外でログを生やす唯一の正当パス。他 use case は基本通り guard する
- **`consecutiveLoginNights` の判定は ISO date 差で**: NightId を `YYYY-MM-DD`（lex desc == 時系列 desc）として並べてもらった配列を頭から走査、隣接 2 つの UTC ms 差が ちょうど 24h なら連続。文字列パースは `Date.parse(`${nightId}T00:00:00Z`)` で副作用なし
- **過去 30 日窓**: spec で「直近 30 日」を明示。`now - 30d` から `now` の `[from, to)` 半開区間で event log を取り、JST 時間に変換してバケットに加算
- **「online イベント数 ≒ intensity」の近似**: 厳密な滞在時間集計は online/offline ペアリングと socket 切断を含めた複雑な状態機械が要る。MVPβ では online イベントの頻度を強度に転写する近似で十分。Postgres 化時に窓関数で集計に差し替え可能
- **`max` ベース正規化**: 全 0 でも `Math.max(1, ...)` で割って NaN を防ぐ

### 配線（DI composition root）

- `apps/web/src/server/di/repositories.ts`: `loginHistoryRepository` / `presenceEventRepository` を singleton として追加
- `apps/web/src/server/di/use-cases.ts`: 4 use case を結線。`getProfileStats` は `postRepository` / `likeRepository` も共有

### TDD cycle 記録（β-1 application）

#### 1. RED

- `packages/application/src/__test-helpers__/fakes.ts` に `inMemoryLoginHistoryRepo` / `inMemoryPresenceEventRepo` の helper を追加
- 4 test file を先行 Write:
  - `use-cases/login-history/record-login.test.ts`（3 件）
  - `use-cases/presence-event/record-presence-event.test.ts`（2 件）
  - `use-cases/profile/get-profile-stats.test.ts`（4 件）
  - `use-cases/profile/get-hourly-presence-chart.test.ts`（4 件）
- `pnpm -F @me-me-en/application test` で fail を確認

#### 2. GREEN

- impl 4 file を Write
- `packages/application/src/index.ts` に export 追加
- `pnpm -F @me-me-en/application test`: **114 / 114 passed**（既存 101 + 新 13）
- `pnpm -F @me-me-en/application typecheck`: 緑

#### 3. REFACTOR

- 不要。共通 helper を fakes.ts に集約済み
- 残課題: β-2 で profile page の placeholder を `getProfileStats` / `getHourlyPresenceChart` の値に差し替える

### 残課題

- β-1-c: 親しい羊 集計（`MessageRepository` への query 追加 + use case）
- β-2: profile UI への wire-up（placeholder 置換、ヒートマップ描画）
- β-3 以降: SheepBrush、Block-aware broadcast、Prisma 切替

