# Phase 1b — User entity + UserRepository interface

## 方針

迷羊苑のユーザー（羊）を domain 最内層の entity として確立する。設計の核は:

- `@handle` を持たない（design 仕様 v2 で廃止）
- `nickname` のみ
- 各ユーザーは **判子（hanko）の 1 文字漢字** を持つ
- `presenceVisibility: visible | invisible` を**永続化された属性**として持つ（揮発な Presence とは別）
- `currentSigns: SignTag[]` を「今宵のしるし」として持つ
- 入店初日 `joinedAt`

`UserRepository` は IF（port）として domain に置く。実装（InMemory / 後の Prisma）は infrastructure 側。

## TDD 方針

本 Phase からは明確に **test 先行**:

1. `user.test.ts` を先に書く
2. `vitest run` で **RED** を確認（user.ts は存在しないので import エラーで失敗する）
3. `user.ts` を最小実装で書く
4. `vitest run` で **GREEN** を確認
5. REFACTOR があれば test を緑に保ちながら適用

## 対象範囲

- `packages/domain/src/user/user.ts` 新規（entity + factory + SignTag enum）
- `packages/domain/src/user/repository.ts` 新規（interface）
- `packages/domain/src/user/user.test.ts` 新規（先行）
- `packages/domain/src/index.ts` 公開 API 追加

InMemoryUserRepository とシードは Phase 1b-2 として別 commit で扱う（このフェーズでは entity 単体に集中）。

## 設計判断（事前）

| 論点 | 採用 | 理由 |
| --- | --- | --- |
| `SignTag` 定義 | `as const` array + union 型 | enum より zod 等とのブリッジが楽。`isSignTag` で type guard |
| `tone` のデフォルト | `#E8E2D2`（design `SheepBrush` のデフォルト tone） | UI と整合 |
| `presenceVisibility` のデフォルト | `visible` | 大半のユーザー、明示的に opt-out したい人だけ `invisible` |
| `bio` のデフォルト | `''`（空文字） | required にせず、ご記帳時の負担を減らす |
| `sealCharacter` validation | 「**1 文字**であること」のみ | 漢字推奨はあるが domain では文字種を強制しない（presentation の責務） |
| `nickname` validation | trim 後 1 文字以上 | 全角空白だけのニックネームは弾く |
| factory 名 | `createUser` | 単純な総合 factory。今後 `enroll` 等の use case で wrap |

## TDD cycle 記録

### 1. RED — test 先行

`packages/domain/src/user/user.test.ts` を Write し、`pnpm -F @me-me-en/domain test` を実行。

```
FAIL  src/user/user.test.ts
Error: Failed to load url ./user
  (resolved id: ./user) ... Does the file exist?
```

`user.ts` がまだ存在しないため suite が load 段階で失敗。**期待通り**。
既存の `time.test.ts` は影響なく 27/27 緑。

### 2. RED 観察中の補正

test に書いた immutable 確認:
```ts
// @ts-expect-error
expect(() => u.currentSigns.push('読書中')).toThrow()
```
これに対し TS が「Unused '@ts-expect-error' directive」を警告。
判断: `User` フィールドはすべて `readonly` で TS の compile-time 保証は十分。
`Object.freeze` を加えて runtime immutability まで強制するかは別議論で、Phase 1b では不要と判断し test を削除（YAGNI）。

### 3. GREEN — 最小実装

並列 Write:
- `packages/domain/src/user/user.ts`（factory + `SignTag` enum + `isSignTag` type guard）
- `packages/domain/src/user/repository.ts`（`UserRepository` interface）
- `packages/domain/src/index.ts` 更新（公開 API 追加）

実装中の判断:
- `sealCharacter` の長さ判定は `[...input.sealCharacter].length` で grapheme 単位。`.length` だと UTF-16 code unit で漢字以外の surrogate pair を取り違える可能性に対する保険。

`pnpm -F @me-me-en/domain test`:
```
Test Files  2 passed (2)
     Tests  35 passed (35)   ← user 8 + time 27
```

`pnpm -F @me-me-en/domain typecheck`: 緑。

### 4. REFACTOR

不要。実装はすでに小さい。次の Phase で User を扱う side（InMemory adapter / use cases）が現れた段階で、必要に応じて factory を分割する余地がある。

## 結果

- 公開 API:
  - `User` / `PresenceVisibility` / `SignTag` / `CreateUserInput` 型
  - `createUser` factory（validation 込み）
  - `SIGN_TAGS` / `isSignTag` で type guard
  - `UserRepository` interface
- 検証: vitest 8 件、tsc --noEmit 緑

## 未解決の残課題

- 「親しい羊」概念は User entity の責務ではなく、Conversation 側の派生として算出する想定（Phase 1c で扱う）
- `sealCharacter` の漢字以外の許容範囲（ひらがな / カタカナ / 絵文字）は domain では制限しない方針だが、UI で日本語キーボードに誘導するか、サーバ側で文字種制限を別途加えるかは presentation の判断に委ねる
- `joinedAt` を Date のまま持っている。将来 ISO 文字列か `Date` 統一かは Conversation や Message のタイムスタンプ実装と合わせて決める

