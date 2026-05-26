# Phase 6 — Deploy + E2E polish

## 方針

spec Phase 計画の最終フェーズ。MVPα のコード一式は揃ったので、デプロイ準備と E2E smoke を整える。

実デプロイ操作（Render へ push して環境変数を入れて起動）は私の権限外なのでドキュメントで案内。E2E は Playwright のセットアップ + smoke ケースまで（OAuth を伴うフローは headless では駆動できないので、ローカル手動確認に委ねる）。

## 範囲

- `render.yaml`: Auth.js v5 用の env vars 追加（`AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_URL`）。`sync: false` で Render dashboard 側に値を保管
- `apps/web/package.json`: `@playwright/test` 追加、`e2e` script
- `apps/web/playwright.config.ts`: `webServer` で `pnpm dev` をブート、`AUTH_SECRET` を捨て値で渡す
- `apps/web/tests/e2e/smoke.spec.ts`:
  - `/api/health` の 200 + `{ status: 'ok' }` を確認
  - 未認証 root が `/login` か `/closed`（時間帯次第）にリダイレクトされる
  - `/login` または `/closed` のコピーがレンダリングされる
- `README.md`: 開発・デプロイ手順を最新化（Phase 5 完了の事実、env 設定、データ永続化の注記）

## 設計判断

- **OAuth フローは E2E スコープ外**: Google OAuth は本物の認可サーバを経由するため headless 駆動は実質不可。代替として stub auth を仕込む案もあるが、MVPα では「動くものを Render で 1 回確認」を優先。Auth 経由の DM 動作は 2 タブの手動確認に任せる
- **`AUTH_SECRET` の throwaway**: Playwright `webServer.env` で playwright 専用の secret を渡す。本物の secret を CI/ローカルで使わない
- **render.yaml は `sync: false`**: 認証 secret を yaml に書かない。Render dashboard 側で手動入力
- **デプロイ操作は手動**: 一度の `render.yaml` push で Render が拾い、Web Service として起動する。実 URL は `AUTH_URL` env で確定する必要

## 検証

- `pnpm install`: 緑（`@playwright/test` 追加）
- `pnpm -F @me-me-en/web typecheck`: 緑
- `pnpm -F @me-me-en/web e2e` は **要 `pnpm exec playwright install`**（browser binaries の DL）。MVPα 完了確認時にローカルで一度実行する

## デプロイ後の確認チェックリスト

ローカル/Render それぞれで以下を見る:

- [ ] `/api/health` が `{"status":"ok"}` を返す
- [ ] 営業時間外（5:00–22:00 JST）に root を叩くと `/closed` で「閉店」と開店までのカウントダウンが見える
- [ ] 営業時間内に root を叩くと `/login` にリダイレクトされる
- [ ] Google OAuth → `/onboarding` 画面で nickname 入力 → `/timeline` へ遷移
- [ ] 2 タブで `/chats/[id]` を開き、片方からメッセージ送信すると相手側に即時表示される
- [ ] 投稿時、別タブの `/timeline` に realtime で新着が現れる
- [ ] `/profile` で nickname / bio / tone / しるし を編集し再表示で反映

MVPβ で扱う未実装の指標（入店した夜・連続来店・在席チャート・親しい羊）はチェック対象外。
