# Fix — CI e2e smoke が seed 403 で常時失敗していた問題

## 症状

全 PR で `e2e smoke (Playwright)` job が失敗。ログ:

```
Error: seed failed: 403 {"error":"E2E seed is disabled. Set E2E_TEST_ENABLED=true in non-production env."}
  at signInAs (apps/web/tests/e2e/_helpers.ts:43)
```

`authenticated.spec.ts` の各テストが `/api/test/seed` への POST で 403 を受け、`_helpers.ts` で throw → 7 テスト全滅。

## 根本原因

seed endpoint (`apps/web/src/app/api/test/seed/route.ts`) のゲート:

```ts
const isE2eAllowed = () =>
  process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_ENABLED === 'true'
```

CI の e2e job (`.github/workflows/ci.yml`):

- サーバ起動が `pnpm --filter @me-me-en/web start` = `NODE_ENV=production tsx server.ts`（package.json）
- job の `env:` に `E2E_TEST_ENABLED` が無い

→ `NODE_ENV === 'production'` のため第 1 条件が常に false。`E2E_TEST_ENABLED=true` を足しても prod 起動のままでは 403 のまま。**両条件が同時に成立し得ず、構造的に絶対 pass しない**。PR #60 で e2e が入って以降 main がずっと red だった。

## 修正方針（採用 = A: CI の e2e だけ非 production 起動）

本番ゲートの `NODE_ENV !== 'production'` は**セキュリティの網として温存**し、CI の e2e smoke だけを dev mode で起動する。

- 「ゲートを `E2E_TEST_ENABLED` のみに緩和」案 (B) は、本番で env を 1 つ立て間違えると seed が開くため不採用（`security.md` 方針）
- prod ビルドの動作確認は `verify`（lint/typecheck/test/build）と `integration (Postgres)` job が別途担保するため、e2e smoke は dev mode で十分

## 変更

### apps/web/package.json

```json
"start:e2e": "BYPASS_BUSINESS_HOURS=true E2E_TEST_ENABLED=true tsx server.ts"
```

`NODE_ENV` を設定しない → `next({ dev: NODE_ENV !== 'production' })` が dev mode で起動。E2E モードに必要な 2 つの env を script に閉じ込め single source of truth とする:

- `E2E_TEST_ENABLED=true`: seed ゲート（`NODE_ENV !== 'production' && E2E_TEST_ENABLED`）を通す
- `BYPASS_BUSINESS_HOURS=true`: **営業時間ゲートを bypass**。CI は任意の時刻に走るため、22:00-05:00 JST 外だと middleware が protected page を `/closed` へ redirect し、`迷 羊 苑` 等のアサーションが落ちる。`isBusinessHoursBypassed()` も `NODE_ENV !== 'production'` を要求するため dev mode 起動が前提

> 第一の修正（E2E_TEST_ENABLED 追加）で seed 403 は解消したが、CI 実行時刻が 19:04 JST（営業時間外）だったため次に `/closed` redirect でアサーションが落ちた。2 つのゲート（seed + 営業時間）を両方 bypass して初めて green になる。

### .github/workflows/ci.yml（e2e job）

- 不要になった `Build Next.js` step を削除（dev server は `.next` prod ビルドを使わない）
- 起動を `pnpm --filter @me-me-en/web start:e2e` に変更
- dev server はオンデマンドコンパイルで起動がやや遅いため、health 待ちを 60s → 120s に延長

## 検証

ローカルで dev mode 起動 + 2 ゲート bypass を実機確認:

```
PORT=3100 DATA_STORE=memory pnpm start:e2e
# ready after 1-3s
POST /api/test/seed                → HTTP 200 {"ok":true}   (従来は 403)
GET  /chats (19:06 JST = 営業時間外) → 307 /login            (/closed ではない = bypass 有効)
```

seed ゲートと営業時間ゲートの両方が通ることを確認。CI 上の green は push 後の run で確認する。

## 備考

- 本番 (Render) は `E2E_TEST_ENABLED` を設定しないため seed は引き続き無効。二重ゲートのうち `NODE_ENV !== 'production'` も温存されており、安全性は不変
- main から分岐した独立 fix。他 feature PR (#61/#62/#63) とはファイル非重複でコンフリクトなし
