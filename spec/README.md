# Specification Directory

このディレクトリは、めぃめぃ亭プロジェクトの全機能仕様を管理します。

## ディレクトリ構造

```
spec/
├── README.md                    # このファイル
├── templates/
│   └── feature-template.md      # 新機能仕様作成時のテンプレート
└── features/
    ├── _index.md               # 全機能の一覧と状態管理
    ├── business-hours.md       # 営業時間チェック
    ├── user-entrance.md        # ユーザー入店
    ├── seat-system.md          # 座席システム
    ├── chat.md                 # チャット
    └── realtime-sync.md        # リアルタイム同期
```

## 状態フラグ

各機能仕様ファイルの先頭に以下のメタデータを記載：

```yaml
---
feature: {feature-name}
status: :TODO | :SPEC_DONE | :TEST_WRITTEN | :IMPLEMENTED | :DONE
priority: high | medium | low
dependencies: []
---
```

### 状態の定義

| Status | 説明 | 次のアクション |
|--------|------|----------------|
| `:TODO` | 仕様未作成 | 仕様を書く |
| `:SPEC_DONE` | 仕様完成 | テストを書く（RED確認） |
| `:TEST_WRITTEN` | テスト作成済み | 実装する（GREEN） |
| `:IMPLEMENTED` | 実装完了 | リファクタ・カバレッジ確認 |
| `:DONE` | **全AC完了・全テストGREEN・カバレッジ80%+** | - |

**CRITICAL: `:DONE`の条件（1つでも欠けたら`:DONE`にしてはいけない）**

- ✅ 仕様書に定義された**全てのAC**が実装されている
- ✅ 全てのACに対応する**テストが作成**されている（E2E/Integration/Unit）
- ✅ **全てのテストがパス**している（GREEN）
- ✅ テストカバレッジが**80%以上**
- ✅ 仕様書とコードが一致している
- ❌ 「後で実装する」ACが1つでも残っている場合は`:DONE`にしない

## ATDD-SDD Workflow

### フロー概要

```
1. spec/templates/feature-template.md をコピー
2. AC（受け入れ条件）から記述開始
3. 全10セクションを埋める
4. status: :SPEC_DONE に更新
5. テストを書く（E2E → Integration → Unit）
6. status: :TEST_WRITTEN に更新
7. RED確認（テスト失敗）
8. 実装する（最小限）
9. GREEN確認（テスト通過）
10. リファクタリング
11. status: :DONE に更新
```

### 詳細ワークフロー（10ステップ）

#### Phase 1: Specification (SPEC_DONE)

1. **Feature Request** - 要求を理解
2. **Update Spec** - AC-Firstで仕様記述
   - X.1 Definition
   - **X.2 Acceptance Criteria（最初に書く）**
   - X.3 User Story
   - X.4 Technical Stack
   - X.5 Data Model（CRUD操作含む）
   - X.6 API Design
   - X.7 Processing Flow
   - X.8 UI Requirements
   - X.9 Edge Cases & Error Handling
   - X.10 Test Implementation Plan

#### Phase 2: Test Development (TEST_WRITTEN)

3. **Write AC Test** - E2Eテスト作成
4. **RED Phase** - テスト失敗確認
5. **Write Int Test** - 統合テスト作成
6. **Write Unit Test** - ユニットテスト作成

#### Phase 3: Implementation (IMPLEMENTED)

7. **GREEN Phase** - 最小限の実装でテスト通過
8. **IMPROVE Phase** - リファクタリング

#### Phase 4: Verification (DONE)

9. **Verify Coverage** - 80%+カバレッジ確認
10. **Sync Spec** - 実装結果を仕様に反映

## テンプレートの使い方

新機能を追加する場合：

```bash
# 1. テンプレートをコピー
cp spec/templates/feature-template.md spec/features/new-feature.md

# 2. メタデータを更新
# status: :TODO, priority, dependencies を設定

# 3. ACから記述開始
# Section X.2 Acceptance Criteria を最初に埋める

# 4. 全セクションを記述
# Section X.1-X.10 をすべて埋める

# 5. spec/features/_index.md に追加
# 機能一覧に新機能を登録
```

## AC-First Principle

**なぜACを最初に書くのか:**

1. **ユーザー視点の明確化** - 何を満たせば完了かを最初に決める
2. **スコープの制限** - ACに含まれないものは実装しない
3. **テスト可能性の担保** - 曖昧なACはテストできない
4. **ステークホルダーとの合意** - 完了条件を事前に合意

**ACの書き方:**

```markdown
**AC-1: {簡潔なタイトル}**
- Given: {前提条件}
- When: {ユーザー操作/トリガー}
- Then: {期待される結果}
- 検証方法: {E2E/Integration/Unitのどれでどうテストするか}
```

## Test Hierarchy

```yaml
test-levels:
  acceptance:  # E2E - ユーザー視点
    tool: Playwright
    location: e2e/tests/
    naming: "{feature}.spec.ts"
    priority: 1  # 最初に書く

  integration:  # API/WebSocket - システム間連携
    tool: Vitest
    location: apps/*/tests/integration/
    naming: "{feature}.integration.test.ts"
    priority: 2

  unit:  # 関数/モジュール - 個別ロジック
    tool: Vitest
    location: "**/__tests__/*.test.ts"
    naming: "{module}.test.ts"
    priority: 3

coverage:
  minimum: 80%
  critical-paths: 100%  # 営業時間判定、認証など
```

## Traceability Matrix

仕様とテストの追跡性：

| Feature | AC | E2E Test | Integration Test | Unit Test | Status |
|---------|----|---------|-----------------------|-----------|--------|
| business-hours | AC-1 | `business-hours.spec.ts#AC-1` | `business-hours.integration.test.ts#OPEN` | `business-hours.test.ts#22:00` | :IMPLEMENTED |

詳細は `spec/features/_index.md` を参照。

## ルールセット

1. **仕様変更は spec/ が先** - コード変更の前に仕様を更新
2. **テストは仕様の直訳** - テストの意図は仕様に1:1対応
3. **実装は最小限 (YAGNI)** - 仕様にないものは実装しない
4. **各フィーチャーは独立検証可能** - 単一機能でテスト完結
5. **受入テスト = 仕様の生き証拠** - テストが仕様を正確に反映
