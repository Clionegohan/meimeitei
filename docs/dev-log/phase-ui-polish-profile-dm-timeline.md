# Phase UI polish — プロフィール / DM(手紙) / タイムライン(軒先) の磨き込み

branch: `feat/ui-polish-profile-dm-timeline`

## 方針

Phase γ で確定した「月夜の墨」世界観の上で、実利用で引っかかる体験の粗さと、
凝りすぎて意味が伝わらない文言を一掃する。世界観の和語は残しつつ「ダサい/伝わらない/
使えない」ものを削る、という基準で UI 文言と挙動を整える。ロジック/データ層の構造変更は
最小限（domain は羊色パレット追加のみ、application は無改修）。

検証は typecheck / domain・application・infrastructure unit test / eslint に閉じる
（実 DB は Render staging、画面は手動確認）。

## 範囲と対応

### 1. プロフィール

- **羊の毛色を 12 → 18 色へ拡張**（`packages/domain/src/user/user.ts` TONES）。
  追補は夜空に映える和色 6 色（薄縹鼠 / 藤鼠 / 茶鼠 / 苔鼠 / 灰桜 / 鉄鼠）。
  `user.test.ts` を先に更新（RED→GREEN）。重複なし検査も追加。
- **在席（秘匿）の即トグル**を表示画面に新設（`profile-editor.tsx`）。
  「書き換える」モードに入らずに在席/秘匿をその場で切替・保存（`updateProfileAction`）。
  楽観更新し、失敗時はロールバック。
- 編集ボタンの文言「編集」→ **「書き換える」**。
- 在席文言を統一：オンライン=**「在席」**、オフライン=**「不在」**。
  「灯る」表現は全廃（`profile-editor` / `other-profile` / `right-rail` 全て）。
  秘匿か不在かの区別は表示しない（区別自体を隠す）。
- 「今宵のしるし」は従来どおり**設定済みのみ表示**（仕様確認、変更なし）。

### 2. しるし（SignTag）ラベルの整合

- domain の `SIGN_TAGS` は 7 タグに整理済（`having_tea`=一服(茶・珈琲・休憩) /
  `nightcap`=晩酌 / `shiritori`・`wanting_to_hear` は廃止）。
- これに UI を追従：`other-profile.tsx` と `right-rail.tsx` の対応表を 7 タグへ修正。
  これにより従来壊れていた型（`shiritori`/`wanting_to_hear` 残存・`nightcap` 欠落）を解消。
  「しりとり」「声を聞きたい」（通話機能なし）を撤去。「お茶を一杯」→「一服」。

### 3. タイムライン（軒先）

- 投稿作成 CTA「筆を取る」→ **「文を置く」**（`composer.tsx` / `sidebar.tsx`）。
- いいね「燭を寄せる/た」→ **「灯をそえる/た」**（`post-card.tsx`）。
- **返信モーダル**（`post-card.tsx` 内部 component `ReplyModal`）。
  「応える」押下でモーダルを開き、返信本文を書いて送ると、その本文を最初の手紙として
  1:1 会話を作成し当該スレッドへ遷移する。
  - `replyToPostAction` に `body?` を追加。会話作成後に `sendMessage` で初回手紙を送り、
    `broadcastToConversation` でリアルタイム配信（`timeline/actions.ts`）。
  - モーダルは Next 16 の "use client" entry のシリアライズ制約（function props 警告）を
    避けるため、`EditForm` と同じく**同一ファイル内の非エクスポート component** として実装。
- 投稿本文の URL を自動リンク化（後述 `Linkify`）。

### 4. DM（手紙）

- 文言：sub-banner「夜を跨いでも、文字は残ります」→ **「…手紙は残ります」**。
  入力欄 placeholder「そっと、文字を置く…」→ **「返事を書く」**。
  注記「夜を跨いで、ふたりだけの記憶になります」を撤去し、
  **「⌘ / Ctrl + Enter で送る」**ヒントに置換。
- **⌘/Ctrl + Enter 送信**（`thread-view.tsx`）。Enter は従来どおり改行。
- **送信/受信時の自動スクロール**：末尾アンカー `bottomRef` を置き、
  メッセージ数・入力中表示の変化で `scrollIntoView({ block: 'end' })`。
- ヘッダー右の**装飾アイコン 3 個（時計/虫眼鏡/三点）を削除**（onClick 未実装の飾りだった）。
- メッセージ本文の URL を自動リンク化。

### 5. リンク自動リンク化（`_components/linkify.tsx`）

- `tokenizeLinks(text)`：http/https のみ抽出（`javascript:` 等は平文のまま＝XSS 回避）。
  末尾の句読点・閉じ括弧はリンクから除外して平文へ戻す。純粋関数として切り出し検証。
- `<Linkify text>`：非 URL 部分は React の自動エスケープで平文描画。
  リンクは `target="_blank"` + `rel="noopener noreferrer nofollow ugc"`
  （新規タブ乗っ取り防止 + UGC リンクの被リンク評価/spam 連鎖防止＝SEO 配慮）。
- タイムライン投稿本文 / DM メッセージ本文に適用。
- web には unit test runner がないため、`tokenizeLinks` は即席 node 検証で妥当性確認
  （ただの文 / 文中 URL / 括弧付き / 複数 / `javascript:` 無視）。

### 6. ナビゲーション

- TopBar の section ローマ字（NOKISAKI / TEGAMI / ONORE / HITSUJI / SHINASHO）を撤去
  （`top-bar-section.tsx`）。和の section 名のみ表示。

### 7. 在席マーク（アバター）

- `_components/presence-dot.tsx` を新設。アバター右下に重ねる。
  在席=灯色 + glow、不在/秘匿=暗点（区別なし）。
- 手紙一覧（`chats/page.tsx`）と客帳（`sheep/page.tsx`）の各アバターに付与。
  在席判定は `listOnlineUsers`（online かつ秘匿でない＝秘匿者は元々含まれない）を真とする。

### 8. 右サイドバー幅の体感差

- 軒先（`md:p-10`）と己（`md:px-14 md:py-10`）で本文余白が異なり、右 rail の見え方が
  ずれていた。己の本文を `md:p-10` に揃えた（両 rail は元々 340px 固定で一致）。

## 検証

- `pnpm -r typecheck` 全 6 project Done。
- `pnpm -r test`：domain 14 / application 133 / infrastructure 42、全 pass。
- `pnpm lint` エラーなし。
- 画面挙動（モーダル送信→遷移、自動スクロール、リンク遷移、在席マーク）は手動/Playwright で要確認。
