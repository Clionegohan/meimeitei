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
