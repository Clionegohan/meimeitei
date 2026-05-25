# me-me-en（迷羊苑）— Product Spec

WIP（作成中）。ユーザーと 1 件ずつ合意しながら追記する。確定したものだけここに残し、設計メモ（`docs/design/domain-notes.md`）と区別する。

---

## 1. アプリ目的（1-2行）

**眠れぬ夜、ひとりではない、と。言葉だけで、確かめあう場所。**

（design HTML 由来のコピーを採用）

## 2. ターゲットユーザー

**眠れぬ夜を過ごす人々。** 22:00 〜 翌 05:00 の間にだけ集まり、言葉だけで他者と確かめあいたい人。
- 眠れない夜が「キー」になる。夜型生活全般や常時アクセスのコミュニケーションを求める人はターゲットではない
- 「夜の隔離された隠れ家」のメタファーをコア体験として保持する

## 3. 中心価値（何が嬉しいか）

**DM とタイムラインが同等の主役。**

- 1対1 の親密な対話（DM）と、緩いコミュニティ的つぶやき（タイムライン）の両方を等しく扱う
- スコープがやや広いことを認識した上で MVP 機能採否を慎重に行う
- 「対話と共有」の両軸を支える付随機能（reply / like / tag / presence 等）は **両方の文脈で意味を持つもの**を優先採用

## 4. MVP 機能リスト（採否確定したもの）

| # | 機能 | スコープ | 採否 | 補足 |
| --- | --- | --- | --- | --- |
| A | 認証 — **OAuth (Google)** | — | 採用 | MVP は **Google OAuth のみ**。Auth.js (NextAuth v5) を想定。合言葉ベースの認証は廃止。UI 表記（「暖簾をくぐる」「ご記帳」等）は presentation 層で OAuth ボタンに重ねる |
| — | Identity (nickname) | — | nickname は **system-wide unique**（重複不可、ご記帳と変更時にチェック）。**変更可**。`@handle` は持たない。識別子は内部 `User.id`、表示は nickname のみ。**1–20 文字**（grapheme 単位）、半角・全角混在可 |
| — | Avatar | — | **SheepBrush 風の羊画像**（SVG、design 由来）。ユーザーは `tone`（色）のみ選択。Google profile picture / アップロード / プリセット選択は MVP 範囲外 |
| — | bio | プロフィール | **0–200 文字**（grapheme 単位）。Markdown 不可、改行可。空欄を許す（必須ではない） |
| B | 営業時間制限 22:00-05:00 JST | — | 採用 | 05:00 を跨いだ瞬間、接続中ユーザーは **強制 disconnect + 閉店中画面へ遷移**。営業時間外は全 use case が `ForbiddenError`、画面はログイン画面ではなく閉店中画面 |
| C | 軒先（タイムライン） — 投稿、夜単位で他者から消える、自分は永続閲覧可 | — | 採用 | 投稿本文は**最大 280 文字**、メディア添付なし、複数行可。**削除可、編集不可**。削除後は他者から非表示（自分の過去投稿一覧でも非表示でよい）。**並び順は時系列降順（新しい投稿が上）**。**rate limit: 30 秒に 1 投稿** |
| D | 手紙（DM） — 1対1、永続 | — | 採用 | 1 メッセージ**最大 280 文字**、メディア添付なし、Post と仕様を揃える。**削除可、編集不可**。削除されると相手側では「取り消されました」placeholder を残す |
| F | プレゼンス（灯ともる、秘匿可） | — | 採用 | `User.presenceVisibility = 'visible' \| 'invisible'`（永続）。**完全非対称**: 秘匿者本人は他者の online を見られるが、他者からは秘匿者は常に offline と見える |
| G | typing 表示 | DM | 採用 | — |
| H | 既読 | DM | 採用 | — |
| R | **DM 起動（2 経路）** | タイムライン × DM | 採用 | (R1) **Post → DM**: 投稿への「返信」操作はタイムライン内 reply ではなく、その投稿を文脈に乗せた **DM の起動**。**投稿ごとに新規 conversation が作られる**（同じ相手の投稿 A・B にそれぞれ返信したら DM スレッドは 2 つ別個）。(R2) **相手指定 → DM**: 相手の profile や一覧から直接話しかけて DM を始める。**R2 は同じ相手で 1 conversation のみ**（既存があれば再利用） |
| — | Conversation の不変条件 | DM domain | — | `Conversation` は `(participantIds の正規化ペア, rootPostId)` で一意。`rootPostId = null` の R2 conversation は同ペアで 1 つだけ。`rootPostId = postX` の R1 conversation は post ごとに別個 |
| — | Post 削除の cascade | Post × DM | — | Post 削除時、関連 R1 DM conversation は **残す**（orphan、表示は「取り下げられた投稿への返信」placeholder）。当該 Post への like は累計から取り消し（来店帳の `寄せられた燭` から減算） |
| S | DM 一覧と相手の検索経路 | DM 起点 | 採用 | (a) タイムライン right rail の「灯ともる羊」リスト → profile → DM、(b) profile の「親しい羊」リスト経由、(c) 全体ユーザー一覧（客帳）を sidebar 経由でアクセス |
| J | タイムライン内 reply スレッド | タイムライン | **不採用** | 公開 reply は持たない。深い会話はすべて DM に流れる |
| I | Like（軽い反応） | タイムライン | 採用、**カウント他者非公開** | 投稿への like 操作は可能。他者は他人の like 総数を見られない。自分が受け取った like の累計は、自身のプロフィール（来店帳）でのみ可視 |
| K | しるし（mood tag） | プロフィール | 採用、**profile のみ** | profile に複数掲げる（今夜の気分を表す）。投稿には付けない。`眠れない` `読書中` `お茶を一杯` `月を眺める` 等を enum で持つ |
| N | 来店帳統計 | プロフィール | 採用 | 入店した夜 / 連続来店 / 置いた文 / 寄せられた like の 4 指標。derived (read model)、原データから集計 |
| O | 在席の刻 chart | プロフィール | 採用 | 過去 30 日の時刻別在席頻度（22, 23, 0, 1, 2, 3, 4, 5 の 8 帯）。presence のイベント集計を要する |
| M | 親しい羊 | プロフィール | 採用 | **直近 30 日の DM メッセージ数 Top 3**（自動算出、手動指定なし）。同じ相手で複数 conversation がある場合は **メッセージ数を合算**して 1 ユーザーとしてカウント |
| — | Profile 公開範囲 | プロフィール | — | 他者からは `avatar / nickname / bio / しるし / presence` のみ可視。**来店帳 N / 在席チャート O / 親しい羊 M は本人のみ可視** |
| T | ブロック | 安全機能 | 採用 | (1) 互いに DM 不可（既存 conversation も読込/送信不可）、(2) 互いの post を Timeline 上で非表示、(3) 互いの presence 不可視。ミュート・通報は不採用 |

## 5. MVP 範囲外（明示的に除外）

| # | 機能 | 除外理由 |
| --- | --- | --- |
| J | タイムライン内 reply スレッド | 「言葉だけで確かめあう」純度。深い会話は DM に流す |
| L | お席（**グループトーク**機能） | 多人数チャットルームの実装は MVP のスコープを越える。1on1 DM + Timeline に集中する |
| P | 通知・未読バッジ・ベルアイコン | 「夜の間だけ・接続中だけ・リアルタイムで気付く」モデル。未読数字バッジもドットも持たない。既読概念（H）は DM 表示用に内部的にのみ維持 |
| — | 退会機能 | MVP では退会 UI を持たない。個別の削除要請は運用手動対応。v2 でアカウント tombstone か完全削除のポリシーを定める |
| — | 判子（sealCharacter / hanko） | design HTML に登場した装飾要素。MVP では User entity から外し、profile に判子は表示しない。v2 で再検討の余地 |
| — | お席のグループトーク（L） | 多人数チャットルームは v2 で検討 |
| — | mood tag を post にも付与 | K しるしは profile 専用、post には付けない |

## 6. 非機能要件

| 項目 | 採用 |
| --- | --- |
| タイムゾーン | **JST 固定** |
| 営業時間 | **22:00 — 翌05:00 JST** |
| リアルタイム通信 | **Socket.IO**（Next.js Custom Server に同居） |
| アーキテクチャ | **クリーンアーキテクチャ**（domain → application → infrastructure → web、外→内のみ依存） |
| monorepo | **pnpm workspaces + Turborepo** |
| フレームワーク | **Next.js 16 + Tailwind 4 + React 19** |
| データ層 | **初期 In-Memory adapter、後に Postgres（Prisma）に切替** |
| デプロイ | **Render Web Service（starter プラン）** |
| 想定規模 | **100 – 1,000 名のコアコミュニティ**。Socket.IO は単一インスタンスで運用、Redis adapter なし、horizontal scaling は v2 で検討 |
| 言語 | **日本語のみ**（MVP）。i18n フレームワークは導入しない、文字列はコード内に直書き |
| テスト | Vitest（unit/integration）+ Playwright（E2E）、TDD |
| **語彙ポリシー** | **BE は国際標準の一般用語、UI で迷羊苑表現にマッピング**（後述） |

## 7. 語彙ポリシー — BE / UI 分離

**原則:**
- `packages/domain` / `packages/application` / `packages/infrastructure` / `packages/contracts` は**英語の一般用語**で型名・関数名・変数名を書く
- 値（enum）も英語スネーク（例: `sign='sleepless'`）
- 「迷羊苑表現」は `apps/web` の presentation 層で翻訳辞書を介して表示する
- i18n を将来追加する場合、迷羊苑表記は「ja_meimeitei」locale として扱える設計にする

**用語マッピング（採用機能のみ）:**

| 機能要素 | BE 内部名 | UI 表示（迷羊苑） |
| --- | --- | --- |
| App name | `me-me-en` | 迷羊苑 |
| User | `User` / `user` | 羊（ひつじ） |
| Auth login | `login` | 入店 |
| Passphrase | `passphrase` | 合言葉 |
| Closed (out of hours) | `closed` | 閉店中 |
| Timeline | `Timeline` / `timeline` | 軒先（のきさき） |
| Post | `Post` / `post` | 文（ふみ） |
| Direct message | `Conversation` / `Message` | 手紙（てがみ） |
| Profile | `Profile` | 己（おのれ） |
| Online presence | `presence: 'online'` | 灯ともる |
| Read receipt | `readAt` / `isRead` | 読 |
| Typing indicator | `typing` | 筆を執っています… |
| Send | `send` | 送る / 置く |

> `docs/design/domain-notes.md` は design HTML からの抽出メモであって、機能 commitment ではない。本ドキュメントが正本。

> 既存実装の `SIGN_TAGS`（PR #4）は値が日本語のまま入っている。Phase 1c 以降に着手する前に、値を英語化する小 PR を別途立てる（リファクタリング負債）。

---

## 8. リリース計画（**段階リリース 2 段階**）

### MVPα — コア体験
ターゲットが「眠れぬ夜、言葉で確かめあう」を成立させる最小集合。動くものをまずここで出す。

- A 認証（Google OAuth）+ ご記帳フロー（nickname のみ必須）
- Identity（nickname unique、1–20 文字、変更可）
- Avatar（SheepBrush 風 SVG + tone のみ選択）
- bio（0–200 文字）
- B 営業時間制限（22:00–05:00 JST）+ 閉店時強制 disconnect
- C 軒先（投稿 280 文字、削除可、時系列降順、rate limit 30s/投稿）
- D 手紙（DM 280 文字、削除可）
- F プレゼンス（灯ともる、秘匿可、完全非対称）
- G typing
- H 既読
- I Like（カウント他者非公開）
- K しるし（profile のみ）
- R DM 起動 2 経路（R1 = 投稿への返信、R2 = 直接話しかけ）
- T ブロック

### MVPβ — 装飾・統計
コア体験の上に「居場所」感を厚くする層。

- N 来店帳統計（4 指標）
- O 在席の刻 chart（過去 30 日 × 22-05 の 8 帯）
- M 親しい羊（直近 30 日 DM 数 Top 3）
- タイムライン right rail の充実化（灯ともる羊リスト・月相表示等）

### v2 以降（MVP 範囲外）
J Timeline 内 reply / L お席（グループトーク）/ P 通知・未読バッジ / 退会機能 / 判子 / mood tag の post 付与 / 多言語 / モバイルアプリ

---

## 9. Phase 計画（**層ごと**、MVPα）

| Phase | 層 | スコープ |
| --- | --- | --- |
| 1 — Domain core | `packages/domain` | User refactor / Conversation / Message / Post |
| 2 — Domain extras | `packages/domain` | Like / Block / Presence / Typing |
| 3 — Application | `packages/application` | registerUser / updateProfile / blockUser / sendMessage / markAsRead / updateTyping / createPost / deletePost / likePost / unlikePost / startConversationByPost (R1) / startConversationDirect (R2) / updatePresence / listTimeline / listConversations / listMessages（各 use case に `BusinessHoursGuard` 適用） |
| 4 — Infrastructure | `packages/infrastructure` | In-memory repositories (all) / Auth.js v5 + Google OAuth / Socket.IO event-bus adapter |
| 5 — Presentation | `apps/web` | routes (`/login`, `/onboarding`, `/chats`, `/chats/[id]`, `/profile`, `/closed`) / TopBar / Sidebar / RightRail / Socket.IO client |
| 6 — Deploy + polish | infra | Render Web Service デプロイ / `/api/health` 動作確認 / Playwright E2E（2 ユーザーで DM 動作） / README 更新 |

**各 Phase で守るルール**:
- TDD（test 先行 → RED → 最小実装 GREEN → REFACTOR）
- 各 Phase 着手時に `docs/dev-log/phase-<id>.md` で方針 / TDD cycle / 検証手順を記録
- feature branch + PR + merge commit（main 直 push 禁止）
- spec が真。spec と実装が乖離した場合、原則 spec を優先（spec の方を変えるなら別 PR で改訂）

**MVPβ は MVPα の安定後に追加 Phase として計画する。**

---

## 進捗

| 論点 | 状態 |
| --- | --- |
| 1. アプリ目的 | 未着手 |
| 2. ターゲットユーザー | 未着手 |
| 3. 中心価値 | 未着手 |
| A 認証フロー詳細 | 採用、詳細未定 |
| C 軒先 詳細仕様 | 採用、詳細未定 |
| E プロフィール | 未着手 |
| I 燭を寄せる | 未合意 |
| J 応える | 未合意 |
| K しるし | 未合意 |
| L お席 | 未合意 |
| M 親しい羊 | 未合意 |
| N 来店帳 | 未合意 |
| O 在席の刻 chart | 未合意 |
| P 通知 | 未合意 |
| Q ご記帳（新規登録）詳細 | 採用、詳細未定 |
| MVP 範囲外の明示化 | 未着手 |
| 開発フロー再定義 | 未着手 |
