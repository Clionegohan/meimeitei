# Feature: {Feature Name}

---
feature: {feature-id}
status: :TODO
priority: high | medium | low
dependencies: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## 1. Definition

| 項目 | 内容 |
|------|------|
| 概要 | このフィーチャーが何をするか（1-2文） |
| 目的 | なぜこのフィーチャーが必要か |
| 対象ユーザー | 誰のための機能か |
| スコープ | 何を含み、何を含まないか |

## 2. Acceptance Criteria

**重要: ACはこのフィーチャーの完了条件。ACを満たせば実装完了。**

**AC-1: {タイトル}**
- Given: {前提条件}
- When: {ユーザー操作/トリガー}
- Then: {期待される結果}
- 検証方法: {E2E/Integration/Unitのどれでどうテストするか}

**AC-2: {タイトル}**
- Given: {前提条件}
- When: {ユーザー操作/トリガー}
- Then: {期待される結果}
- 検証方法: {テスト方法}

**AC-3: {エラー系タイトル}**
- Given: {異常な前提条件}
- When: {ユーザー操作/トリガー}
- Then: {エラー時の期待される振る舞い}
- 検証方法: {テスト方法}

## 3. User Story

```
As a {ユーザータイプ}
I want to {達成したいこと}
So that {得られる価値}
```

**メインシナリオ（時系列順）:**

1. ユーザーが {アクション1}
2. システムが {レスポンス1}
3. ユーザーが {アクション2}
4. システムが {レスポンス2}
5. ...

**代替シナリオ:**

- 3a. {条件} の場合: {別の流れ}
- 4a. {エラー条件} の場合: {エラーハンドリング}

## 4. Technical Stack

| レイヤー | 技術 | 用途 | 組み込み場所 |
|----------|------|------|--------------|
| Frontend | {技術名} | {この機能での用途} | {ファイルパス/コンポーネント} |
| Backend | {技術名} | {この機能での用途} | {ファイルパス/モジュール} |
| Shared | {技術名} | {この機能での用途} | {パッケージ名} |
| Infra | {技術名} | {この機能での用途} | {設定ファイル等} |

**既存システムへの影響:**

| 影響を受けるファイル/モジュール | 変更内容 |
|--------------------------------|----------|
| {ファイルパス} | {追加/変更/削除の内容} |

## 5. Data Model

**Entity: {エンティティ名}**

```typescript
interface {EntityName} {
  {field}: {type}  // {説明}
  {field}: {type}  // {説明}
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| {name} | {type} | Yes/No | {value} | {説明} |

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| {name} | {validation} | {message} |

**CRUD Operations:**

| Operation | Actor | Timing | How | Validation |
|-----------|-------|--------|-----|------------|
| Create | {誰が} | {いつ} | {どうやって} | {検証ルール} |
| Read | {誰が} | {いつ} | {どうやって} | {検証ルール} |
| Update | {誰が} | {いつ} | {どうやって} | {検証ルール} |
| Delete | {誰が} | {いつ} | {どうやって} | {検証ルール} |

**Relationships:**

```
{Entity1} ──1:N──> {Entity2}
{Entity1} ──N:M──> {Entity3}
```

| From | To | Relation | Description |
|------|----|----------|-------------|
| {Entity1} | {Entity2} | {1:1/1:N/N:M} | {関係の説明} |

## 6. API Design

**Endpoint: {METHOD} {path}**

```yaml
description: {エンドポイントの説明}
auth: required / optional / none
rate-limit: {制限}
```

Request:
```typescript
// Headers
{
  "Content-Type": "application/json",
  "{header}": "{value}"
}

// Body (if applicable)
{
  "{field}": {type}  // {説明}, {validation}
}
```

Response (Success):
```typescript
// Status: {200/201/204}
{
  "success": true,
  "data": {
    "{field}": {type}
  }
}
```

Response (Error):
```typescript
// Status: {400/401/404/500}
{
  "success": false,
  "error": {
    "code": "{ERROR_CODE}",
    "message": "{ユーザー向けメッセージ}"
  }
}
```

**WebSocket Events (if applicable):**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| {event_name} | C→S / S→C | `{schema}` | {説明} |

```typescript
// Event Schema
const {eventName}Schema = z.object({
  type: z.literal('{event_name}'),
  payload: z.object({
    {field}: z.{type}(),
  }),
})
```

## 7. Processing Flow

**概要フロー:**

```
[トリガー] → [処理1] → [分岐] → [処理2] → [結果]
                         ↓
                    [エラー処理]
```

**詳細フロー:**

```
1. {トリガー/入力}
   │
   ├─ Validation
   │   ├─ {条件1} → {処理}
   │   ├─ {条件2} → {処理}
   │   └─ Invalid → Error: {エラーコード}
   │
   ├─ Authorization (if required)
   │   ├─ Authorized → Continue
   │   └─ Unauthorized → Error: 401
   │
   ├─ Business Logic
   │   ├─ Step 1: {処理内容}
   │   │   └─ if {条件}: {分岐処理}
   │   ├─ Step 2: {処理内容}
   │   └─ Step 3: {処理内容}
   │
   ├─ Side Effects
   │   ├─ {副作用1: DB更新、イベント発火など}
   │   └─ {副作用2}
   │
   └─ Response
       ├─ Success: {成功レスポンス}
       └─ Error: {エラーレスポンス}
```

**Validation Rules:**

| Input | Rule | Error Code | Error Message |
|-------|------|------------|---------------|
| {field} | {ルール} | {CODE} | {メッセージ} |

**Business Rules:**

| Rule ID | Condition | Action |
|---------|-----------|--------|
| BR-1 | {条件} | {アクション} |
| BR-2 | {条件} | {アクション} |

## 8. UI Requirements

**画面: {画面名}**

```yaml
route: {path}
layout: {レイアウト名}
auth: required / optional / none
```

**状態遷移:**

```
[初期状態] ──{イベント}──> [状態2] ──{イベント}──> [状態3]
     │                        │
     └──{エラー}──> [エラー状態]
```

| State | Display | User Actions | Next States |
|-------|---------|--------------|-------------|
| {状態名} | {表示内容} | {可能な操作} | {遷移先} |

**コンポーネント構成:**

```
{PageComponent}
├── {HeaderComponent}
├── {MainComponent}
│   ├── {SubComponent1}
│   └── {SubComponent2}
└── {FooterComponent}
```

**レスポンシブ対応:**

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| mobile (<640px) | {レイアウト} | {注記} |
| tablet (640-1024px) | {レイアウト} | {注記} |
| desktop (>1024px) | {レイアウト} | {注記} |

## 9. Edge Cases & Error Handling

**Edge Cases:**

| Case | Input/Condition | Expected Behavior |
|------|-----------------|-------------------|
| {ケース名} | {入力/条件} | {期待される動作} |
| Empty input | {空の入力} | {エラー表示} |
| Boundary value | {境界値} | {動作} |
| Concurrent access | {同時アクセス} | {動作} |
| Network failure | {ネットワーク断} | {リトライ/エラー表示} |

**Error Handling Matrix:**

| Error Type | HTTP Status | Error Code | User Message | Recovery Action |
|------------|-------------|------------|--------------|-----------------|
| Validation | 400 | INVALID_INPUT | {メッセージ} | フォーム再入力 |
| Auth | 401 | UNAUTHORIZED | {メッセージ} | ログイン誘導 |
| Not Found | 404 | NOT_FOUND | {メッセージ} | トップへ誘導 |
| Server | 500 | INTERNAL_ERROR | {メッセージ} | リトライ |
| WebSocket | - | WS_DISCONNECTED | {メッセージ} | 自動再接続 |

## 10. Test Implementation Plan

**テスト実装順序:**

```
1. Acceptance Test (E2E)
   ├── AC-1 テスト → RED確認
   ├── AC-2 テスト → RED確認
   └── AC-3 テスト → RED確認

2. Integration Test
   ├── API エンドポイントテスト → RED確認
   └── WebSocket イベントテスト → RED確認

3. Unit Test
   ├── Validation ロジックテスト → RED確認
   ├── Business ロジックテスト → RED確認
   └── Utility 関数テスト → RED確認

4. Implementation (GREEN)
   ├── Data Model 実装
   ├── API/WebSocket 実装
   ├── Business Logic 実装
   └── UI 実装

5. Refactor (IMPROVE)
   ├── コード品質改善
   ├── パフォーマンス最適化
   └── カバレッジ確認 (80%+)
```

**テストファイル:**

| Test Type | File Path | Priority |
|-----------|-----------|----------|
| E2E | `e2e/tests/{feature}.spec.ts` | 1 |
| Integration | `apps/*/tests/integration/{feature}.integration.test.ts` | 2 |
| Unit | `packages/*/src/__tests__/{module}.test.ts` | 3 |

**カバレッジ目標:**

| Area | Minimum | Target |
|------|---------|--------|
| Statements | 80% | 90% |
| Branches | 80% | 90% |
| Functions | 80% | 90% |
| Lines | 80% | 90% |
| Critical Paths | 100% | 100% |
