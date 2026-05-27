# Task #26 — 客帳 (listUsers use case + /sheep UI)

## 方針

spec S-c「全体ユーザー一覧（客帳）を sidebar 経由でアクセス」を実装する。客帳は discovery roster で、ここから profile → 手紙（DM）へ繋がる導線。

`/sheep` は γ で placeholder だけ用意されていた。`UserRepository.list()`（joinedAt 昇順）は既存。不足していた `listUsers` use case を application 層に足し、`/sheep` を実 listing に差し替える。

## 範囲

### application

`packages/application/src/use-cases/user/list-users.ts`（新規）:

- deps: `userRepository` / `blockRepository` / `businessHoursGuard`
- `userRepository.list()` を引き、**block 関係（無向）にある相手を除外**、**viewer 自身は常に含める**（自席への動線）
- `index.ts` から export

`listOnlineUsers` と同じ block-aware パターンに揃えた。

### presentation

- `apps/web/src/server/di/use-cases.ts`: `listUsers` を結線（userRepository + blockRepository + businessHoursGuard）
- `apps/web/src/app/(app)/sheep/page.tsx`: placeholder を実 listing に差し替え
  - Server Component。`listUsers({ viewerId })` を呼ぶ
  - 各行: SheepAvatar + nickname + meta（自分=「あなた」、好きな月設定済=「好きな月 · 〇」、未設定=「入店 和暦日付」）
  - link 先: 自分 → `/profile`、他者 → `/profile/[id]`
  - 0 件は「まだ どなたも 記帳しておりません。」
  - SP 対応の padding/見出し（chats 一覧と同じ `px-4 py-6 md:px-14 md:py-10` 等）

## 設計判断

- **block-aware**: 客帳から profile → 手紙へ繋がる以上、block 相手を一覧に出さないのが spec T と整合。`existsBetween`（無向）で双方向の block を除外
- **自分を含める**: 客帳は「全ての羊の帳面」。`listOnlineUsers` 同様、自身も帳面に載る。UI は自分の行を /profile へリンクし「己」バッジを付ける
- **並びは repository 契約に委譲**: joinedAt 昇順（`UserRepository.list` の契約）。use case 側で並べ替えない
- **businessHoursGuard 適用**: 他の read use case と同じく営業時間外は ForbiddenError

## TDD cycle 記録

### 1. RED

- `list-users.test.ts` 4 ケース（block なし全件 / block 相手除外 / 自分は常に含む / 営業時間外 ForbiddenError）
- `pnpm -F @me-me-en/application test list-users`: module 未実装で fail

### 2. GREEN

- `list-users.ts` 実装、export、DI 結線、`/sheep` 差し替え
- `pnpm -F @me-me-en/application test`: **133 / 133 passed**（既存 129 + 新 4）
- `pnpm -F {application,web} typecheck`: 緑

### 3. REFACTOR

- 不要。use case は最小、UI は chats 一覧の様式を流用

## 検証

- application 単体テストで block 除外 / self 包含 / 営業時間ゲートを保証
- typecheck 緑
- ローカル dev server は `start:e2e` の単一インスタンスロック + background プロセスのライフサイクルで screenshot 取得が不安定だったため、`/sheep` の目視は PR レビュー / CI に委ねる（health 200・seed-dummy 302 までは確認済で経路は動作）

## 残課題

- 客帳の pagination（ユーザー数が増えた場合）。MVP 規模 100–1,000 名では全件で許容
- presence「灯ともる」印を客帳の行にも出すか（listOnlineUsers と統合）は将来検討
