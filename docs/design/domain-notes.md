# Domain Notes — 迷羊苑（me-me-en）

Source: `Meimeitei Remix.html` v2（Direction A · 月夜の墨）, Claude design 抽出。

## 1. コンセプト

- キャッチコピー: 「眠れぬ夜、ひとりではない、と / 言葉だけで、確かめあう場所です。」
- 副題: 「眠れぬ夜の 子羊たちの隠れ家」
- 営業: **二十二時 — 翌五時**（22:00-05:00、JST 想定 / 要確認）
- ユーザー呼称: **羊（ひつじ）**、数え方は「匹」
- 数字表記: 全面**漢数字 + 和暦**（廿二／廿三／〇／一／二／三／四／五／十二／廿五／二十二、令和八年 神無月 廿五日）

## 2. 用語辞書（一般 → 迷羊苑）

| 一般 | 迷羊苑 | 補足 |
| --- | --- | --- |
| App name | 迷羊苑（読み: ME · ME · EN） | logo に `M E · M E · E N` 表記併記 |
| Login | 入店 / 合言葉 / 暖簾をくぐる | パスフレーズ認証 |
| Signup | ご記帳ください | 初回登録 |
| Logout | 退店する | profile 右下 |
| Closed | 閉店中 / ただ今 準備中 | 営業時間外 |
| Open | 営業中 | |
| Timeline | **軒先（のきさき）** / NOKISAKI | 「皆のつぶやき」 |
| DM | **手紙（てがみ）** / TEGAMI | 「一対一の語らい」「個室」 |
| Profile / My page | **己（おのれ）** / ONORE | 「あなたの席」 |
| Settings | お品書き / FUDA / 整える | |
| User list | 羊 / 客帳 | |
| Friends list | 親しい羊 | プロフィール内 |
| Post body | 文（ふみ） | |
| Send | 送る / 置く / 筆を取る | composer CTA |
| Compose placeholder | 今宵のひとこと、置きませんか。 | timeline |
| Compose placeholder (DM) | そっと、文字を置く… | dm thread |
| Typing indicator | 筆を執っています… | + 3-dot animation |
| Online | 灯ともる（あかりともる）/ 起きています | |
| Offline | 既におやすみ | DM list の inactive group |
| Read receipt | 読 | 1文字。me→相手 既読時 |
| Reply | 応える（こたえる） | post action |
| Like 相当 | **燭を寄せる（しょくをよせる）** | 蝋燭を寄せる。**カウントは他者非公開** |
| Like own counter | 寄せられた燭 | 自分の来店帳のみ |
| Mood/Status tag | しるし / 今宵のしるし | 投稿時の様態タグ |
| Channel/Hashtag | お席（# 眠れぬ夜 等） | 居場所タグ、参加者数表示 |
| Notifications | 鐘（通知ベル） + vermillion ドット | 未読バッジ |
| Search (DM) | 羊を探す… | |
| Avatar | 羊のブラシ画（`SheepBrush`） | tone 色違い |
| Personal seal | 判子（Hanko）/ 朱印 | 1文字、vermillion |
| Conversation age | N夜目（例: 四十二夜目） | 個室の累積夜数 |
| Conversation name | 個室「N の間」（例: 月見の間） | 自動命名 |

## 3. 画面構成（Desktop 1440×900）

| ID | 画面名 | 役割 |
| --- | --- | --- |
| 01 | 入店 — 合言葉 | パスフレーズ入力 + 新規登録（ご記帳） |
| 02 | 閉店中 | 営業時間外。開店までのカウントダウン |
| 03 | 軒先 — タイムライン | 公開投稿フィード |
| 04 | 手紙 — DM | 個室一覧 + スレッド |
| 05 | 己 — プロフィール | 自身の席。statistics + 在席チャート + しるし + 親しい羊 |

共通レイアウト（02 除く）:
- TopBar 64px: ロゴ / セクション名 / 日付・時刻・閉店までのカウントダウン / 通知ベル / 自分アバター
- Sidebar 240px: 軒先 / 手紙 / 羊 / 己 / お品書き
- Main (中央)
- Right Rail 340px（軒先・己）: 今宵の月 / 灯ともる羊 / お席のご案内

## 4. 営業時間ロジック

- **夜（night）** = 22:00 開店 → 翌05:00 閉店、7時間の営業
- 夜の所属日 = 22:00 を迎えた日付（例: 2026-05-25 23:00 と 2026-05-26 02:00 は同じ夜「2026-05-25」）
- 営業時間外（05:00-22:00）はログイン・利用とも不可
- 接続中ユーザーが 05:00 を跨いだ際の挙動: **要確認**
  - 推定: 接続強制終了 → 閉店中画面へ遷移
- TopBar に「閉店まで N時間 M分」常時表示
- 閉店中画面に「開店まで N時間 M分 K秒」カウントダウン
- 「子の刻」「丑三つ時」など旧時刻表記をUI で併用

## 5. タイムライン仕様（軒先）

- 投稿は永続化されるが、**他者に見せるのは投稿された夜の閉店までだけ**
- 閉店後は投稿者本人のみ閲覧可（プロフィール経由）
- 「ここから今宵が始まりました / 二十二時 開店 · 二十六年 神無月 廿五日 / 昨夜より前の文は、朝とともに片付けられました。」マーカーがフィード末尾
- 投稿に **応える（reply）** が可能（カウント非表示）
- 投稿に **燭を寄せる（like）** が可能（カウント非表示）
- フィルタタブ: **今宵 / 灯ともる / 燭を寄せた**
- 投稿時の必須/任意:
  - 本文（複数行可、whitespace pre-line）
  - 今宵の様態（しるし、1個）: 眠れない / 寝る前に / 独り言 / しりとり
  - お席タグ（任意、複数？）: # 眠れぬ夜 / # ほうじ茶卓 / # 星見の縁台 / # 本を読む / # 夜更けの台所
- 投稿カード表示要素:
  - アバター（lit なら緑ドット）
  - nickname + 距離（たった今 / 8分前 / 23分前）+ 時刻
  - 本文（pre-line）
  - 応える / 燭を寄せる / ⋯（メニュー）

## 6. DM 仕様（手紙）

- **永続**: 「夜を跨いでも、文字は残ります」「夜を跨いで、ふたりだけの記憶になります」
- 個室（conversation）は1対1。自動命名「N の間」
- 「四十二夜目 · お席」= conversation.nightCount（両者ともログインしてやり取りした夜の累積）
- DM list:
  - 検索（羊を探す…）
  - フィルタ: 全て / 灯ともる / 未読
  - グルーピング: 今宵 · 灯ともる → 既におやすみ
  - 未読バッジ（vermillion）
  - アバター + lit ドット + nickname + preview + 時刻
  - 時刻表記: HH:MM（02:20） / 昨夜 / 一昨夜
- Thread:
  - Header: 相手アバター + nickname + 「灯ともる · 起きています」
  - Header actions: 時計（履歴）/ 検索（メッセージ検索）/ ⋯
  - Sub-banner: 個室名（例「月見の間」）+ 「夜を跨いでも、文字は残ります」+ N夜目
  - Date divider: 「子の刻 · 二十六年 神無月 廿五日」
  - Message bubble: 自分=右（accent色）、相手=左（surface色）
  - 連続発言で角丸を変える（chat 慣例）
  - 既読: 自分の発言下に「読」（1文字、accentDim 色）
  - Typing: 「筆を執っています…」 + 3 dots
  - Composer placeholder: 「そっと、文字を置く…」
  - Composer 注釈: 「夜を跨いで、ふたりだけの記憶になります」
  - 送信ボタン: 「送る」
  - メディア添付の余地: 「(画像を送りました)」表記が DM list preview にある（v2 で実装するか要決定）

## 7. プレゼンス仕様

- ログイン中 = **灯ともる**（lit）。アクセントカラー（B89B6E aged paper gold）のドット + glow
- 自分以外への可視性: User.presenceVisibility = `visible | invisible`
  - 秘匿時の挙動: **要確認**（推定: lit broadcast を抑止、本人は常に offline 扱いで他者に表示）
- 表示箇所:
  - DM thread header: 「灯ともる · 起きています」
  - DM list: アバター右下ドット + lit/offline で section 分け
  - Timeline right rail: 「灯ともる羊 二十七匹」 + nickname + mood リスト
  - Post card avatar: lit ドット
  - Profile: 「灯ともる · 今宵 在席」

## 8. プロフィール仕様（己）

### Main
- アバター（132px） + 判子（Hanko、1文字漢字）
- nickname（@handle なし）
- presence ステータス
- 自己紹介（複数行、自由テキスト）
- meta 横並び:
  - 入店初日（和暦例: 二十五年 葉月 三日）
  - 好きな時刻（例: 丑三つ時、システム算出）
  - よく置く文（例: 独り言、トップ投稿カテゴリ）

### 今宵のしるし（multi-select toggle）
8種類: 眠れない / 読書中 / お茶を一杯 / 月を眺める / 何でもない / 声を聞きたい / しりとり / 夜更かし
- 同じしるしを掲げる羊と出会える機能（matching/discovery）

### 親しい羊
- よくDMやり取りする羊 (Top N)、各々の個室開始からの夜数表示

### Right rail: 来店帳
- 統計4種:
  - 入店した夜（=ログイン夜数）
  - 連続来店（=consecutive nights）
  - 置いた文（=投稿数）
  - 寄せられた燭（=自分が受け取ったいいね総数）
- 在席の刻 chart: 過去30日、時間別（廿二・廿三・〇・一・二・三・四・五）の在席頻度バー
- 「よく在席されるのは 丑三つ時 あたり」自動算出

## 9. 入店フロー（Login）

- パスフレーズ入力（マスク 8文字）
- 「暖簾をくぐる」ボタン（提出）
- 「はじめての方は ご記帳ください」リンク（新規登録）
- 営業時間内: 上部に「営業 二十二時 — 翌五時」「ただ今 営業中 · 二十三時 十二分」
- 営業時間外: 別画面（閉店中）へリダイレクト

## 10. ドメインモデル草案

```ts
// User（羊）
{
  id: UserId,
  nickname: string,                   // ニックネーム、@handle 廃止
  bio: string,                        // 複数行可
  tone: string,                       // avatar color (#E8E2D2 等)
  sealCharacter: string,              // 判子 1文字
  presenceVisibility: 'visible' | 'invisible',
  joinedAt: ISODateTime,              // 和暦表示は presentation
  currentSigns: SignTag[],            // 今宵のしるし、複数
  // 派生統計（read model）
  stats: {
    totalNights: number,
    consecutiveNights: number,
    postCount: number,
    candleReceivedCount: number,
    presenceHistogram: Record<Hour22to5, number>,
    favoriteHour: Hour22to5,
    topPostSign: SignTag | null,
  }
}

// Conversation（個室）
{
  id: ConversationId,
  participantIds: [UserId, UserId],
  name: string,                       // 「月見の間」等、自動命名 or 後付け
  openedAt: ISODateTime,
  // 派生
  nightCount: number,                 // 両者がやり取りした夜の累積
}

// Message（手紙）— 永続
{
  id: MessageId,
  conversationId: ConversationId,
  senderId: UserId,
  body: string,
  sentAt: ISODateTime,
  readByOther: boolean,
  attachment?: { type: 'image', url: string },  // v2 余地
}

// Post（軒先のつぶやき）— 永続だが他者からは投稿夜のみ可視
{
  id: PostId,
  authorId: UserId,
  body: string,
  sign: SignTag | null,               // 投稿時の様態（1個）
  seatTags: SeatTag[],                // # 眠れぬ夜 等、複数可
  postedAt: ISODateTime,
  nightId: NightId,                   // 投稿時の夜（22:00開店した日）
  // 派生
  candleCount: number,                // 内部保持。表示しない（来店帳のみ集計用）
}

// Reply（応える、Post への返信）
{
  id: ReplyId,
  postId: PostId,
  authorId: UserId,
  body: string,
  sentAt: ISODateTime,
}

// Candle（燭を寄せる、Like 相当）
{
  postId: PostId,                     // または replyId
  userId: UserId,
  sentAt: ISODateTime,
}

// SignTag enum: 眠れない | 寝る前に | 独り言 | しりとり | 読書中 | お茶を一杯 | 月を眺める | 何でもない | 声を聞きたい | 夜更かし
//   - profile しるし用: 眠れない / 読書中 / お茶を一杯 / 月を眺める / 何でもない / 声を聞きたい / しりとり / 夜更かし
//   - post 様態用: 眠れない / 寝る前に / 独り言 / しりとり
//   両者を統合する集合として扱うか分けるか要検討

// SeatTag enum (or 任意): 眠れぬ夜 / ほうじ茶卓 / 星見の縁台 / 本を読む / 夜更けの台所
//   - 固定 enum か user-defined か要確認

// Presence（揮発）
{
  userId: UserId,
  status: 'lit' | 'offline',
  lastSeenAt: ISODateTime,
}

// Typing（揮発）
{
  conversationId: ConversationId,
  userId: UserId,
  startedAt: ISODateTime,
}

// Night（営業日）
{
  id: NightId,                        // 開店日付 (YYYY-MM-DD)
  opensAt: ISODateTime,               // YYYY-MM-DD 22:00 JST
  closesAt: ISODateTime,              // (YYYY-MM-DD+1) 05:00 JST
}
```

## 11. 要確認（Phase 1 開始前に詰めたい）

1. **タイムゾーン**: JST 固定？（推定）
2. **05:00 跨ぎ挙動**: 接続強制終了 / 閉店中表示 / DM のみ閲覧維持 のいずれか
3. **プレゼンス秘匿の対称性**: 秘匿者本人は他者の灯ともるを見られるか
4. **SeatTag**: 固定 enum か user-defined か
5. **SignTag**: profile しるし と post 様態 は同一集合 / 別集合か
6. **画像添付**: DM list の「(画像を送りました)」preview は実装範囲か（v2 で未実装の余地表現か）
7. **「親しい羊」算出ロジック**: 直近DM頻度 / 累積夜数 / 手動指定
8. **「好きな時刻」「よく置く文」**: 統計から自動 or 手動入力
9. **判子1文字**: ニックネームから自動派生 / 手動指定 / 都度生成

## 12. 設計に直結する数字仕様

- 漢字数字（〇〜九・十・廿・百）、和暦（令和N年 + 旧暦月名）は **presentation 層の責務**
- domain は ISO datetime / number で保持
- presentation utility: `toKanji(n)` / `toWareki(date)` / `toOldMonthName(month)` を `apps/web/src/lib/` に実装する
- DM のスレッド date divider に「子の刻」など、時刻帯名称が登場 → 別 utility `toJikoku(hour)`
