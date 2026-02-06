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

### ディレクトリ構成

```
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

## 4. features

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

## 5. getting-started

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

## 6. testing

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

## 7. links

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
