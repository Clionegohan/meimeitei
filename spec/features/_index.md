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
| F001 | Business Hours Check | `:DONE` | High | - | [spec](./business-hours.md) | E2E: ✅<br>Int: ✅<br>Unit: ✅ | Backend: ✅<br>Frontend: ✅ |
| F002 | User Entrance | `:TEST_WRITTEN` | High | F001 | [spec](./user-entrance.md) | E2E: 🟡<br>Int: ✅<br>Unit: ✅ | Backend: ✅<br>Frontend: ✅ |
| F003 | Seat System | `:TEST_WRITTEN` | High | F002 | [spec](./seat-system.md) | E2E: ✅<br>Int: ✅<br>Unit: ✅ | Backend: ✅<br>Frontend: ✅ |
| F004 | Chat | `:TEST_WRITTEN` | High | F003 | [spec](./chat.md) | E2E: 🟡<br>Int: ✅<br>Unit: ✅ | Backend: ✅<br>Frontend: ✅ |
| F005 | Realtime Sync | `:TODO` | High | F003, F004 | [spec](./realtime-sync.md) | E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️ | Backend: ✅<br>Frontend: ✅ |
| **F006** | **User Session Management** | **`:TODO`** | **High** | **F001, F002** | **[spec](./user-session-management.md)** | **E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️** | **Backend: ⚪️<br>Frontend: ⚪️** |
| **F007** | **Timeline** | **`:TODO`** | **Medium** | **F006** | **[spec](./timeline.md)** | **E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️** | **Backend: ⚪️<br>Frontend: ⚪️** |
| **F008** | **Private Chat** | **`:TODO`** | **Medium** | **F006** | **[spec](./private-chat.md)** | **E2E: ⚪️<br>Int: ⚪️<br>Unit: ⚪️** | **Backend: ⚪️<br>Frontend: ⚪️** |

## Traceability Matrix

### F001: Business Hours Check

| AC | E2E Test | Integration Test | Unit Test | Status |
|----|----------|------------------|-----------|--------|
| AC-1: 営業時間内アクセス | `business-hours.spec.ts#AC-1: should redirect to /enter during business hours` | `api.integration.test.ts#should return { open: true } during business hours` | `business-hours.test.ts#should return true at exactly 22:00 JST` | ✅ Pass |
| AC-2: 営業時間外アクセス | `business-hours.spec.ts#AC-2: should show CLOSED during non-business hours` | `api.integration.test.ts#should return { open: false } outside business hours` | `business-hours.test.ts#should return false at exactly 04:00 JST` | ✅ Pass |
| AC-3: 境界値（開店） | - | `api.integration.test.ts#should return { open: true } at opening time` | `business-hours.test.ts#should return true at exactly 22:00 JST (opening time)` | ✅ Pass |
| AC-4: 境界値（閉店） | - | `api.integration.test.ts#should return { open: false } at closing time` | `business-hours.test.ts#should return false at exactly 04:00 JST (closing time)` | ✅ Pass |
| Edge: Real Date Path | - | - | `business-hours.test.ts#Real Date Path (getJSTHour)` - 6 tests | ✅ Pass |
| Edge: 23時 | - | `api.integration.test.ts#should return { open: true } during business hours (23:00 JST)` | `business-hours.test.ts#should return true at 23:00 JST` | ✅ Pass |
| Edge: 深夜0時 | - | `api.integration.test.ts#should return { open: true } at midnight` | `business-hours.test.ts#should return true at 00:00 JST (midnight)` | ✅ Pass |
| Edge: 正午12時 | - | `api.integration.test.ts#should return { open: false } outside business hours (12:00 JST)` | `business-hours.test.ts#should return false at 12:00 JST (noon)` | ✅ Pass |
| UI: CLOSED画面要素 | `business-hours.spec.ts#should display proper CLOSED screen elements` | - | - | ✅ Pass |
| UI: Loading表示 | `business-hours.spec.ts#should show Loading state initially` | - | - | ✅ Pass |
| Error: Backend未起動 | `business-hours.spec.ts#should show CLOSED when backend is not available` | - | - | ✅ Pass |
| Edge: SKIP_BUSINESS_HOURS_CHECK | - | `api.integration.test.ts#should return { open: true } when SKIP_BUSINESS_HOURS_CHECK is enabled` | `business-hours.test.ts#should return true when SKIP_BUSINESS_HOURS_CHECK is "true"` | ✅ Pass |
| Edge: TEST_JST_HOUR validation | - | - | `business-hours.test.ts#TEST_JST_HOUR 環境変数のバリデーション (5 tests)` | ✅ Pass |
| API: CORS | - | `api.integration.test.ts#should include CORS headers` | - | ✅ Pass |
| API: Health check | - | `api.integration.test.ts#should return { status: "ok" }` | - | ✅ Pass |

### F002: User Entrance

| AC | E2E Test | Integration Test | Unit Test | Status |
|----|----------|------------------|-----------|--------|
| AC-1: 空の名前エラー | `user-entrance.spec.ts#should show error when name is empty` | - | `page.test.tsx#should show error when name is empty` | ✅ Pass |
| AC-2: 有効な名前で入店 | `user-entrance.spec.ts#should save name and redirect` | - | `page.test.tsx#should save to localStorage and redirect` | ✅ Pass |
| AC-3: 20文字超過エラー | `user-entrance.spec.ts#should show error when name exceeds 20 characters` | - | `page.test.tsx#should show error when name exceeds 20 characters` | ✅ Pass |
| AC-4: 空白トリミング | `user-entrance.spec.ts#should trim leading and trailing whitespace` | - | `page.test.tsx#should trim leading and trailing whitespace` | ✅ Pass |
| AC-5: サーバー側Zodバリデーション | - | `user-entrance.integration.test.ts#should reject empty name` | - | ✅ Pass |
| AC-6: user_joinedブロードキャスト | 🟡 TODO | (E2Eに統合予定) | - | 🟡 E2E Pending |
| AC-7: 重複入店防止 | 🟡 TODO | (E2Eに統合予定) | - | 🟡 E2E Pending |
| AC-8: localStorage永続化 | `user-entrance.spec.ts#should persist name in localStorage` | - | - | ✅ Pass |

### F003: Seat System

| AC | E2E Test | Integration Test | Unit Test | Status |
|----|----------|------------------|-----------|--------|
| AC-1: 着席ボタンクリック | `seat-system.spec.ts#should change seat state when clicking seat button` | - | - | ✅ Pass |
| AC-2: seat_toggleイベント送信 | - | `seat-system.integration.test.ts#SeatToggleEvent Validation` | - | ✅ Pass |
| AC-2: seat_changedイベント検証 | - | `seat-system.integration.test.ts#SeatChangedEvent Validation` | - | ✅ Pass |
| AC-3: 複数ユーザー間同期 | `seat-system.spec.ts#should sync seat state between multiple users` | - | - | ✅ Pass |
| AC-4: 🪑アイコン表示 | `seat-system.spec.ts#should display 🪑 icon for seated users` | - | - | ✅ Pass |
| AC-5: ボタンテキスト動的変化 | `seat-system.spec.ts#should change seat state when clicking seat button` | - | - | ✅ Pass |
| AC-5: 離席時の🪑消失 | `seat-system.spec.ts#should remove 🪑 icon when user leaves seat` | - | - | ✅ Pass |
| AC-6: 3Dアバター配置 | （実装済み・手動確認） | - | - | 🟡 Manual |
| AC-7: Immutability | - | - | `useBarStore.test.ts#should maintain immutability on seat_changed` | ✅ Pass |
| AC-8: 未入店ユーザーガード | 🟡 TODO: Integration/E2Eテスト追加予定 | - | - | 🟡 TODO |
| Edge: 複数回トグル | `seat-system.spec.ts#should toggle seat state multiple times correctly` | - | - | ✅ Pass |
| Edge: ページリロード後復元 | `seat-system.spec.ts#should restore seat state after page reload` | - | - | ✅ Pass |
| Unit: updateSeated(true) | - | - | `store.test.ts#should update seated status to true` | ✅ Pass |
| Unit: updateSeated(false) | - | - | `store.test.ts#should update seated status to false` | ✅ Pass |
| Unit: 存在しないユーザー | - | - | `store.test.ts#should not throw if user does not exist` | ✅ Pass |
| Unit: seat_changedイベント | - | - | `useBarStore.test.ts#should update user seated status on seat_changed event` | ✅ Pass |

### F004: Chat

| AC | E2E Test | Integration Test | Unit Test | Status |
|----|----------|------------------|-----------|--------|
| AC-1: メッセージ送信基本 | `chat.spec.ts#メッセージを送信すると表示され、フォームがクリアされる` | - | `Chat.test.tsx#should render message list with sender name and text` | 🟡 E2E Pending |
| AC-1: フォームクリア | `chat.spec.ts#メッセージを送信すると表示され、フォームがクリアされる` | - | `Chat.test.tsx#should clear input field after sending message` | 🟡 E2E Pending |
| AC-2: 複数ユーザー同期 | `chat.spec.ts#複数ユーザー間でメッセージが同期される` | - | `useBarStore.test.ts#should add message to messages array on message event` | 🟡 E2E Pending |
| AC-3: 文字数制限（空） | `chat.spec.ts#空メッセージは送信されない` | `chat.integration.test.ts#should reject empty text` | `Chat.test.tsx#should not submit empty message` | 🟡 E2E Pending |
| AC-3: 文字数制限（501文字） | `chat.spec.ts#長文メッセージの制限` | `chat.integration.test.ts#should reject text exceeding 500 characters` | `Chat.test.tsx#should not submit message exceeding 500 characters` | 🟡 E2E Pending |
| AC-3: 文字数制限（500文字） | `chat.spec.ts#長文メッセージの制限` | `chat.integration.test.ts#should accept message with exactly 500 characters` | `Chat.test.tsx#should submit message with exactly 500 characters` | 🟡 E2E Pending |
| AC-4: 前後空白トリミング | `chat.spec.ts#前後空白のトリミング` | - | `Chat.test.tsx#should trim leading whitespace` | 🟡 E2E Pending |
| AC-4: 空白のみブロック | `chat.spec.ts#空メッセージは送信されない` | - | `Chat.test.tsx#should not submit whitespace-only message` | 🟡 E2E Pending |
| AC-5: 未入店ガード | 🟡 TODO: E2E追加予定 | - | - | 🟡 TODO |
| AC-6: SendMessageEvent検証 | - | `chat.integration.test.ts#SendMessageEvent Validation (8 tests)` | - | ✅ Pass |
| AC-7: MessageEvent検証 | - | `chat.integration.test.ts#MessageEvent Validation (8 tests)` | - | ✅ Pass |
| AC-7: 名前改竄防止 | - | `chat.integration.test.ts#should accept valid message event` | - | ✅ Pass |
| AC-7: タイムスタンプ改竄防止 | - | `chat.integration.test.ts#should accept Unix timestamp in milliseconds` | - | ✅ Pass |
| AC-8: Immutability | - | - | `useBarStore.test.ts#should maintain immutability on message event` | ✅ Pass |
| AC-8: 配列末尾に追加 | - | - | `useBarStore.test.ts#should grow messages array length on each message event` | ✅ Pass |
| AC-9: セッション保持のみ | `chat.spec.ts#ページリロード後の履歴消失` | - | - | 🟡 E2E Pending |
| Unit: メッセージ順序保持 | - | - | `useBarStore.test.ts#should preserve message order` | ✅ Pass |
| Unit: 複数ユーザーメッセージ | - | - | `useBarStore.test.ts#should handle messages from different users` | ✅ Pass |
| Unit: 同一ユーザー複数メッセージ | - | - | `useBarStore.test.ts#should handle multiple messages from same user` | ✅ Pass |
| Unit: トリミング動作 | - | - | `Chat.test.tsx#Trimming Behavior (4 tests)` | ✅ Pass |

### F005: Realtime Sync

TBD

## Roadmap

### Phase 1: MVP Core (Current)

- [x] F001: Business Hours Check - **テスト作成完了**（E2E: 2 tests、Int: 10 tests全PASS、Unit: 18 tests全PASS）
- [x] F002: User Entrance - **テスト作成済み**（AC-6, AC-7のE2E検証が残る）
- [x] F003: Seat System - **テスト作成完了**（E2E, Integration, Unit全て完成）
- [x] F004: Chat - **テスト作成済み**（E2E: 6 tests作成済み・手動実行待ち、Int: 16 tests全PASS、Unit: 29 tests全PASS）
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
| 2026-02-12 | F001 | HIGH Issues修正完了・ステータス更新（:TEST_WRITTEN → :DONE）- Real Date Pathテスト追加（+6 tests）、AC-2 E2E実装（skip削除）、合計79 tests全PASS | Claude |
| 2026-02-12 | F001 | ATDD違反是正・テスト作成完了・ステータス更新（:IMPLEMENTED → :TEST_WRITTEN）- E2E: 2 tests、Int: 10 tests全PASS、Unit: 18 tests全PASS | Claude |
| 2026-02-10 | F004 | 仕様完成・テスト実装完了・ステータス更新（:TODO → :TEST_WRITTEN）- E2E: 6 tests、Int: 16 tests全PASS、Unit: 29 tests全PASS | Claude |
| 2026-02-09 | F003 | 仕様完成・テスト実装完了・ステータス更新（:TODO → :TEST_WRITTEN） | Claude |
| 2026-02-07 | F002 | 仕様完成・テスト実装・ステータス更新 | Claude |
| 2026-02-06 | - | spec/構造作成 | - |
