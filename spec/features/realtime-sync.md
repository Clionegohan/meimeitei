# Feature: Realtime Sync

---
feature: realtime-sync
status: :TODO
priority: high
dependencies: [seat-system, chat]
created: 2026-02-06
updated: 2026-02-06
---

**TODO: このspecを作成する際は、`spec/templates/feature-template.md` をコピーして記述してください。**

## Quick Notes

実装済みの内容（仕様化が必要）:
- WebSocket (ws ライブラリ)
- イベント駆動アーキテクチャ
- Zodによるイベントバリデーション

同期イベント:
- user_join: 入店時、参加者リスト更新
- user_leave: 退店/切断時、参加者リスト更新
- seat_change: 着席/離席時、席状態更新
- message: チャット送信時、メッセージ追加
