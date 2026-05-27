# Task #24 — 投稿の rate limit（30 秒に 1 投稿）

## 方針

spec C 行「rate limit: 30 秒に 1 投稿」を実装する。MVPα のコア体験に含まれる仕様だが、Phase 3（application）では後回しにしていた負債。連投による軒先の荒らし・スパムを防ぐ。

判定は **application 層の `createPost` use case** に置く。「直近の自分の投稿から 30 秒未満なら拒否」という時間ベースの単純な cooldown。専用のカウンタや外部ストアは持たず、既存の `PostRepository.list` で直近 1 件を引いて `Clock.now()` と比較する。

## 範囲

### domain

- `packages/domain/src/shared/errors.ts` に `RateLimitError extends DomainError` を追加。`packages/domain/src/index.ts` から export
  - 営業時間外の `ForbiddenError` とは別概念（時間が経てば再試行可能）であることを呼び出し側 / UI に型で区別させる

### application

- `packages/application/src/use-cases/post/create-post.ts`:
  - `RATE_LIMIT_MS = 30_000`
  - 順序を `ensureOpen()` → **rate limit 判定** → `createPostEntity()`（body validation）→ `save()` に
  - `postRepository.list({ authorId, limit: 1 })` で直近 1 件を取得し、`now - postedAt < 30s` なら `RateLimitError` を throw。残り秒数をメッセージに含める

### presentation

- 変更なし。`createPostAction` は `catch (e) { error: e.message }` で例外メッセージをそのまま返すため、`RateLimitError` の文言（「あと N 秒お待ちください。」）が composer のエラー表示にそのまま出る

## 設計判断

- **判定を use case に置く**: rate limit はビジネスルール。presentation（debounce 等）は UX 補助に過ぎず、source of truth は server 側に必要。domain entity に置くには「他 post との関係」という横断状態が要るため、集約をまたぐ判定は use case が適所
- **削除済み post も cooldown に数える**: `PostRepository.list` は `deletedAt` を filter しない（in-memory / prisma とも）。よって「投稿 → 即削除 → 連投」で cooldown を回避できない。これは意図した設計で、`counts deleted posts too` テストで保証
- **per-author**: `list({ authorId })` で自分の投稿のみを見るため、他ユーザーの投稿頻度に影響されない
- **rate limit を body validation より前に**: 「今は投稿できない」ゲート（営業時間・cooldown）を先に評価し、`createPostEntity` の id 採番・検証を無駄に走らせない。空 body の既存テストは prior post を持たないため cooldown を通過し、従来どおり `ValidationError` になる（後方互換）
- **専用ストアを持たない**: 100–1,000 名規模・単一インスタンス前提（spec 非機能要件）。`list` 1 クエリで足り、Redis 等の導入は過剰

## TDD cycle 記録

### 1. RED

- `create-post.test.ts` に 4 ケース追加:
  - 直近 10 秒前の投稿あり → `RateLimitError`（保存されないことも確認）
  - 直近 31 秒前 → 成功
  - 削除済み 10 秒前 → `RateLimitError`（回避不可）
  - per-author（別ユーザーは影響なし）
- `pnpm -F @me-me-en/application test create-post`: **2 failed**（throw 期待の 2 件。許可系 2 件は throw しないため通過する RED）

### 2. GREEN

- `RateLimitError` を追加、`create-post.ts` に cooldown 判定を実装
- `pnpm -F @me-me-en/application test`: **129 / 129 passed**（既存 125 + 新 4）
- `pnpm -F @me-me-en/domain test`: 88 / 88（`RateLimitError` 追加で回帰なし）
- `pnpm -F {domain,application,web} typecheck`: 緑

### 3. REFACTOR

- 不要。use case に閉じた最小実装

## 残課題

- prisma 側 `PostRepository.list` でも `deletedAt` を filter しないことの整合（現状一致。`#27` migration 時に再確認）
- presentation 側の UX 補助（送信ボタンの 30 秒 disable + カウントダウン表示）は任意。server 判定があれば機能要件は満たすため本タスク範囲外
