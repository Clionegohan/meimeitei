# Feature: Seat System

## Meta

```yaml
feature-id: F003
feature-name: Seat System
status: TEST_WRITTEN
priority: High
dependencies: [F002]
created: 2026-02-09
updated: 2026-02-09
```

---

## Overview

カウンター席への着席/離席をWebSocket経由でリアルタイム同期するシステム。複数ユーザー間で座席状態が即座に反映され、3Dシーンでも視覚的に表現される。

### 目的

- ユーザーがカウンター席に着席/離席できる
- 座席状態が全接続ユーザーにリアルタイム同期される
- 着席中のユーザーが視覚的に識別できる（🪑アイコン、3Dアバター配置）

---

## Acceptance Criteria (AC)

### AC-1: 着席ボタンをクリックすると、座席状態が変化する

**Given**: ユーザーが入店済み
**When**: "着席"ボタンをクリック
**Then**:
- ボタンテキストが"離席"に変化
- 参加者リストに🪑アイコンが表示される

**Why**: ユーザーが自分の座席状態をコントロールできる必要がある

---

### AC-2: seat_toggleイベントがサーバーに送信される

**Given**: ユーザーが入店済み
**When**: 着席/離席ボタンをクリック
**Then**:
- `seat_toggle`イベントがWebSocket経由でサーバーに送信される
- サーバー側でZodバリデーションが実行される

**Why**: クライアント・サーバー間の通信が正しく行われる必要がある

---

### AC-3: 複数ユーザー間で座席状態が同期される

**Given**: 2人のユーザーが入店している
**When**: User1が着席ボタンをクリック
**Then**:
- User2の画面でUser1の参加者リストに🪑アイコンが表示される
- リアルタイムで反映される（即座に同期）

**Why**: 他のユーザーの座席状況を把握できる必要がある

---

### AC-4: 着席中のユーザーに🪑アイコンが表示される

**Given**: ユーザーが着席している
**When**: 参加者リストを確認
**Then**:
- ユーザー名の後ろに🪑アイコンが表示される
- 形式: "ユーザー名 🪑"

**Why**: 誰が着席しているか一目で分かる必要がある

---

### AC-5: ボタンテキストが動的に変化する

**Given**: ユーザーが入店済み
**When**:
- 離席中（seated=false）の場合
**Then**: ボタンテキストは"着席"

**When**:
- 着席中（seated=true）の場合
**Then**: ボタンテキストは"離席"

**Why**: 現在の状態と次のアクションが明確に分かる必要がある

---

### AC-6: 3Dシーンに着席中のユーザーのアバターが表示される

**Given**: 複数ユーザーが着席している
**When**: 3Dシーンを表示
**Then**:
- 着席中のユーザーのアバターが横並びで配置される
- x軸に1.5単位間隔で配置される
- 離席中のユーザーのアバターは表示されない

**Why**: 3D空間で座席の様子を視覚的に表現する必要がある

---

### AC-7: 座席状態はimmutableパターンで更新される

**Given**: 複数ユーザーが存在する
**When**: 1人のユーザーの座席状態が変更される
**Then**:
- 新しいusers配列が生成される（元の配列は変更されない）
- 変更されたユーザーのみ新しいオブジェクトが作成される
- 他のユーザーは同一参照を保持する（最適化）

**Why**: Reactの再レンダリング最適化とバグ防止のため

---

### AC-8: 未入店ユーザーは座席操作不可（isJoinedガード）

**Given**: ユーザーがWebSocket接続済みだが、まだjoinイベントを送信していない
**When**: seat_toggleイベントを送信
**Then**:
- サーバー側で無視される（isJoinedガード）
- エラーは返されない（静かに無視）

**Why**: 入店していないユーザーが座席を操作できてしまうと整合性が壊れる

---

## Data Model

### User (Backend & Frontend共通)

```typescript
interface User {
  id: string        // ユニークユーザーID（サーバー生成）
  name: string      // 表示名（1-20文字）
  seated: boolean   // 着席状態（true: 着席中, false: 離席中）
}
```

**Backend拡張**:

```typescript
interface User {
  id: string
  name: string
  seated: boolean
  ws: WebSocket     // WebSocketコネクション（Backend専用）
}
```

---

## WebSocket Events

### Client → Server

#### SeatToggleEvent

```typescript
{
  type: 'seat_toggle'
}
```

**バリデーション（Zod）**:

```typescript
const SeatToggleEventSchema = z.object({
  type: z.literal('seat_toggle'),
})
```

**処理フロー（Backend）**:

1. イベント受信
2. `isJoined`チェック → falseなら無視（AC-8）
3. `store.getUser(userId)` → 存在しなければ無視
4. `store.updateSeated(userId, !user.seated)` → 座席状態を反転
5. `broadcast({ type: 'seat_changed', userId, seated: newSeated })` → 全員に通知

---

### Server → Client

#### SeatChangedEvent

```typescript
{
  type: 'seat_changed',
  userId: string,
  seated: boolean
}
```

**バリデーション（Zod）**:

```typescript
const SeatChangedEventSchema = z.object({
  type: z.literal('seat_changed'),
  userId: z.string(),
  seated: z.boolean(),
})
```

**処理フロー（Frontend）**:

1. イベント受信
2. `useBarStore.handleServerEvent(event)` → Zustand storeで処理
3. `state.users.map()` → 該当ユーザーのseatedフラグを更新（immutable）
4. React再レンダリング → UI反映

---

## UI Requirements

### 着席/離席ボタン

```tsx
<button onClick={handleSeatToggle}>
  {currentUser?.seated ? '離席' : '着席'}
</button>
```

- **座席中**: "離席"（次のアクション）
- **離席中**: "着席"（次のアクション）

---

### 参加者リスト

```tsx
<li>
  {user.name} {user.seated ? '🪑' : ''}
  {user.id === userId ? ' (あなた)' : ''}
</li>
```

**表示例**:

```
参加者 (3)
- Alice 🪑 (あなた)
- Bob
- Charlie 🪑
```

---

### 3D Scene (BarScene.tsx)

```tsx
const seatedUsers = users.filter((u) => u.seated)

{seatedUsers.map((user, index) => (
  <mesh position={[index * 1.5, 1, 0]} key={user.id}>
    {/* アバター表示 */}
  </mesh>
))}
```

**配置ルール**:
- 着席中のユーザーのみ表示
- x軸に1.5単位間隔で横並び配置
- y軸: 1（カウンターの高さ）
- z軸: 0（カウンターの正面）

---

## Processing Flow

### 着席/離席フロー

```
[ユーザー] → "着席"ボタンクリック
    ↓
[Frontend UI] → sendEvent({ type: 'seat_toggle' })
    ↓ (WebSocket)
[Backend WS Handler] → isJoined チェック
    ↓
[Store] → getUser(userId)
    ↓
[Store] → updateSeated(userId, !user.seated)
    ↓
[Backend] → broadcast({ type: 'seat_changed', userId, seated })
    ↓ (WebSocket broadcast)
[All Clients] → handleServerEvent(seat_changed)
    ↓
[Frontend Store] → users.map() でseatedを更新（immutable）
    ↓
[React] → 再レンダリング
    ↓
[UI] → ボタンテキスト更新、🪑アイコン表示/非表示
```

---

## Edge Cases

### 1. 未入店ユーザーがseat_toggleを送信

**状況**: WebSocket接続済みだが、joinイベント未送信
**対応**: サーバー側で`isJoined`ガードにより無視
**結果**: エラーなし、静かに無視

---

### 2. 存在しないユーザーID

**状況**: `store.getUser(userId)`がundefinedを返す
**対応**: サーバー側でearly return
**結果**: エラーなし、静かに無視

---

### 3. WebSocket切断中のseat_toggle

**状況**: クライアントがオフライン
**対応**: `sendEvent()`が実行されない（WebSocket未接続）
**結果**: イベント送信スキップ、エラーなし

---

### 4. 同時に複数ユーザーが着席

**状況**: User1とUser2が同時に着席ボタンをクリック
**対応**: サーバー側で順次処理、それぞれbroadcast
**結果**: 両方のseat_changedイベントが全員に送信される

---

### 5. ページリロード後の状態復元

**状況**: ユーザーがページをリロード
**対応**:
1. WebSocket再接続
2. `state_sync`イベントで全ユーザー状態を受信
3. 座席状態も含めて復元

**結果**: リロード前の座席状態が維持される

---

## Implementation Details

### Backend (apps/backend/src/ws-handler.ts)

```typescript
case 'seat_toggle': {
  if (!isJoined) return  // AC-8: 未入店ユーザーガード

  const user = store.getUser(userId)
  if (!user) return  // Edge Case: 存在しないユーザー

  const newSeated = !user.seated  // 座席状態を反転
  store.updateSeated(userId, newSeated)

  // 全員に通知
  broadcast({
    type: 'seat_changed',
    userId,
    seated: newSeated,
  })
  break
}
```

---

### Frontend (apps/frontend/src/stores/useBarStore.ts)

```typescript
case 'seat_changed':
  set((state) => ({
    users: state.users.map((u) =>
      u.id === event.userId
        ? { ...u, seated: event.seated }  // AC-7: Immutableパターン
        : u
    ),
  }))
  break
```

**Immutability保証**:
- `state.users.map()` → 新しい配列を生成
- `{ ...u, seated: event.seated }` → 該当ユーザーのみ新しいオブジェクト
- `u` → 他のユーザーは同一参照を保持（最適化）

---

## Testing Strategy

### E2E Tests (Playwright)

**ファイル**: `e2e/tests/seat-system.spec.ts`

| Test Case | AC Coverage | Description |
|-----------|-------------|-------------|
| AC-1: 着席ボタンクリック | AC-1, AC-5 | ボタンテキスト変化、🪑アイコン表示 |
| AC-3: 複数ユーザー同期 | AC-3 | 2ユーザー間で座席状態が同期される |
| AC-4: 🪑アイコン表示 | AC-4 | 着席中のユーザーに🪑表示 |
| AC-5: 離席時の🪑消失 | AC-4, AC-5 | 離席すると🪑が消える |
| Edge: 複数回トグル | AC-1, AC-5 | 着席→離席→着席の繰り返しで状態が正しく反転 |
| Edge: リロード後復元 | AC-1, AC-4 | ページリロード後にstate_syncで座席状態が復元される |

---

### Integration Tests (Vitest)

**ファイル**: `apps/backend/tests/integration/seat-system.integration.test.ts`

| Test Case | AC Coverage | Description |
|-----------|-------------|-------------|
| SeatToggleEvent validation | AC-2 | 正しい形式を受け入れる |
| Invalid type rejection | AC-2 | 不正な型を拒否する |
| SeatChangedEvent validation | AC-2 | 正しい形式を受け入れる |
| Missing userId rejection | AC-2 | userIdなしを拒否する |

---

### Unit Tests (Vitest)

#### Backend: `apps/backend/src/__tests__/store.test.ts`

| Test Case | AC Coverage | Description |
|-----------|-------------|-------------|
| updateSeated to true | - | seated=trueに更新 |
| updateSeated to false | - | seated=falseに更新 |
| Non-existent user | Edge Case | 存在しないユーザーでエラーなし |

---

#### Frontend: `apps/frontend/src/stores/__tests__/useBarStore.test.ts`

| Test Case | AC Coverage | Description |
|-----------|-------------|-------------|
| seat_changed event handling | AC-2 | イベントでseatedが更新される |
| Immutability on seat_changed | AC-7 | 新しい配列・オブジェクト生成 |
| Other users unchanged | AC-7 | 他のユーザーは同一参照保持 |

---

## Coverage Target

- **Minimum**: 80%
- **Critical Paths**: 100%
  - seat_toggle event handler (Backend)
  - seat_changed event handler (Frontend)
  - updateSeated method (Store)

---

## Manual Testing Checklist

- [ ] 着席ボタンをクリック → "離席"に変化、🪑表示
- [ ] 離席ボタンをクリック → "着席"に変化、🪑消失
- [ ] 2つのブラウザで同時入店 → User1着席 → User2の画面で🪑表示
- [ ] 複数ユーザー着席 → 3Dシーンでアバターが横並び表示
- [ ] ページリロード → 座席状態が復元される

---

## Dependencies

- **F002: User Entrance** - 入店機能が前提（joinイベント、isJoinedフラグ）

---

## Update History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-09 | 1.0.0 | Initial specification based on existing implementation |
