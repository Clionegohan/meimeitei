# Phase refactor — Align User entity to product spec

## 方針

`docs/spec/product-spec.md`（PR #6–#9）が確定し、語彙ポリシー（BE は英語の一般用語、UI で迷羊苑表記にマッピング）と各種制約が固まった。PR #4 で merge した User entity / `SIGN_TAGS` は spec 策定前のもので、以下のズレがある:

| 項目 | 旧（PR #4） | 新（spec） |
| --- | --- | --- |
| `sealCharacter` | User の必須項目 | **不採用**（判子は v2 範囲外） |
| `SIGN_TAGS` の値 | 日本語 10 個 | **英語スネーク 8 個**（profile 用のみ。post に mood tag は付かない） |
| `tone` | 任意 string、default `'#E8E2D2'` | **6 色 enum**（design 由来）、default `'#E8E2D2'` |
| nickname 長さ | 上限なし | **1–20 graphemes** |
| bio 長さ | 上限なし | **0–200 graphemes** |

本 refactor で 1:1 に揃える。`currentSigns` は名前そのまま、値の集合だけ更新。

## 範囲

- `packages/domain/src/user/user.ts` 修正
- `packages/domain/src/user/user.test.ts` 新仕様で書き直し
- `packages/domain/src/index.ts` 公開 API 更新（`SealCharacter` 等は今回不要）

`UserRepository` interface は変更なし。

## SignTag の新集合（英語スネーク）

| 旧（日本語） | 新（英語） |
| --- | --- |
| 眠れない | `sleepless` |
| 読書中 | `reading` |
| お茶を一杯 | `having_tea` |
| 月を眺める | `moon_gazing` |
| 何でもない | `nothing` |
| 声を聞きたい | `wanting_to_hear` |
| しりとり | `shiritori` |
| 夜更かし | `staying_up_late` |

post 専用だった `寝る前に` / `独り言` は K を profile-only にした時点で集合から外す。

## Tone enum

design HTML の `SheepBrush` tone 一覧:

```ts
export const TONES = ['#E8E2D2', '#D8B890', '#D8CFB8', '#C8BFA0', '#B8A480', '#E8D2B8'] as const
export type Tone = (typeof TONES)[number]
```

## TDD cycle 記録

### 1. RED — 新仕様で test を書き直す

`user.test.ts` を新仕様（spec 準拠）で全面書き直し。`TONES` の存在、`SIGN_TAGS` の英語スネーク値、nickname 1-20 / bio 0-200 grapheme 制限、tone enum membership、`sealCharacter` フィールド消滅、を test に明示。

`pnpm -F @me-me-en/domain test`:

```
Tests  10 failed | 29 passed (39)
```

LSP diagnostics（旧 entity と新 test の衝突を捕捉）:
- `Module './user' has no exported member 'TONES'`
- `'sealCharacter' is missing in type ... but required in type 'CreateUserInput'`
- `'moon_gazing' / 'nothing' is not assignable to '眠れない' | '寝る前に' | ...`

### 2. GREEN — user.ts を spec 仕様で書き直し

- `sealCharacter` フィールドと validation を削除
- `SIGN_TAGS` を 8 個の英語スネーク値に置換（profile-only）
- `TONES` を 6 色 readonly tuple として追加（design 由来）
- `Tone` 型を `tone` フィールドに適用
- nickname 1-20 grapheme・bio 0-200 grapheme・tone enum membership の validation 追加
- `index.ts` から `Tone` / `TONES` を re-export

`pnpm -F @me-me-en/domain test`:

```
Test Files  2 passed (2)
     Tests  39 passed (39)
```

`pnpm -F @me-me-en/domain typecheck`: 緑。

### 3. REFACTOR

不要。実装は最小、命名も spec 用語に揃った。

## 結果

User entity の公開 API は次に更新:

```ts
import {
  User,
  PresenceVisibility,
  SignTag,
  Tone,
  CreateUserInput,
  createUser,
  isSignTag,
  SIGN_TAGS,
  TONES,
} from '@me-me-en/domain'
```

`UserRepository` interface には変更なし。

## 未解決の残課題（次の Phase 1 着手前に）

- nickname の system-wide unique 制約は **repository / use case 層**の責務（domain entity は unique を強制しない）。Phase 4 で adapter 側に index 制約を入れる。
- Phase 1 で本格着手する Conversation / Message / Post 系は、本 refactor の延長線上で進める。
