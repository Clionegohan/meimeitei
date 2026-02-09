#!/bin/bash

# セッション調整チェックスクリプト
# 作業開始前に必ず実行すること

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     セッション間調整チェック - 作業開始前確認           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. DOING.md チェック
echo "📄 【DOING.md】現在の作業状況:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "DOING.md" ]; then
  # コードブロック外で「🔄 作業中」を検索
  # awk でコードブロック（```で囲まれた部分）を除外
  WORKING_SESSIONS=$(awk '
    /^```/ { in_code = !in_code; next }
    !in_code && /🔄 作業中/ { print; found=1 }
    END { exit !found }
  ' DOING.md)

  if [ $? -eq 0 ]; then
    echo "⚠️  他のセッションが作業中です！"
    echo ""
    # 該当セクションを表示
    awk '
      /^```/ { in_code = !in_code; next }
      !in_code && /🔄 作業中/ { found=1 }
      found && !in_code { print }
      found && /^---/ { exit }
    ' DOING.md | head -8
    echo ""
    echo "❌ このまま作業を開始すると衝突します"
    echo "✅ 対応: 他セッションの完了を待つか、別タスクを選択"
    exit 1
  else
    echo "✅ 現在、他セッションは稼働していません"
    cat DOING.md | tail -10
  fi
else
  echo "⚠️  DOING.mdが存在しません"
  echo "✅ 初回作業の場合は問題ありません"
fi
echo ""

# 2. Git ブランチチェック
echo "🌿 【Git Branch】現在のフィーチャーブランチ:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 現在のブランチ: $CURRENT_BRANCH"
echo ""
echo "📋 全フィーチャーブランチ:"
git branch -a | grep feature | head -10
echo ""

# 3. 最新コミットチェック
echo "📝 【Git Log】直近5コミット:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -5 --date=format:'%Y-%m-%d %H:%M:%S' --pretty=format:'%C(yellow)%h%Creset %C(cyan)%ad%Creset %s'
echo ""
echo ""

# 4. PRステータスチェック
echo "🔀 【Pull Requests】オープン中のPR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v gh &> /dev/null; then
  gh pr list --limit 5 2>/dev/null || echo "PRを取得できませんでした"
else
  echo "gh CLI がインストールされていません"
fi
echo ""

# 5. チェックリスト
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              作業開始前チェックリスト                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ 以下を確認してから作業を開始してください:"
echo ""
echo "  [ ] DOING.mdに他セッションの作業中タスクがない"
echo "  [ ] 同じフィーチャーブランチが作業中でない"
echo "  [ ] 直近5分以内の他セッションのコミットがない"
echo "  [ ] 同じフィーチャーのPRが未マージで存在しない"
echo "  [ ] DOING.mdに自分の作業内容を記録する"
echo ""
echo "⚠️  疑わしい場合は、作業を開始せず確認してください"
echo ""
