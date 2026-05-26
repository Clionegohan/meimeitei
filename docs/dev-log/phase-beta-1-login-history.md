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
