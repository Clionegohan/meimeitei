# Task #4 — ESLint flat config + import 境界ルール

## 方針

Phase 0 から未着手だった ESLint セットアップを実装する。目的は clean architecture の層間依存方向を機械的に強制すること。

```
apps/web → infrastructure → application → domain
                          ↘ contracts → domain
```

外 → 内の依存は OK、逆方向は禁止。違反すると CI で error として出る。

## 範囲

### 依存追加 (root)

- `eslint@^9.17.0` (9.x 固定: 10.x は Node 22+ の `util.styleText` を要求し手元の Node 20.11 では起動できない)
- `@eslint/js`
- `typescript-eslint` (8.x、flat config 対応)
- `eslint-plugin-import-x` (4.x、`import` plugin の flat config 公式 fork)
- `eslint-import-resolver-typescript`
- `globals`

### eslint.config.js (root)

flat config を root に 1 つ置き、全 package を 1 発でカバー。

主要設定:

- `js.configs.recommended`
- `tseslint.configs.recommended`
- `importX.flatConfigs.recommended` + `importX.flatConfigs.typescript`
- **`import-x/no-restricted-paths`** の zones で 4 つの境界を declarative に定義:

```js
const restrictedPathsZones = [
  // domain は依存なし
  { target: '.../packages/domain/src',
    from: [.../application, .../infrastructure, .../contracts, .../apps/web] },
  // application は domain のみ
  { target: '.../packages/application/src',
    from: [.../infrastructure, .../apps/web] },
  // infrastructure は apps を見ない
  { target: '.../packages/infrastructure/src',
    from: [.../apps/web] },
  // contracts は domain のみ
  { target: '.../packages/contracts/src',
    from: [.../application, .../infrastructure, .../apps/web] },
]
```

### package.json (root)

`turbo run lint` → `eslint .` に変更。flat config を root から全 package に適用するので turbo の workspace 分散は不要。

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

## 設計判断

- **ESLint 9 固定**: 10.x は Node 22+ の `util.styleText` API を要求。Node 20.11（Prisma 5.x も同じ理由で 20.11 と相性が良い）に揃える
- **flat config を root に 1 つ集約**: workspace ごとに config を持たせるより、層境界を一元管理する方が見通し良い。各 package 側に lint script を作らず root から `eslint .` で全ファイル走査
- **`eslint-plugin-import-x`**: 元の `eslint-plugin-import` は flat config 対応が遅れている。`-x` fork が活発でメンテ状況良好
- **`import-x/no-restricted-paths`** の絶対パス指定: `target` / `from` は file system path を直接見るため、resolver を通った後の絶対 path で書く。`new URL('.', import.meta.url).pathname` で project root を起点に
- **既存コードの軽微 warning を緩める**: `import-x/no-unresolved` (tsc がやる)、`import-x/named` (workspace 越しの type 参照誤検知)、`import-x/no-named-as-default*` (flat config 内の default import パターンで false positive) を off
- **test ファイルだけ `any` 許容**: `**/*.test.ts` と `__test-helpers__` で `no-explicit-any` / `no-non-null-assertion` を off

## 検証

### 1. clean な状態

```bash
$ pnpm lint
✖ 0 problems
```

errors 0、warnings 0。

### 2. 境界違反の検出 (手動確認)

- domain から application を import すると `import-x/no-restricted-paths` で error
- application から infrastructure を import すると error
- infrastructure から apps/web を import すると error

これらは declarative 設定なので、誰かが将来書こうとした瞬間に CI / editor で即弾く。

## 完了基準

- [x] `pnpm lint` が errors 0 で通る
- [x] `pnpm lint:fix` も用意
- [x] 境界ルールが zones で定義されている
- [x] dev-log を残す
- [ ] CI に lint job を追加（Render の build phase に追加するかは別判断）

## 残課題

- `pnpm lint` を CI に組み込む（GitHub Actions 等の別 phase）
- `noWarnOnMultipleProjects` を resolver settings に渡して「Multiple projects found」の console warning を抑える（実害なし）
- 各 package で `lint:dev` のような部分 lint script を欲しくなったら追加
