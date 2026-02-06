# めぃめぃ亭 (Meimei-Tei)

## meta

```yaml
project: meimei-tei
type: web-app
status: mvp-design
created: 2026-02-05
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

## 2. mvp-features

### 2.1 business-hours

```yaml
open: "22:00 JST"
close: "04:00 JST (next day)"
check: server-side
timezone: Asia/Tokyo
```

状態判定:

```
if (hour >= 22 || hour < 4):
  return OPEN
else:
  return CLOSED
```

### 2.2 user-flow

```
CLOSED --> [営業時間内] --> 入店画面 --> [名前入力] --> 店内画面
```

入店時の入力:
- 表示名: 必須, 1-20文字, トリム処理
- 認証: なし（ゲストモード）

### 2.3 seat-system

```yaml
type: counter-only  # MVPはカウンターのみ
limit: none         # 席数無制限
interaction: click  # クリックで着席/離席
display:
  - user-name
  - default-avatar
```

### 2.4 chat

```yaml
scope: counter-wide  # 全員に見える
format: text-only
max-length: 500
history: session-only  # 永続化なし
```

### 2.5 realtime-sync

同期イベント:

| event | trigger | action |
|-------|---------|--------|
| user_join | 入店 | 参加者リスト更新 |
| user_leave | 退店/切断 | 参加者リスト更新 |
| seat_change | 着席/離席 | 席状態更新 |
| message | 送信 | チャット追加 |

---

## 3. tech-stack

```yaml
status: confirmed  # MVP技術スタック確定
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

Three.jsを中核とし、バーの「場」としての空間体験を視覚的に高品質にする。
アバターの座り位置・カウンターの雰囲気・入退店の演出などが対象。

### backend / realtime

| 技術 | 用途 |
|------|------|
| Node.js | ランタイム |
| Hono | HTTP API (営業時間チェック) |
| ws | WebSocket リアルタイム同期 |
| http.createServer | 単一サーバー (HTTP + WS 共存) |
| Zod | イベントバリデーション (shared) |

要件: server-sideで営業時間チェック・WebSocketによる座席・チャットの双方向同期。
HTTP と WebSocket を同一ポートで提供し、CORS の懸念を排除。

### workspace

| 技術 | 用途 |
|------|------|
| pnpm workspaces | モノレポ管理 |
| TypeScript | 型安全性 |

Turborepo は不使用。シンプルな pnpm workspaces のみで構成。

### infra

```yaml
TBD  # MVP段階ではローカル開発のみ
```

---

## 4. development-flow: ATDD-SDD

### 原則

| 原則 | 説明 |
|------|------|
| SDD (Specification-Driven Development) | このCLAUDE.mdが唯一の仕様ソース。実装の根拠はすべてここに戻る |
| ATDD (Acceptance Test-Driven Development) | 実装の前に、仕様から直訳した受入テストを書く |

### フロー

```
Spec (CLAUDE.md)
  ↓ 仕様を読み取る
Accept Test 作成  ← RED（テスト失敗を確認）
  ↓
実装              ← GREEN（テスト通過を確認）
  ↓
リファクタ        ← 品質・強制 IMPROVE
  ↓
Spec 更新         ← 仕様と実装のドリフトを防止
```

### ルールセット

1. **仕様変更は CLAUDE.md が先** — コード変更の根拠がない場合は実装しない
2. **テストは仕様の直訳** — テストの意図は仕様の記述に1:1対応する
3. **実装は最小限 (YAGNI)** — 仕様に記載されていない機能は追加しない
4. **各フィーチャーは独立検証可能** — 単一フィーチャーのテスト・実装で全パスが確認できる
5. **受入テスト = 仕様の生き証拠** — テストが仕様を正確に反映していない場合はテストを修正する
