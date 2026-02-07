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

## 5. features

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

## 6. getting-started

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

## 7. testing

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

## 8. links

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
