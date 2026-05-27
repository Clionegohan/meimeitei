# Phase γ — UI overhaul「月夜の墨」+ DM 統合 + SP モバイル対応

## 方針

MVPβ までで全機能が `DATA_STORE=prisma` で動作する状態になった（β-5-d 完了宣言）。Phase γ は **世界観の確定** を主眼に置く:

- design HTML「月夜の墨」（`docs/design/extracted-*.jsx`）を全画面に反映し、墨絵調の夜の隠れ家としての見た目を完成させる
- DM の概念を「1 相手 = 1 スレッド」に統合し、spec R1（投稿ごと新規 conversation）を廃止する
- SP（モバイル）でも崩れずに使えるレイアウトを、desktop を一切汚さずに足す
- OAuth を持たないローカル QA のための dev tooling を整備する

実 DB に対する検証は引き続き Render staging 手動 deploy で行う。本 phase の自動検証は typecheck / application unit test / Playwright スクリーンショット（local）に閉じる。

## 範囲

### 1. UI overhaul（月夜の墨）

- **フォント**: `next/font/google` で Shippori Mincho（明朝）を全文に適用。当初はゴシックと併用したが、最終的に全文明朝へ統一（`font-gothic` 指定を全削除）。本文は 17px を基準に拡大
- **月相 SVG**（`_components/moon-svg.tsx`）: design HTML の月の式が phase=0.5 で新月化する逆転式だったため、terminator（明暗境界）を楕円弧 path で描く方式に書き換え。`lit = 1 - |phase - 0.5| * 2`、terminator rx = `|1 - 2*lit| * R`。月面テクスチャ（うさぎ/クレーター）は最終的に削除し「クリーン月」に
- **漢数字**（`_components/kanji.ts`）: 表示数値を全て漢数字へ。`toKanji` で 20→廿、30→卅 の略字に対応。日付・統計・各種カウントに適用
- **時刻の日本伝統表記**: 江戸の不定時法（十二時辰 / 数の刻）を調査の上、正確な分（例 02:47）を維持しつつ時辰を補助表記として併記する方式を採用。`currentHourBranch`（子の刻〜亥の刻）を実装
- **RightRail**（timeline）: 今宵の月 / 灯ともる羊 / お席のご案内 を集約。`sticky top-16 h-[calc(100vh-64px)] overflow-y-auto` で固定、中身が多い時は内部スクロール
- **VisitRecordRail**（profile）: 来店帳 4 stats / 在席の刻 chart / 退店する を集約、同じく sticky 固定
- **layout sticky 化**: `flex items-start` で sidebar / rail を main の高さに引き伸ばさず、各々を sticky 固定。main だけがスクロール
- **TopBar 整理**: 右上 avatar を `/profile` への導線に。通知 bell は機能未実装のため UI から削除
- 旧 `timeline/_components/online-sheep-list.tsx` は RightRail に統合のため削除

### 2. User.favoriteMoon（好きな月）

- `FavoriteMoon` 型（月相名 16 種の union）を `packages/domain/src/user/user.ts` に追加。`createUser` で validation
- `update-profile` use case の patch に `favoriteMoon`（null=未設定 / undefined=変更なし）
- profile card の装飾月に反映（未設定時は居待月 fallback）。編集フォームに selector 追加
- Prisma schema / user-repository に `favoriteMoon String?` を反映

### 3. DM 統合（spec R1 変更）

- spec R1「投稿ごとに新規 conversation」を**廃止**し、すべての DM を「1 相手 = 1 スレッド」（pair-direct, `rootPostId = null`）に統合
- `start-conversation-by-post` を `findByPair([initiator, author], null)` ベースに変更。既存があれば再利用、なければ pair conversation を新規作成。`rootPostId` は持たない
- 「個室」概念を UI / 文言から全廃
- DM 一覧（`chats/page.tsx`）を LINE 風に書き換え: avatar + nickname + 直近 preview + 時刻（昨夜 / 一昨夜）+ 未読バッジ、直近順ソート
- スレッド（`thread-view.tsx`）から個室名 sub-banner を削除し「N 夜目」のみに

### 4. 即時反映（router.refresh）

- server action 成功後に `useRouter().refresh()` を呼び、リロード無しで Server Component を再取得。プロフ編集・投稿・送信で前状態が残る問題を解消

### 5. dev tooling（本番非対象）

- `/api/test/login`: JWT を encode して session cookie を set、1-click sign-in
- `/api/test/seed` / `/api/test/seed-dummy`: alice を主役とした世界（5 users / 3 DM / posts / likes / login history / presence event）を 1 リクエストで構築
- `/dev/moons`: 月相 grid の目視確認ページ
- すべて `NODE_ENV !== 'production' && E2E_TEST_ENABLED === 'true'` で gate。本番では 403
- `/api/test/*` を middleware の public path に追加
- dev HMR で in-memory repository が消える問題を `globalThis` singleton（`globalThis.__meMeEnRepos`）で解消

### 6. SP モバイル対応（≤768px）

- **制約**: desktop CSS は一切触らない。全変更を `md:` prefix（≥768px で従来値に戻す）か `hidden md:` で gate する。別 branch `feat/sp-ui` で作業
- **ナビ外殻**: Sidebar を `hidden md:flex` で SP 非表示にし、`BottomTab`（軒先 / 手紙 / 羊 / 己）を新設。TopBar は時計 / countdown を SP で隠し、brand 幅・余白・letter-spacing を出し分け
- **各ビュー**: 2 ペイン → 縦積み単段化。RightRail / VisitRecordRail は SP で非表示または下段に積む。padding・見出し・bubble 幅を `md:` で出し分け
- **SumiDivider**: 固定幅 760 の横溢れを `maxWidth: 100%` で抑制（desktop は容器幅 ≥760 のため不変）
- **thread 高さ**: `h-[calc(100vh-124px)] md:h-[calc(100vh-64px)]` で BottomTab（60px）分を差し引き、composer が隠れないように

## 設計判断

- **inline style → className 移行**: Tailwind の responsive variant（`md:`）は className でしか効かず inline style では media query を表現できない。SP 対応にあたり、レイアウトを決める固定 inline style（width / padding / display:flex）を `md:` 付き className に移し、desktop 値は `md:` 側に温存した。装飾だけの inline style（色 / box-shadow 等）は据え置き
- **DM 統合の根拠**: 「タイムライン返信」も「profile から話しかけ」も同じ相手との対話なら 1 つの記憶に集約されるべき、というユーザー判断。per-post conversation はスレッドが乱立し UX を損なう。β-5-d で導入済の partial unique index（`conversations_pair_direct_key`, `WHERE rootPostId IS NULL`）が、統合後モデル（pair ごと 1 つ）をそのまま DB 層で保証する
- **月相は外部 API 不使用**: β-3 の方針を踏襲。synodic 月 + 既知 epoch の純粋関数で算出。装飾用途として数時間の誤差は許容
- **時刻は「正確 + 補助」**: 不定時法のみの表示は実用性を損なうため、分単位の正確な時刻を主とし、時辰を世界観の補助として併記
- **SP で時計 / 装飾アイコン / 補足文を隠す**: 狭い画面では情報密度を下げる方が読める。機能に影響しない装飾要素を優先的に間引いた
- **BottomTab を thread でも表示**: thread 高さを BottomTab 分だけ縮めることで、LINE 的全画面チャットにせず nav の一貫性を保った

## spec 変更（product-spec.md）

Phase γ の DM 統合に伴い、以下を改訂:

- **R 行（DM 起動）**: R1 の「投稿ごとに新規 conversation」を削除。R1 / R2 とも「1 相手 = 1 スレッド」に合流する記述へ
- **Conversation 不変条件**: `(ペア, rootPostId)` で一意 → `ペア` で一意（全 conversation が `rootPostId = null` の direct）へ
- **Post 削除 cascade**: per-post conversation 廃止に伴い「orphan を残す」記述を削除（DM は post に紐付かないため影響なし）
- **親しい羊**: 「複数 conversation のメッセージ数を合算」注記を「1 相手 = 1 スレッドのため合算不要」へ

## 検証

- `pnpm -F @me-me-en/web typecheck`: 緑
- `pnpm -F @me-me-en/application test`: **125 / 125 passed**（`start-conversation-by-post.test` を統合仕様に更新、`start-conversation-direct.test` と整合）
- **Playwright 実機検証（local）**:
  - SP 390×844: timeline / chats / profile / thread の 4 ビューが崩れず、下部タブで導線が機能
  - desktop 1440×900: timeline / profile が overhaul 前後でレイアウト不変（`md:` gate が効いていることを確認）

## 残課題

- #24: rate limit 30 秒 / 投稿（spec C 行）
- #25: 05:00 force-disconnect（spec B 行）
- #26: 客帳（listUsers）use case（spec S-c）
- #27: Prisma migration 更新（favoriteMoon column の追加。β-5-d の `0_init` に続く migration）
- #28: test 拡充（DM 統合後の presentation / SP の regression test）
- Task #4: ESLint 境界ルール（β から持ち越し）
