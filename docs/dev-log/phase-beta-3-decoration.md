# Phase β-3 — SheepBrush / Moon SVG 装飾

## 方針

MVPα では羊アバターを「色付き丸 + 漢字グリフ」、月のモチーフは未実装の placeholder にしていた。β-3 で design HTML（`docs/design/extracted-shared.jsx`）の `SheepBrush` / `Moon2` を React Component に移植し、墨絵調の世界観を実装する。

## 範囲

- 月相計算の純粋関数 `getMoonPhase(date) → [0, 1)` を `packages/application/src/utils/moon-phase.ts` に新設
- `apps/web/src/app/(app)/profile/_components/sheep-avatar.tsx` を SheepBrush 風 SVG に差し替え（既存 import 経路は維持、profile 各箇所が自動で新アバターに切替）
- `apps/web/src/app/(app)/_components/moon-svg.tsx` を新設（design HTML の `Moon2` を踏襲、`phase: 0..1` で満ち欠け表現）
- `apps/web/src/app/(app)/timeline/page.tsx` のヘッダ右上に Moon を配置（`getMoonPhase(new Date())` で当日の月相）

## 設計判断

- **月相計算は domain ではなく `utils/`**: business state（user / conversation / message 等）に紐付かない純粋数学。`application` 配下に置きつつ「presentation utility」として扱う。`apps/web` から直接 import するパスを開ける
- **synodic 月（29.5305882 日）+ 既知 epoch（2000-01-06 18:14 UTC）**: 装飾用途として年〜十年スケールで数時間の誤差は許容。厳密な天体計算は不要
- **アバターの SVG inline 化**: tone カラーは tailwind class でなく `fill` 属性で直接適用するため、CSS 経由ではなく React 内 SVG として描く。SSR/CSR どちらでも 1 round trip で完結
- **`filter id` を tone+size でユニーク化**: 複数アバターが同一ページに並んだ際の `<filter>` ID 衝突を避ける
- **Moon の glow / phase**: `phase < 0.95` で影 disc を offset 描画。`phase = 1` の new moon は影が完全に重なるため省略
- **タイムライン側の Moon 配置**: spec の「右 rail に月相」（L141）は MVPβ 仕上げに含まれる装飾。本 phase ではヘッダ右上に置き、灯ともる羊リストとの両立は β-3-b 以降で扱う

## TDD cycle 記録

### 1. RED

- `packages/application/src/utils/moon-phase.test.ts` を先行 Write（5 件）
  - [0, 1) 範囲を保証
  - 既知 epoch で ≈ 0
  - epoch + 半 synodic で ≈ 0.5
  - epoch + N 周期で境界近傍
  - epoch 以前の日付も範囲内
- `pnpm -F @me-me-en/application test`: fail（impl 未作成）

### 2. GREEN

- `moon-phase.ts` 実装、`packages/application/src/index.ts` に export 追加
- React component は純粋表示なので unit test なし。typecheck と Next build で smoke
- `pnpm -F @me-me-en/application test`: **125 / 125 passed**（既存 120 + 新 5）
- `pnpm -F web typecheck`: 緑
- `pnpm -F web build`: 緑

### 3. REFACTOR

- 不要。SVG 移植はそのまま。`MoonSvg` / `SheepAvatar` props は将来「ホバー時にきらめき強化」等の効果を追加できる shape

## 残課題

- β-3-c: 月相を profile / closed / onboarding にも展開する判断
- β-4: Block-aware realtime broadcast
- β-5: Prisma adapter

## β-3-b 範囲（灯ともる羊リスト）

spec L44「タイムライン right rail の『灯ともる羊』リスト → profile → DM」を実装する。`listOnlineUsers` use case は既存（asymmetric stealth + block 除外まで層内で完了）。本 phase は presentation 側で resolve + ナビゲーション動線を貼るのみ。

### 追加 / 変更

- `apps/web/src/app/(app)/timeline/_components/online-sheep-list.tsx`（新規）
  - Server Component。`listOnlineUsers({ viewerId })` を呼んで Presence 一覧を取り、`userRepository.findById` で nickname / tone を補完
  - 各羊 → `Link` で `/profile/[userId]`（自分自身は `/profile`）へ
  - 0 件時は「まだ 誰も 灯っていない。」の placeholder
- `apps/web/src/app/(app)/timeline/page.tsx`
  - 単一カラム（`max-w-3xl`）→ 2 カラム（main + right aside）にレイアウト分割
  - `OnlineSheepList` を aside として配置

### 設計判断

- **`OnlineSheepList` は Server Component**: 初回描画で online 一覧が SSR で揃う。realtime 更新は本 phase では入れない（presence:update を timeline で listen して revalidate する案は β-4 候補）
- **「自分自身を含める」**: spec で明示はないが、自身の online は `listOnlineUsers` の出力に常に含まれる（viewer 自身は visibility/block を bypass）。「自分は今ここに居る」という体感を残す
- **online 印のドット**: 既存 `top-bar` / `sidebar` には Online インジケータがない。`SheepAvatar` の右下に accent カラー（#B89B6E）の小さい円を絶対配置で重ねる
- **layout の flex化**: timeline 既存の `max-w-3xl` を main 側に残し、`flex gap-10` で aside を右に並べる。中央寄せの見た目はやや崩れるが、aside 込みの幅で再センタリングするのは β-3-c で扱う

### TDD cycle 記録（β-3-b）

#### 1. RED

- 本 phase は presentation のみ（純粋関数なし）。unit test は追加しない
- 既存の `listOnlineUsers` の application test（既存 101 件の中）でロジックは保証済み

#### 2. GREEN

- Server Component を新設、timeline page から resolve
- `pnpm -F web typecheck`: 緑
- `pnpm -F web build`: 緑（`/timeline` ルートが新 layout で生成）

#### 3. REFACTOR

- 不要。Server Component に閉じる
- 残課題: realtime 更新（presence:update broadcast → client revalidate）を β-4 で検討
