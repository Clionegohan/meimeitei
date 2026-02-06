# Feature: Business Hours Check

---
feature: business-hours
status: :IMPLEMENTED
priority: high
dependencies: []
created: 2026-02-05
updated: 2026-02-06
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | 営業時間（22:00-04:00 JST）をチェックし、営業中/閉店中を判定する |
| 目的 | 深夜限定のバーチャルバー体験を実現する |
| 対象ユーザー | 全アクセスユーザー |
| スコープ | 時間判定ロジック、API、UI表示。タイムゾーン変換は含まない |

## 2. Acceptance Criteria

**AC-1: 営業時間内アクセスで入店可能**
- Given: 現在時刻が22:00-04:00 JST
- When: ユーザーがトップページにアクセス
- Then: 入店画面（名前入力フォーム）が表示される
- 検証方法: E2E - 時刻モック使用

**AC-2: 営業時間外アクセスでCLOSED表示**
- Given: 現在時刻が04:00-22:00 JST
- When: ユーザーがトップページにアクセス
- Then: CLOSED画面が表示され、入店不可
- 検証方法: E2E - 時刻モック使用

**AC-3: 境界値での正確な判定**
- Given: 現在時刻が22:00:00 JST（ちょうど開店時刻）
- When: ユーザーがトップページにアクセス
- Then: 入店画面が表示される（OPEN判定）
- 検証方法: Unit - 境界値テスト

**AC-4: 境界値での正確な判定（閉店）**
- Given: 現在時刻が04:00:00 JST（ちょうど閉店時刻）
- When: ユーザーがトップページにアクセス
- Then: CLOSED画面が表示される（CLOSED判定）
- 検証方法: Unit - 境界値テスト

## 3. User Story

```
As a 夜更かしユーザー
I want to 深夜だけ開いているバーにアクセスしたい
So that 眠れない夜の特別な居場所を感じられる
```

**メインシナリオ:**

1. ユーザーがブラウザでトップページにアクセス
2. システムがサーバーサイドで現在時刻（JST）を取得
3. システムが営業時間判定を実行
4. 営業中の場合: 入店画面を表示
5. 閉店中の場合: CLOSED画面を表示

**代替シナリオ:**

- 4a. サーバーエラーの場合: エラー画面表示、自動リトライ

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | Next.js 15 | SSRで営業状態取得 | `apps/frontend/src/app/page.tsx` |
| Frontend | React 19 | 条件分岐レンダリング | `apps/frontend/src/components/` |
| Backend | Hono | `/api/status` エンドポイント | `apps/backend/src/app.ts` |
| Shared | Zod | レスポンスバリデーション | `packages/shared/src/schemas/` |
| Shared | TypeScript | 型定義 | `packages/shared/src/types/` |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| `apps/frontend/src/app/page.tsx` | 営業状態に応じた条件分岐追加 |
| `apps/backend/src/app.ts` | `/api/status` エンドポイント追加 |
| `packages/shared/src/index.ts` | 型・スキーマのエクスポート追加 |

## 5. Data Model

**Entity: BusinessStatus**

```typescript
interface BusinessStatus {
  open: boolean
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| open | boolean | Yes | - | 営業中かどうか |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| open | boolean | Invalid status value |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | システム | APIリクエスト時 | 計算で生成（永続化なし） | なし |
| Read | ユーザー | ページアクセス時 | GET /api/status | なし |
| Update | N/A | N/A | N/A（状態は毎回計算） | N/A |
| Delete | N/A | N/A | N/A（永続化なし） | N/A |

**Relationships:**

```
BusinessStatus (計算結果、他エンティティとの関連なし)
```

## 6. API Design

**Endpoint: GET /api/status**

```yaml
description: 現在の営業状態を取得
auth: none
rate-limit: なし（MVP）
```

Request:
```typescript
// Headers
{
  "Accept": "application/json"
}
// Body: なし
```

Response (Success):
```typescript
// Status: 200
{
  "open": true | false
}
```

Response (Error):
```typescript
// Status: 500
{
  "error": "Internal Server Error"
}
```

## 7. Processing Flow

**詳細フロー:**

```
1. GET /api/status リクエスト受信
   │
   ├─ Get Current Time
   │   └─ new Date() で現在時刻取得
   │
   ├─ Convert to JST Hour
   │   └─ (utcHour + 9) % 24
   │
   ├─ Check Business Hours
   │   ├─ hour >= 22 → open = true
   │   ├─ hour < 4 → open = true
   │   └─ otherwise → open = false
   │
   └─ Response
       └─ { open }
```

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | hour >= 22 OR hour < 4 | open = true |
| BR-2 | hour >= 4 AND hour < 22 | open = false |

## 8. UI Requirements

**画面: トップページ**

```yaml
route: /
layout: FullScreen
auth: none
```

**状態遷移:**

```
[Loading] ──API応答──> [OPEN] or [CLOSED]
    │
    └──エラー──> [Error] ──リトライ──> [Loading]
```

| State | Display | User Actions | Next States |
|-------|---------|--------------|-------------|
| Loading | スピナー | なし | OPEN, CLOSED, Error |
| OPEN | 入店画面へリダイレクト | なし | /enter |
| CLOSED | CLOSED看板、営業時間案内 | なし | (時間経過で自動更新) |

**コンポーネント構成:**

```
HomePage
├── useEffect (営業時間チェック)
├── Loading State (ローディング表示)
└── CLOSED State (CLOSED表示)
```

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| 開店境界 | 22:00:00.000 JST | OPEN判定 |
| 閉店境界 | 04:00:00.000 JST | CLOSED判定 |
| 深夜0時 | 00:00:00 JST | OPEN判定 |
| サーバー時刻ずれ | NTPズレ | サーバー時刻を信頼 |
| クライアント時刻詐称 | DevToolsで変更 | 無視（サーバー判定） |
| バックエンド未起動 | 接続エラー | CLOSED扱い（fallback） |

**Error Handling Matrix:**

| Error Type | HTTP Status | Error Code | User Message | Recovery Action |
|------------|-------------|------------|--------------|-----------------|
| Server | 500 | - | CLOSED表示 | フォールバック |
| Network | - | - | CLOSED表示 | フォールバック |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E) ← 未実装
   ├── AC-1: 営業時間内アクセス → RED確認
   └── AC-2: 営業時間外アクセス → RED確認

2. Integration Test ← 未実装
   └── GET /api/status テスト → RED確認

3. Unit Test ← 未実装
   ├── isOpen() 境界値テスト → RED確認
   └── getJSTHour() テスト → RED確認

4. Implementation (GREEN) ← 完了
   ├── apps/backend: isOpen(), GET /api/status ✅
   └── apps/frontend: HomePage with conditional rendering ✅

5. Refactor (IMPROVE) ← 未実施
   ├── エラーハンドリング強化
   └── カバレッジ確認 (80%+)
```

**テストファイル:**

| Test Type | File Path | Priority | Status |
|-----------|-----------|----------|--------|
| E2E | `e2e/tests/business-hours.spec.ts` | 1 | ⚪️ TODO |
| Integration | `apps/backend/tests/integration/api.integration.test.ts` | 2 | ⚪️ TODO |
| Unit | `apps/backend/src/__tests__/business-hours.test.ts` | 3 | ⚪️ TODO |

**カバレッジ目標:**

| Area | Minimum | Target | Current |
|------|---------|--------|---------|
| Statements | 80% | 90% | 0% |
| Branches | 80% | 90% | 0% |
| Functions | 80% | 90% | 0% |
| Lines | 80% | 90% | 0% |
| Critical Paths | 100% | 100% | 0% |

---

## Implementation Notes

### Current Status

- ✅ Backend実装完了: `apps/backend/src/business-hours.ts`, `apps/backend/src/app.ts`
- ✅ Frontend実装完了: `apps/frontend/src/app/page.tsx`
- ⚪️ テスト未実装: E2E, Integration, Unit すべて未作成

### Next Steps

1. Unit Test作成（`business-hours.test.ts`）
2. Integration Test作成（`api.integration.test.ts`）
3. E2E Test作成（`business-hours.spec.ts`）
4. RED確認（テスト失敗）
5. 必要に応じて実装修正
6. GREEN確認（テスト通過）
7. カバレッジ確認・追加テスト
8. status: `:DONE` に更新
