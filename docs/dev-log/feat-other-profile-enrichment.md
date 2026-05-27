# 他者プロフィールの拡充（己と同じ意匠 + 親しい羊の BE 秘匿）

## 方針

他者プロフィール (`/profile/[userId]`) を「己」(自分のプロフィール) と似た見た目・情報量にする。ただし **親しい羊 (close sheep) は本人のみ可視**（spec 51）を守り、UI で隠すだけでなく **BE がそもそも返さない** ことを保証する。

旧 other-profile は avatar / nickname / presence / bio / しるし だけの簡素な表示で、γ の「月夜の墨」意匠にも追従していなかった。

## 範囲

### presentation

- `profile/[userId]/page.tsx`:
  - DTO に `favoriteMoon` / `joinedAt` を追加
  - wrapper を SP 対応 padding に。**getCloseSheep は呼ばない**（来店帳 N / 在席 O / 親しい羊 M は取得しない = BE 非露出）
- `profile/[userId]/other-profile.tsx`: 己の `ProfileDisplay` と同じ card 意匠に作り替え
  - 装飾月（好きな月の月相、未設定は居待月 fallback）+ avatar + nickname + status + bio
  - 3 列 meta: 入店初日 / 好きな月 / よく置く文
  - 今宵のしるし
  - **親しい羊 / 来店帳 / 在席チャートは無し**
  - 「話しかける」ボタン（旧「個室へご案内中…」の個室語を除去）
  - SP 縦積み / 折り返し対応、見出しは `text-[22px] md:text-[32px]` で SP 折返しを回避

### dev tooling

- `api/test/seed-dummy`: 入店初日を羊ごとにずらす（`joinedBase - i*23日`）。他者プロフィールの「入店初日」に変化が出る

## 設計判断

- **親しい羊の秘匿は「取得しない」で担保**: getCloseSheep は引数 `userId` の close sheep を計算する use case だが、他者 route はこれを import すらしない。DTO にも close-sheep フィールドが無いため、サーバ応答に他者の親しい羊が一切含まれない（CSS hide ではなく BE レベルの非露出）
- **公開範囲の拡張は spec 51 を一段広げる**: 従来「他者は avatar/nickname/bio/しるし/presence のみ」だったが、好きな月・入店初日・よく置く文 も公開に含める（ユーザー判断）。来店帳・在席・親しい羊は引き続き本人のみ
- **「よく置く文」は placeholder**: 己と同じく固定値「独り言」。実データ化は将来
- **意匠は己の card を踏襲**: 一貫性のため `ProfileDisplay` と同じ markup・responsive 規則を再利用

## 検証

- ローカル dev server で desktop / SP のスクリーンショット確認:
  - 月見羊 (u_dev_bob): 装飾月=十三夜、入店初日=令和八年 弥生 九日、好きな月=十三夜、しるし=月を眺める、親しい羊なし
  - SP は card 縦積み・meta 折返し・見出し 1 行
- `pnpm -F @me-me-en/web typecheck`: 緑
- 他者 route に `getCloseSheep` / close-sheep 参照が無いことを grep で確認

## 残課題

- 「よく置く文」を実データ化（投稿傾向の集計）するか
- ブロック相手の他者プロフィール表示（現状 listUsers では除外済だが直接 URL アクセス時の扱い）は別途検討
