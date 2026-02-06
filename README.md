# めぃめぃ亭 (Meimei-Tei)

深夜限定（22:00-04:00 JST）のWebチャットアプリ。バーチャルバーのメタファー。

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Three.js (R3F), Tailwind CSS v4, Zustand
- **Backend**: Hono (HTTP), ws (WebSocket), Node.js
- **Shared**: Zod (Event validation)
- **Workspace**: pnpm workspaces

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
pnpm install
```

### Development

バックエンドとフロントエンドを別々のターミナルで起動:

```bash
# Terminal 1: Backend
cd apps/backend
pnpm dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev
```

または、ルートから並列起動:

```bash
pnpm dev
```

### Verification

1. http://localhost:3000 にアクセス
2. 営業時間外 → CLOSED 表示
3. 営業時間内 → `/enter` へリダイレクト → 名前入力 → `/bar` へ
4. 別ブラウザタブで同様に入店 → 互いに参加者が表示される
5. チャット送信 → 両方のタブで表示される
6. タブを閉じる → もう一方で参加者が消える

## Project Structure

```
meimei-tei/
├── apps/
│   ├── frontend/          # Next.js app
│   └── backend/           # HTTP + WebSocket server
├── packages/
│   └── shared/            # Shared types and schemas
└── CLAUDE.md              # Specification
```

## Environment Variables

### Frontend (`apps/frontend/.env.local`)

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### Backend (`apps/backend/.env`)

```
PORT=3001
```
