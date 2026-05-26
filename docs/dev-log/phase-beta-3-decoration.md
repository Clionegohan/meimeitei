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

- β-3-b: 灯ともる羊リスト（タイムライン right rail、`listOnlineUsers` を resolve）
- β-3-c: 月相を profile / closed / onboarding にも展開する判断
- β-4: Block-aware realtime broadcast
- β-5: Prisma adapter
