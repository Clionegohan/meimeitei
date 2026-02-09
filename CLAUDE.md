# めぃめぃ亭 (Meimei-Tei)

## meta

```yaml
project: meimei-tei
type: web-app
status: mvp-design
created: 2026-02-05
updated: 2026-02-06
```

---

## 1. overview

深夜限定（22:00-04:00 JST）のWebチャットアプリ。バーチャルバーのメタファー。

### core-concept

- 営業時間外はCLOSED表示、アクセス不可
- 「場所」がコンテンツ（配信者中心ではない）
- 一期一会的コミュニケーション
- 眠れない夜の居場所

### naming

「めぃめぃ」= 羊の鳴き声 + 銘々（各自） + 冥々（暗闘） + 眠々

---

## 2. tech-stack

```yaml
status: confirmed
```

### frontend

| 技術 | 用途 |
|------|------|
| Next.js 15 | App Router、SSR、ルーティング |
| React 19 | UIコンポーネント |
| Three.js (R3F) | バー空間の3Dレンダリング（カウンター・シーン・アバター配置） |
| Tailwind CSS v4 | スタイリング |
| Zustand | クライアント状態管理 |
| Zod | イベントバリデーション (shared) |

### backend / realtime

| 技術 | 用途 |
|------|------|
| Node.js | ランタイム |
| Hono | HTTP API |
| ws | WebSocket リアルタイム同期 |
| Zod | イベントバリデーション (shared) |

### testing

| 技術 | 用途 |
|------|------|
| Vitest | Unit / Integration Test |
| Playwright | E2E Test |
| Testing Library | React Component Test |

### workspace

| 技術 | 用途 |
|------|------|
| pnpm workspaces | モノレポ管理 |
| TypeScript | 型安全性 |

---

## 3. development-flow: ATDD-SDD

### 原則

| 原則 | 説明 |
|------|------|
| SDD (Specification-Driven Development) | `spec/` が唯一の仕様ソース |
| ATDD (Acceptance Test-Driven Development) | 仕様から受入テストを先に書く |
| AC-First | Acceptance Criteria を最初に定義 |

### ワークフロー（簡易版）

```
Spec作成 (AC-First)
  ↓
Test作成 (E2E → Int → Unit)
  ↓
RED確認 (テスト失敗)
  ↓
実装 (最小限)
  ↓
GREEN確認 (テスト通過)
  ↓
リファクタ (品質向上)
  ↓
カバレッジ確認 (80%+)
  ↓
Spec同期 (ドリフト防止)
```

**詳細**: [`spec/README.md`](./spec/README.md) を参照

### Definition of Done (完了の定義)

**CRITICAL: フィーチャーが「完了」と見なされる条件（全て必須）**

| 条件 | 説明 | 確認方法 |
|------|------|----------|
| ✅ 全ACが実装済み | 仕様書に定義された全てのAcceptance Criteriaが実装されている | spec/features/を確認 |
| ✅ 全ACがテスト済み | 全てのACに対応するテスト（E2E/Int/Unit）が作成されている | テストファイルを確認 |
| ✅ 全テストがGREEN | 全てのテストがパスしている | `pnpm test`で確認 |
| ✅ カバレッジ80%+ | テストカバレッジが80%以上 | `pnpm test -- --coverage`で確認 |
| ✅ 仕様とコードが一致 | 仕様書の記述と実装が一致している | コードレビューで確認 |

**絶対に禁止される行為:**

| 禁止事項 | 理由 | 正しい対応 |
|---------|------|-----------|
| ❌ ACを「後で実装する」として残す | フィーチャーが未完了のまま放置される | その場で実装を完了させる |
| ❌ テストを書かずにマージ | 品質保証ができない | 全ACのテストを書いてからマージ |
| ❌ 一部のACだけ実装して完了とする | 仕様を満たしていない | 全ACを実装する |
| ❌ 「E2Eで後で検証する」とコメントだけ残す | テストが実装されていない | 即座にE2Eテストを実装する |
| ❌ テストが失敗しているのにマージ | 壊れた状態でマージされる | 全テストをGREENにしてからマージ |

**テスト手法を変更する場合のルール:**

```
例: Integration Test → E2E Test に変更する場合

❌ 間違った対応:
1. Integration Testが難しいと判断
2. 「E2Eで後で実装する」とコメント
3. ACを未完了のまま放置

✅ 正しい対応:
1. Integration Testが難しいと判断
2. 即座にE2E Testに方針変更
3. その場でE2E Testを実装
4. 全ACが完了してからマージ
```

**方針変更は許容されるが、ACのスキップは絶対に許容されない。**

### ディレクトリ構成

```text
meimei-tei/
├── CLAUDE.md              # このファイル（プロジェクト全体概要）
├── spec/                  # 機能仕様
│   ├── README.md         # ATDD-SDDワークフロー詳細
│   ├── templates/        # 機能仕様テンプレート
│   └── features/         # 各機能の詳細仕様
│       ├── _index.md    # 機能一覧・状態管理
│       ├── business-hours.md
│       ├── user-entrance.md
│       ├── seat-system.md
│       ├── chat.md
│       └── realtime-sync.md
├── docs/                  # 開発ガイド
│   ├── testing.md        # テスト実装ガイドライン
│   └── development.md    # 開発環境セットアップ
├── apps/                  # アプリケーション
│   ├── backend/
│   └── frontend/
├── packages/              # 共有パッケージ
│   └── shared/
└── e2e/                   # E2Eテスト
```

---

## 4. git-workflow: Branch → PR → Review → Merge

### 原則

**必ずPRを作成すること** - CodeRabbitによる自動レビューを活用するため

### コミット粒度の原則

**責務の分離（Single Responsibility Principle）をコミットにも適用**

❌ **NG例：1つの巨大なコミット**
```bash
git commit -m "feat(f002): User Entrance機能の仕様書作成とテスト実装完了"
# → 仕様書、テスト環境、E2E、Integration、Unit、実装修正、ドキュメント更新が全て1つに
```

✅ **OK例：適切な粒度で分割**
```bash
# 1. テスト環境セットアップ
git commit -m "chore: Playwright と Vitest のテスト環境をセットアップ

- Playwright: E2Eテストフレームワーク
- Vitest + Testing Library: フロントエンドユニットテスト
- Vitest: バックエンドintegrationテスト
- 各ワークスペースに設定ファイル追加"

# 2. 仕様書作成
git commit -m "docs(f002): User Entrance機能の詳細仕様書を作成

- 8つのAcceptance Criteriaを定義
- 処理フロー、データモデル、UI要件を記述
- WebSocketイベント仕様を明確化
- エッジケースとエラーハンドリングを文書化"

# 3. E2Eテスト作成
git commit -m "test(f002): User EntranceのE2Eテストを作成

- AC-1: 空の名前でエラー表示
- AC-2: 有効な名前で入店成功
- AC-3: 20文字超過でエラー表示
- AC-8: localStorage永続化
- エッジケース: 特殊文字、絵文字、境界値"

# 4. Integrationテスト作成
git commit -m "test(f002): User EntranceのIntegrationテストを作成

- AC-5: サーバー側Zodバリデーション
- エッジケース: 空白のみ、トリミング、境界値"

# 5. Unitテスト作成
git commit -m "test(f002): User EntranceのUnitテストを作成

- AC-1, AC-3, AC-4: クライアント側バリデーション
- AC-2: localStorage保存とリダイレクト
- UIテスト: フォーム要素レンダリング"

# 6. 実装の改善
git commit -m "fix(f002): labelとinputの関連付けを追加

- htmlFor属性でアクセシビリティ向上
- store.clear()メソッド追加（テストクリーンアップ用）"

# 7. ドキュメント更新
git commit -m "docs(f002): spec/_index.mdのステータスを更新

- F002を :TODO → :DONE に更新
- Traceability Matrix追加
- Update History更新"
```

**コミット分割の判断基準:**

| 判断基準 | 説明 | 例 |
|---------|------|-----|
| **1つの目的** | コミットは1つの目的のみを持つ | テスト環境セットアップ、仕様書作成、テスト作成 |
| **独立して理解可能** | コミットメッセージだけで何をしたか分かる | "E2Eテストを作成" は明確 |
| **独立してrevert可能** | そのコミットだけを取り消せる | テスト追加をrevertしても他に影響なし |
| **レビューしやすい** | 小さい変更は理解しやすい | 1ファイルの変更 vs 15ファイルの変更 |

**コーディングとの対応:**

| コーディング原則 | コミット原則 | 理由 |
|----------------|-------------|------|
| 単一責任の原則（SRP） | 1コミット1目的 | 変更理由が1つ |
| 関心の分離 | 機能別にコミット分割 | テスト/実装/ドキュメントを分離 |
| 小さい関数 | 小さいコミット | 理解しやすい |
| 高凝集・低結合 | 独立したコミット | revert可能 |

### 標準フロー（型化）

```text
┌─────────────────────────────────────────────────────┐
│ 1. ブランチ作成                                      │
│    git checkout -b feature/f00X-feature-name        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. 作業実施                                          │
│    - Spec作成                                       │
│    - Test作成（E2E → Integration → Unit）           │
│    - 実装                                           │
│    - テスト確認（全てGREEN）                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. コミット & Push（適切な粒度で）                   │
│    # 作業ごとに細かくコミット（責務の分離）         │
│    git add <関連ファイル>                           │
│    git commit -m "chore: テスト環境セットアップ"    │
│                                                     │
│    git add <関連ファイル>                           │
│    git commit -m "docs(f00X): 仕様書作成"          │
│                                                     │
│    git add <関連ファイル>                           │
│    git commit -m "test(f00X): E2Eテスト作成"       │
│                                                     │
│    # 全コミット完了後にまとめてpush                 │
│    git push -u origin feature/f00X-feature-name    │
│                                                     │
│    ⚠️ mainブランチが先にpushされていない場合は      │
│       mainを先にpushしてから、featureブランチをpush │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. PR作成（必須）                                    │
│    - GitHubでPRを作成                               │
│    - タイトル: feat(f00X): 機能名                   │
│    - 説明: Summary, Test plan を記載                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. CodeRabbit レビュー待機                           │
│    - 自動レビューコメントを確認                      │
│    - 指摘事項を理解                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. 修正対応                                          │
│    - レビュー指摘に対応                              │
│    - 追加コミット & Push                             │
│    - 再レビュー確認                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 7. マージ                                            │
│    - 全レビュー承認後                                │
│    - Squash and Merge 推奨                          │
│    - ブランチ削除                                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 8. 次のタスクへ                                      │
│    git checkout main                                │
│    git pull origin main                             │
│    → 1. に戻る（次のフィーチャー）                   │
└─────────────────────────────────────────────────────┘
```

### チェックリスト

作業完了前に必ず確認：

- [ ] ブランチは`feature/f00X-*`形式で作成
- [ ] **コミットは適切な粒度で分割（1目的1コミット）**
- [ ] 全テストがGREEN（E2E, Integration, Unit）
- [ ] カバレッジ80%以上
- [ ] `spec/features/_index.md`のステータス更新
- [ ] **mainブランチを先にpush（初回の場合）**
- [ ] **featureブランチをpush**
- [ ] **PRを作成（必須）**
- [ ] CodeRabbitレビューに対応
- [ ] マージ後、ローカルmainを更新

### コミットメッセージ規約

```
<type>(scope): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat`: 新機能の追加
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `test`: テストの追加・修正
- `refactor`: リファクタリング
- `chore`: ビルド、設定、環境セットアップなど
- `perf`: パフォーマンス改善
- `ci`: CI/CD設定

---

## 5. session-coordination: セッション間調整（必須）

**🚨 CRITICAL: 複数のClaude Codeセッションが稼働する際、必ずこのルールに従うこと**

### 問題

Claude Codeの異なるセッションは独立しており、直接通信できない。そのため：
- 同じタスクを複数セッションが重複して実行
- PR作成が衝突
- 作業の無駄・混乱が発生

### 解決策：共有ファイルによる調整

**詳細**: [`.claude/SESSION_COORDINATION.md`](./.claude/SESSION_COORDINATION.md)

### 作業開始前の必須チェック（3ステップ）

#### Step 1: チェックスクリプト実行

```bash
bash .claude/scripts/check-session.sh
```

このスクリプトが自動的に以下を確認：
- `DOING.md` - 他セッションの作業状況
- Git ブランチ - 既存のフィーチャーブランチ
- Git ログ - 直近のコミット
- PRステータス - オープン中のPR

#### Step 2: DOING.md に作業内容を記録

```markdown
### [20260209-220000] - 進行中

- **Feature**: F006 - User Session Management
- **Status**: 🔄 作業中
- **担当フェーズ**: 実装
- **予定完了時刻**: 22:30
```

#### Step 3: 作業開始

衝突がなければ作業開始。

### 作業完了時の必須報告

```markdown
### [20260209-220000] - 完了

- **Feature**: F006 - User Session Management
- **Status**: ✅ 完了
- **成果物**: PR#2
- **次のアクション**: レビュー待ち
```

### 重要な原則

| 原則 | 説明 |
|------|------|
| **報連相 > スピード** | 早く終わらせるより、調整を優先 |
| **DOING.mdは真実** | 常に最新状態を保つ |
| **疑わしきは確認** | 衝突の可能性があれば先に確認 |
| **PR作成は最後の砦** | 特に慎重に確認 |

### 並行作業のルール

✅ **許可される並行作業:**
- 別フィーチャー（F006とF007）
- 同じフィーチャーの別フェーズ（実装担当とPR作成担当）

❌ **禁止される並行作業:**
- 同じフィーチャーの同じフェーズ（実装の重複）

### チェックリスト（毎回確認）

```
[ ] check-session.sh を実行した
[ ] DOING.mdを確認した
[ ] 他セッションと衝突しないことを確認した
[ ] DOING.mdに自分の作業を記録した
[ ] 作業完了時にDOING.mdを更新する予定
```

---

## 6. ai-pair-programming: AI協働開発の原則

このプロジェクトはAIを活用しながらコードリーディングスキルを向上させることも目的としています。

### 実装前の方針説明（必須）

**CRITICAL: コードを書き換える前に、必ず以下を日本語で説明し、ユーザーの承認（OK）を得る**

| 説明項目 | 内容 | 例 |
|---------|------|-----|
| 修正の目的 | なぜこの変更が必要か | 「WebSocket接続が切断される問題を解決するため」 |
| 使用するライブラリ/手法 | 何を使うか、なぜそれを選ぶか | 「Playwrightの`page.waitForEvent()`を使用。理由: WebSocket接続確立を確実に待てるため」 |
| 全体の方針 | どのようなアプローチで解決するか | 「接続確立を待機してからテストを実行する方式に変更」 |
| 代替案 | 他にどんな方法があったか | 「タイムアウトを延ばす方法もあるが、根本解決にならない」 |

**承認フロー:**

```
1. Claude: 方針説明を提示
2. User: 承認（OK）または修正要求
3. Claude: 承認後に実装開始
```

### コード内での「Why」の記述

**すべてのコードに「なぜ」を記述する**

```typescript
// ❌ BAD: Howだけ
const result = data.filter(x => x.value > 0).map(x => x.id)

// ✅ GOOD: WhyとHowの両方
// フィルタリング理由: 無効なデータ（value <= 0）を除外
// map理由: IDのみが必要で、他のフィールドは不要（メモリ効率化）
const result = data
  .filter(x => x.value > 0)  // 有効なデータのみ抽出
  .map(x => x.id)            // IDのみを取得
```

**コメントで説明すべき内容:**

| 項目 | 説明内容 | 例 |
|------|---------|-----|
| なぜそのライブラリ/関数を採用したか | 選択理由 | `// zustandを採用: グローバル状態管理が必要で、Contextより軽量` |
| パフォーマンスやメンテナンス性のメリット | 利点 | `// Map使用: O(1)で検索できるため、配列のO(n)より高速` |
| 代替案があった場合、なぜ不採用か | 不採用理由 | `// Reduxは不採用: 小規模アプリには過剰な設定が必要` |
| 複雑なロジックの意図 | 背景説明 | `// WebSocket再接続ロジック: ネットワーク不安定時の対策` |

### 読みやすさ（可読性）の徹底

**リーダブルコードの原則に従う**

```typescript
// ❌ BAD: 複雑なネスト、短縮記法
const r = d.filter(x => x.v > 0 && x.t === 'a').map(x => ({...x, n: x.n.trim()})).reduce((a, b) => a + b.v, 0)

// ✅ GOOD: 段階的、意味のある命名
const activeData = data.filter(item =>
  item.value > 0 && item.type === 'active'
)

const normalizedData = activeData.map(item => ({
  ...item,
  name: item.name.trim()  // 前後の空白を削除
}))

const totalValue = normalizedData.reduce(
  (sum, item) => sum + item.value,
  0  // 初期値
)
```

**禁止事項:**

| 禁止 | 理由 | 代替 |
|------|------|------|
| 過度なネスト（4階層以上） | 可読性低下 | 関数分割、早期リターン |
| 1文字変数（ループ以外） | 意図不明 | 意味のある名前 |
| マジックナンバー | 理由不明 | 定数化してコメント |
| 長すぎる関数（50行以上） | 責務不明確 | 関数分割 |

**推奨事項:**

```typescript
// ✅ 意味のある命名
const MAX_USERNAME_LENGTH = 20  // 名前の最大文字数（DB制約に合わせる）
const WEBSOCKET_TIMEOUT_MS = 5000  // WebSocket接続タイムアウト（UX考慮）

// ✅ 関数分割
function validateUsername(name: string): boolean {
  // バリデーション理由: 空文字・空白のみ・長すぎる名前を防ぐ
  const trimmedName = name.trim()
  return trimmedName.length > 0 && trimmedName.length <= MAX_USERNAME_LENGTH
}

// ✅ 早期リターン
function processUser(user: User | null): string {
  if (!user) return 'Unknown'  // null/undefinedガード
  if (!user.name) return 'Anonymous'  // 名前なしガード
  return user.name  // 正常系
}
```

### 解説モード

**ユーザーが「詳しく」と聞いたら、ステップバイステップで解説する**

**解説の構造:**

```
1. 全体の目的: このコードが何を実現するか
2. 前提条件: 入力、状態、依存関係
3. ステップ分解: 1行ずつ、何をしているか
4. なぜそうするか: 各ステップの理由
5. 代替案: 他の方法と比較
6. 注意点: エッジケース、パフォーマンス
```

**解説例:**

```typescript
// ユーザーが「このuseEffectを詳しく」と聞いた場合

useEffect(() => {
  if (userId && username) {
    sendEvent({ type: 'join', name: username })
  }
}, [userId, username])

/*
【解説】

1. 全体の目的:
   - WebSocket接続確立後、自動的にjoinイベントを送信する

2. 前提条件:
   - userId: サーバーからwelcomeイベントで受信したID
   - username: localStorageから取得したユーザー名
   - sendEvent: WebSocket送信関数

3. ステップ分解:
   - if (userId && username): 両方が設定されているか確認
     → なぜ: どちらかが欠けていると正常な入店処理ができない
   - sendEvent({ type: 'join', name: username }): joinイベント送信
     → なぜ: サーバーにユーザー参加を通知する必要がある

4. useEffectの依存配列 [userId, username]:
   - なぜ: どちらかが変更されたら再実行
   - userId変更: WebSocket再接続時
   - username変更: ユーザーが名前を変更した時（現状では発生しない）

5. 代替案:
   - ボタンクリックで送信: ユーザーアクションが必要（UX悪い）
   - useCallbackで関数化: 過剰（このケースでは不要）

6. 注意点:
   - StrictModeで2回実行される可能性
   - バックエンドでisJoinedガードが必要
*/
```

### 実装時のチェックリスト

実装前に確認:
- [ ] 方針説明を書いた
- [ ] ユーザーの承認を得た
- [ ] 代替案を検討した

実装中に確認:
- [ ] Whyコメントを書いている
- [ ] 意味のある命名をしている
- [ ] 関数が50行以下
- [ ] ネストが4階層以下

実装後に確認:
- [ ] コメントがHowだけでなくWhyを説明している
- [ ] マジックナンバーを定数化している
- [ ] 解説を求められたら答えられる

---

## 7. features

機能一覧と実装状態。詳細は [`spec/features/_index.md`](./spec/features/_index.md) を参照。

| ID | Feature | Status | Spec | Priority |
|----|---------|--------|------|----------|
| F001 | Business Hours Check | `:IMPLEMENTED` | [spec](./spec/features/business-hours.md) | High |
| F002 | User Entrance | `:TODO` | [spec](./spec/features/user-entrance.md) | High |
| F003 | Seat System | `:TODO` | [spec](./spec/features/seat-system.md) | High |
| F004 | Chat | `:TODO` | [spec](./spec/features/chat.md) | High |
| F005 | Realtime Sync | `:TODO` | [spec](./spec/features/realtime-sync.md) | High |
| **F006** | **User Session Management** | **`:TODO`** | **[spec](./spec/features/user-session-management.md)** | **High** |
| **F007** | **Timeline** | **`:TODO`** | **[spec](./spec/features/timeline.md)** | **Medium** |
| **F008** | **Private Chat** | **`:TODO`** | **[spec](./spec/features/private-chat.md)** | **Medium** |

### Status Legend

- `:TODO` - 仕様未作成
- `:SPEC_DONE` - 仕様完成
- `:TEST_WRITTEN` - テスト作成済み
- `:IMPLEMENTED` - 実装完了
- `:DONE` - すべて完了

---

## 8. getting-started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### Development

```bash
pnpm dev
```

詳細は [`docs/development.md`](./docs/development.md) を参照。

---

## 9. testing

### Test Strategy

```
E2E (Playwright)      → ユーザージャーニー全体
   ↓
Integration (Vitest)  → API・WebSocket・連携
   ↓
Unit (Vitest)         → 個別関数・ロジック
```

### Coverage Target

- Minimum: 80%
- Critical Paths: 100%

詳細は [`docs/testing.md`](./docs/testing.md) を参照。

---

## 10. links

- **プロジェクト概要**: このファイル
- **ATDD-SDDワークフロー**: [`spec/README.md`](./spec/README.md)
- **機能一覧**: [`spec/features/_index.md`](./spec/features/_index.md)
- **テストガイド**: [`docs/testing.md`](./docs/testing.md)
- **開発ガイド**: [`docs/development.md`](./docs/development.md)

---

## version-history

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial spec |
| 1.1.0 | 2026-02-06 | ATDD-SDD workflow, spec/ structure |
| 1.2.0 | 2026-02-07 | Git & PR workflow追加 (CodeRabbit連携) |
| 1.2.1 | 2026-02-07 | コミット粒度の原則を追加（SRP適用） |
