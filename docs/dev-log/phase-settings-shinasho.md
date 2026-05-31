# Phase 設定 — お品書き（設定と規則）の実装

branch: `feat/ui-polish-profile-dm-timeline`

## 方針

placeholder だった `/settings`（お品書き）を実機能化する。既存バックエンド能力に接地させ、
新規 backend は最小限に留める。4 セクション構成：店の決まり / 遮断した羊 / お店を出る / 退苑。

TDD：新規 use-case は test 先行。検証は typecheck / 各層 unit test / 描画 smoke。

## 範囲と対応

### 1. 店の決まり（規則・静的）

`settings/page.tsx` に世界観の約束ごとを静的に列挙（灯るのは夜だけ / 軒先は朝に片付く /
手紙は夜を跨いで残る / 在席は灯で示す）。backend 不要。

### 2. 遮断した羊（ブロック一覧・解除）

- domain：`UserRepository.delete` ではなくこちらは既存の `BlockRepository.listBlockedBy` を利用。
- application：**`listBlockedUsers` use-case** を新規（test 先行）。viewer が遮断した相手の
  User を解決して返す。逆向き（自分を遮断した相手）は秘匿のため返さない。user 不在 id は除外。
- 入口：**他者プロフィールに「遮断する / 遮断を解く」トグル**を追加（`other-profile.tsx`、
  `profile/actions.ts` の `blockUserAction` / `unblockUserAction`）。遮断中は「話しかける」を隠す。
  `profile/[userId]/page.tsx` で `blockRepository.findBy` を引いて `isBlocked` を渡す。
- 解除：遮断した羊は客帳から消えるため、解除導線は**お品書きが唯一**。
  `settings/blocked-list.tsx`（client、serializable props のみ）＋ `unblockFromSettingsAction`。

### 3. お店を出る（ログアウト）

`signOut` を inline server action の form で配置（visit-record-rail と同じ作法）。

### 4. 退苑（アカウント削除）

- domain：`UserRepository.delete(id)` と `AuthIdentityRepository.deleteByUser(userId)` を IF 追加。
  in-memory / prisma 双方に実装（prisma の関連 cascade は schema の onDelete に委ねる）。
- application：**`deleteAccount` use-case** を新規（test 先行）。auth identity を消して sign-in を断ち、
  user レコードを削除。投稿・手紙の足跡は cascade／degrade（author 不在は「名なし」）に委ねる。
- UI：`settings/danger-zone.tsx`（client）。二段階 +「退苑」入力確認。`deleteAccountAction` は
  削除後に `signOut({ redirectTo: '/login' })`（redirect throw は try 外）。

## 配線

- DI（`server/di/use-cases.ts`）：`createListBlockedUsers` / `createDeleteAccount` を配線
  （`authIdentityRepository` を repos から注入）。
- application `index.ts`：`ListBlockedUsers*` / `DeleteAccount*` を re-export。
- 試験土台 `__test-helpers__/fakes.ts`：`inMemoryUserRepo` に `delete`、新規 `inMemoryAuthIdentityRepo`。

## 検証

- `pnpm -r typecheck` 全 Done。
- `pnpm -r test`：domain 97 / application 140（+7：listBlockedUsers 4・deleteAccount 3）/ infra 42、全 pass。
- `pnpm lint` クリーン。
- 描画 smoke：`/settings` 200・4 セクション表示、他者プロフに遮断トグル、遮断 0 件の空文言。

## 限界・申し送り

- 退苑の content cascade は Prisma schema の onDelete 依存。in-memory では投稿/手紙が孤立し
  「名なし」で degrade する（破綻はしない）。完全な足跡削除は別途。
- ブロックは無向（既存ポリシー）。お品書きの一覧は「自分が遮断した相手」のみ。
