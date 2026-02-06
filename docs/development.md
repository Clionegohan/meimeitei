# Development Guide

開発環境のセットアップと開発ワークフロー。

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Installation

```bash
pnpm install
```

## Environment Setup

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

## Development

### Start All Services

```bash
pnpm dev
```

### Start Individual Services

```bash
# Backend only
pnpm --filter @meimei-tei/backend dev

# Frontend only
pnpm --filter @meimei-tei/frontend dev
```

## Testing

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## Build

```bash
# All packages
pnpm build

# Backend only
pnpm --filter @meimei-tei/backend build

# Frontend only
pnpm --filter @meimei-tei/frontend build
```

## Type Checking

```bash
# All packages
pnpm typecheck

# Backend only
pnpm --filter @meimei-tei/backend typecheck

# Frontend only
pnpm --filter @meimei-tei/frontend typecheck
```

## Project Structure

```
meimei-tei/
├── apps/
│   ├── backend/          # Hono + WebSocket server
│   └── frontend/         # Next.js 15 app
├── packages/
│   └── shared/           # Shared types and schemas
├── spec/                 # Feature specifications
│   ├── templates/
│   └── features/
├── docs/                 # Development guides
└── e2e/                  # End-to-end tests (Playwright)
```

## Workflow

1. **Feature Request** → 仕様化が必要か確認
2. **Specification** → `spec/features/` に仕様作成（AC-First）
3. **Test Development** → E2E → Integration → Unit の順でテスト作成
4. **RED Phase** → テスト実行・失敗確認
5. **Implementation** → 最小限の実装
6. **GREEN Phase** → テスト通過確認
7. **Refactor** → コード品質向上
8. **Coverage Check** → 80%+達成確認
9. **Spec Sync** → 仕様と実装の整合性確認

詳細は `spec/README.md` を参照。
