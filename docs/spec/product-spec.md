# me-me-en（迷羊苑）— Product Spec

WIP（作成中）。ユーザーと 1 件ずつ合意しながら追記する。確定したものだけここに残し、設計メモ（`docs/design/domain-notes.md`）と区別する。

---

## 1. アプリ目的（1-2行）

> _（未定）_

## 2. ターゲットユーザー

> _（未定）_

## 3. 中心価値（何が嬉しいか）

**DM とタイムラインが同等の主役。**

- 1対1 の親密な対話（DM）と、緩いコミュニティ的つぶやき（タイムライン）の両方を等しく扱う
- スコープがやや広いことを認識した上で MVP 機能採否を慎重に行う
- 「対話と共有」の両軸を支える付随機能（reply / like / tag / presence 等）は **両方の文脈で意味を持つもの**を優先採用

## 4. MVP 機能リスト（採否確定したもの）

| # | 機能 | スコープ | 採否 | 補足 |
| --- | --- | --- | --- | --- |
| A | 認証（合言葉での入店） | — | 採用 | 詳細未定（共通/個別） |
| B | 営業時間制限 22:00-05:00 JST | — | 採用 | — |
| C | 軒先（タイムライン） — 投稿、夜単位で他者から消える、自分は永続閲覧可 | — | 採用 | 詳細未定 |
| D | 手紙（DM） — 1対1、永続 | — | 採用 | — |
| F | プレゼンス（灯ともる、秘匿可） | — | 採用 | — |
| G | typing 表示 | DM | 採用 | — |
| H | 既読 | DM | 採用 | — |
| R | **DM 起動（2 経路）** | タイムライン × DM | 採用 | (R1) **Post → DM**: タイムラインの投稿に対する「返信」操作は、タイムライン内に reply スレッドを作るのではなく、その投稿を文脈に乗せた **DM の起動** となる。(R2) **相手指定 → DM**: 相手のプロフィールや一覧から直接話しかけて DM を始める |
| J | タイムライン内 reply スレッド | タイムライン | **不採用** | 公開 reply は持たない。深い会話はすべて DM に流れる |

## 5. MVP 範囲外（明示的に除外）

> _（未定）_

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
