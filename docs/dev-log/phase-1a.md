# Phase 1a — BusinessHours + Night value object (JST)

## 方針

迷羊苑の「夜（営業日）」を domain の最内層に value object として持ち込む。営業時間（22:00-05:00 JST）の判定とタイムライン公開期間／会話夜数集計／プロフィール統計の根拠を、すべてこの value object で筋を通せる構造にする。

## 対象範囲

- `packages/domain/src/shared/time.ts` 新規
- `packages/domain/src/shared/time.test.ts` 新規
- `packages/domain/src/shared/id.ts` に `ReplyId` / `CandleId` 追加
- `packages/domain/src/index.ts` 公開 API 更新

## 設計判断

| 論点 | 採用 | 理由 |
| --- | --- | --- |
| タイムゾーン基準 | JST 固定 (UTC+9) | ユーザー回答。サマータイムなし、計算が純粋にできる |
| JST 換算 | `Date.getTime() + 9h offset` で UTC 化して `getUTCHours()` | `toLocaleString` より速く、純粋関数で test 容易。DST のない地域なので問題なし |
| `NightId` 形式 | `YYYY-MM-DD`（開店日 JST）の branded string | JSON 永続化が素直。比較・ソートも辞書順で正しい |
| 営業時間判定 | `h >= 22 OR h < 5` | 22:00 開店、05:00 閉店（=open でない）の境界明確化 |
| 夜の所属 | 22:00-23:59 → その日 / 00:00-04:59 → 前日 | UI の「ここから今宵が始まりました」表記と整合 |
| 営業時間外の理由 | `after-close` / `before-open` を 14:00 で分割 | 朝方=ちょうど閉まったばかり / 夕方以降=これから開く、の UI コピー差別化のため |

## TDD cycle 記録

**注記**: 本 Phase は user の TDD 指示を**受領する前**に実装。test と実装を同時 Write したため、厳密な test 先行サイクルではない。ただし結果として `closedReason` の境界 mismatch で意図せず RED → GREEN を経験した。Phase 1b 以降は明確に test 先行で進める。

1. `time.ts` と `time.test.ts` を同時 Write
2. `pnpm -F @me-me-en/domain test` 実行 → **25 tests / 2 failed**
   - `closedReason at 05:00 JST` 期待 `after-close` / 実際 `before-open`
   - `closedReason at 10:00 JST` 期待 `after-close` / 実際 `before-open`
3. 原因: 初期実装 `h < OPEN_HOUR && h >= CLOSE_HOUR ? 'before-open' : 'after-close'` だと営業時間外の全レンジで `before-open` を返す（`isOpen=false` → `h ∈ [5, 22)` のため必ず条件 true）
4. 境界を 14:00 で分割する形に修正、test も 14:00/13:59/21:59 の boundary を追加
5. 再実行 → **27 tests / all passed**

## 検証結果

- `pnpm -F @me-me-en/domain typecheck` 緑（出力なし）
- `pnpm -F @me-me-en/domain test` 27/27 緑
- 境界カバレッジ: 21:59 / 22:00 / 23:59 / 00:00 / 04:59 / 05:00 / 月末跨ぎ / 年末跨ぎ / 営業時間外 / closedReason 4 boundary

## 公開 API

```ts
// packages/domain
import {
  isOpen,            // (now: Date) => boolean
  nightIdOf,         // (now: Date) => NightId   (営業時間外は throw)
  currentNightId,    // (now: Date) => NightId | null
  opensAtOf,         // (nightId: NightId) => Date
  closesAtOf,        // (nightId: NightId) => Date
  closedReason,      // (now: Date) => 'before-open' | 'after-close' | null
  type NightId,
} from '@me-me-en/domain'
```

## 未解決の残課題

- 接続中ユーザーが 05:00 を跨いだ際の挙動（強制 disconnect / 閉店中遷移）は application 層で決める。`isOpen` を edge トリガで監視するか、リクエスト毎にガードするかは Phase 1f で扱う。
- `closedReason` の 14:00 境界は仮置き。UI コピーを書く段階で再検討の余地。
