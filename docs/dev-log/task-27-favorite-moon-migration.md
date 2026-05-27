# Task #27 — favoriteMoon の Prisma migration

## 背景

Phase γ（PR #61）で `User.favoriteMoon`（好きな月）を全層に追加した際、`schema.prisma` と `user-repository.ts`（toUser / save）は更新したが **migration を作成していなかった**。

main に #62/#63/#64 を取り込んで #61 を更新したところ、CI で発覚:

- `integration (Postgres)`: `user-repository.integration.test.ts` の 3 件が `The column 'favoriteMoon' does not exist in the current database` で失敗
- `e2e smoke`: seed が prisma 経由で favoriteMoon を書込もうとして 500 → seed 失敗 → 全 e2e 失敗

`0_init` migration は β-5 時点の schema で、favoriteMoon column を含まない。

## 変更

`packages/infrastructure/prisma/migrations/1_add_favorite_moon/migration.sql`（新規）:

```sql
-- AlterTable: User に favoriteMoon を追加 (FavoriteMoon の和名 16 種、null = 未設定)
ALTER TABLE "users" ADD COLUMN "favoriteMoon" TEXT;
```

- `favoriteMoon String?` → nullable `TEXT`（0_init の他 String column と同型表記）
- 命名は `0_init` の手動採番に倣い `1_add_favorite_moon`。prisma は辞書順で適用するため `0_init` → `1_add_favorite_moon` の順になる
- `UserAuthIdentity` は 0_init で作成済のため追加 migration 不要（task #27 タイトルに併記されていたが既存）

## 設計判断

- **migration は #61 に内包**: schema 変更（favoriteMoon）が #61 にあるため、その migration も同じ PR で travel させる。schema と migration の乖離を PR をまたいで残さない
- **既存行は null**: `favoriteMoon` は任意設定。default 不要、既存ユーザーは「未設定」(null) として扱われる（profile card は居待月 fallback）

## 検証

- ローカルは docker 不可のため postgres 実行は CI に委ねる
- migration は nullable column 1 本の追加で、prisma が `String?` に対し生成する DDL と一致
- `prisma migrate deploy`（CI の integration / e2e 両 job で実行）が `1_add_favorite_moon` を pending として適用 → favoriteMoon column が作られ、integration / e2e の両失敗が解消する見込み

## 残課題

- 本番（Render）は build phase で `migrate deploy` が走るため、#61 デプロイ時に自動適用される（β-5-d の運用に従う）
