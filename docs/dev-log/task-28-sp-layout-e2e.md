# Task #28 — test 拡充: SP レイアウトの e2e regression

## 方針

`#28 test 拡充` のうち、最も価値の高い欠落を埋める。`authenticated.spec.ts` は desktop viewport のみで、SP UI 対応（#30, γ）を守る regression が無かった（γ dev-log の残課題）。SP の根幹である「ナビ外殻の出し分け」を e2e で固定する。

他の候補（DM 統合の 1 相手 1 スレッド invariant、rate limit）は既に application unit test で担保済。閉店スケジューラの fake-timer 統合テストは server.ts のロジック抽出が要るため別タスクに残す。

## 範囲

### presentation（a11y 兼テスト容易化）

- `_components/bottom-tab.tsx`: `<nav aria-label="下段タブ">`
- `_components/sidebar.tsx`: `<aside aria-label="サイドバー">`

複数のランドマーク（nav / complementary）に識別名を与える a11y 改善であり、e2e から role + name で安定して掴めるようにする副次効果も持つ。

### e2e

`tests/e2e/sp-layout.spec.ts`（新規）:

- **mobile viewport (390×844)**: 下段タブ (`navigation` "下段タブ") が visible、サイドバー (`complementary` "サイドバー") が hidden
- **desktop viewport (1280×800)**: 逆（サイドバー visible、下段タブ hidden）

`hidden md:flex` / `md:hidden` が breakpoint で正しく効いていることを両端で保証する。

## 設計判断

- **role + aria-label で掴む**: `迷羊苑` のようなテキストは TopBar / BottomTab / Sidebar に重複し strict mode 違反を招く（#61 で実際に踏んだ）。ランドマーク role + 一意な aria-label が最も安定
- **desktop 側も assert**: 「SP 対応で desktop を汚さない」(#30 の制約) を逆向きにも固定。mobile だけ見ると desktop 退行を見逃す
- **viewport は `test.use` で describe 単位**: Playwright default (desktop) を mobile describe でだけ上書き

## 検証

ローカルで webServer 自動起動 + 全 e2e 実行:

```
AUTH_SECRET=… BYPASS_BUSINESS_HOURS=true E2E_TEST_ENABLED=true DATA_STORE=memory \
  pnpm -F @me-me-en/web exec playwright test
# 9 passed (既存 smoke 3 + authenticated 4 + sp-layout 2)
```

- sp-layout 2 ケース green（mobile / desktop 両端）
- aria-label 追加が既存 authenticated / smoke spec を壊していないことも確認
- `pnpm -F @me-me-en/web typecheck`: 緑

## 残課題（#28 の続き候補）

- 閉店スケジューラ（force-disconnect）の fake-timer 統合テスト（server.ts のスケジュール部を抽出して単体化）
- DM スレッド画面の送受信 / typing / 既読の e2e（socket 絡みで flaky になりやすく要工夫）
- presentation コンポーネントの unit test 導入可否（現状 apps/web に unit test 層なし）
