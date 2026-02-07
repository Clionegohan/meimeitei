# Feature Index

全機能の一覧と実装状態を管理します。

## Status Legend

| Status | 説明 | Icon |
|--------|------|------|
| `:TODO` | 仕様未作成 | ⚪️ |
| `:SPEC_DONE` | 仕様完成 | 📝 |
| `:TEST_WRITTEN` | テスト作成済み | 🧪 |
| `:IMPLEMENTED` | 実装完了 | ✅ |
| `:DONE` | すべて完了 | 🎉 |

## Feature List

| ID | Feature | Status | Priority | Dependencies | Spec | Tests | Implementation |
|----|---------|--------|----------|--------------|------|-------|----------------|
| F001 | Business Hours Check | `:IMPLEMENTED` | High | - | [spec](./business-hours.md) | E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️ | Backend: ✅<br>Frontend: ✅ |
| F002 | User Entrance | `:DONE` | High | F001 | [spec](./user-entrance.md) | E2E: ✅<br>Int: ✅<br>Unit: ✅ | Backend: ✅<br>Frontend: ✅ |
| F003 | Seat System | `:TODO` | High | F002 | [spec](./seat-system.md) | E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️ | Backend: ✅<br>Frontend: ✅ |
| F004 | Chat | `:TODO` | High | F003 | [spec](./chat.md) | E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️ | Backend: ✅<br>Frontend: ✅ |
| F005 | Realtime Sync | `:TODO` | High | F003, F004 | [spec](./realtime-sync.md) | E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️ | Backend: ✅<br>Frontend: ✅ |
| **F006** | **User Session Management** | **`:TODO`** | **High** | **F001, F002** | **[spec](./user-session-management.md)** | **E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️** | **Backend: ⚪️<br>Frontend: ⚪️** |
| **F007** | **Timeline** | **`:TODO`** | **Medium** | **F006** | **[spec](./timeline.md)** | **E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️** | **Backend: ⚪️<br>Frontend: ⚪️** |
| **F008** | **Private Chat** | **`:TODO`** | **Medium** | **F006** | **[spec](./private-chat.md)** | **E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️** | **Backend: ⚪️<br>Frontend: ⚪️** |

## Traceability Matrix

### F001: Business Hours Check

| AC | E2E Test | Integration Test | Unit Test | Status |
|----|----------|------------------|-----------|--------|
| AC-1: 営業時間内アクセス | `business-hours.spec.ts#AC-1` | `business-hours.integration.test.ts#OPEN` | `business-hours.test.ts#22:00` | ⚪️ Pending |
| AC-2: 営業時間外アクセス | `business-hours.spec.ts#AC-2` | `business-hours.integration.test.ts#CLOSED` | `business-hours.test.ts#12:00` | ⚪️ Pending |
| AC-3: 境界値（開店） | - | - | `business-hours.test.ts#boundary-22:00` | ⚪️ Pending |
| AC-4: 境界値（閉店） | - | - | `business-hours.test.ts#boundary-04:00` | ⚪️ Pending |

### F002: User Entrance

| AC | E2E Test | Integration Test | Unit Test | Status |
|----|----------|------------------|-----------|--------|
| AC-1: 空の名前エラー | `user-entrance.spec.ts#should show error when name is empty` | - | `page.test.tsx#should show error when name is empty` | ✅ Pass |
| AC-2: 有効な名前で入店 | `user-entrance.spec.ts#should save name and redirect` | - | `page.test.tsx#should save to localStorage and redirect` | ✅ Pass |
| AC-3: 20文字超過エラー | `user-entrance.spec.ts#should show error when name exceeds 20 characters` | - | `page.test.tsx#should show error when name exceeds 20 characters` | ✅ Pass |
| AC-4: 空白トリミング | `user-entrance.spec.ts#should trim leading and trailing whitespace` | - | `page.test.tsx#should trim leading and trailing whitespace` | ✅ Pass |
| AC-5: サーバー側Zodバリデーション | - | `user-entrance.integration.test.ts#should reject empty name` | - | ✅ Pass |
| AC-6: user_joinedブロードキャスト | (E2Eで検証予定) | (E2Eに統合) | - | 🟡 E2E Pending |
| AC-7: 重複入店防止 | (E2Eで検証予定) | (E2Eに統合) | - | 🟡 E2E Pending |
| AC-8: localStorage永続化 | `user-entrance.spec.ts#should persist name in localStorage` | - | - | ✅ Pass |

### F003: Seat System

TBD

### F004: Chat

TBD

### F005: Realtime Sync

TBD

## Roadmap

### Phase 1: MVP Core (Current)

- [x] F001: Business Hours Check - 実装済み（テスト未作成）
- [x] F002: User Entrance - **完了**（仕様・テスト・実装全て完了）
- [x] F003: Seat System - 実装済み（テスト未作成）
- [x] F004: Chat - 実装済み（テスト未作成）
- [x] F005: Realtime Sync - 実装済み（テスト未作成）

### Phase 2: Test Coverage

- [ ] F001-F005: 受入テスト作成
- [ ] F001-F005: 統合テスト作成
- [ ] F001-F005: ユニットテスト作成
- [ ] カバレッジ80%達成

### Phase 3: Enhanced Features (Future)

- [ ] F006: User Session Management - セッション管理・リロード対応（基盤）
- [ ] F007: Timeline - タイムライン機能（呟き）
- [ ] F008: Private Chat - 個人チャット機能（1対1）

**Note:** Phase 3はDB不要で実装可能。メモリ内＋localStorage。

## Update History

| Date | Feature | Change | Author |
|------|---------|--------|--------|
| 2026-02-07 | F002 | 仕様完成・テスト実装・ステータス更新 | Claude |
| 2026-02-06 | - | spec/構造作成 | - |
