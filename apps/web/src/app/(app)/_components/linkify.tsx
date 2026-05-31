import type { ReactNode } from 'react'

// 本文中の URL を安全に <a> へ変換するためのトークナイザ + コンポーネント。
//  - http / https のみ対象 (javascript: 等のスキームは平文のまま、XSS を防ぐ)
//  - 本文の非 URL 部分は React が自動エスケープする平文として描画する
//  - URL 末尾に続く句読点・閉じ括弧はリンクから除外し、平文へ戻す

export type LinkToken = { type: 'text'; value: string } | { type: 'link'; value: string }

const URL_RE = /https?:\/\/[^\s]+/g

// URL の末尾に紛れ込みがちな句読点・閉じ括弧。リンクからは外して平文に戻す。
const TRAILING = new Set([
  '.',
  ',',
  ';',
  ':',
  '!',
  '?',
  ')',
  ']',
  '}',
  '"',
  "'",
  '、',
  '。',
  '，',
  '．',
  '）',
  '」',
  '』',
  '】',
  '・',
])

const splitTrailing = (url: string): { link: string; tail: string } => {
  let end = url.length
  while (end > 0 && TRAILING.has(url[end - 1] as string)) end -= 1
  return { link: url.slice(0, end), tail: url.slice(end) }
}

export const tokenizeLinks = (text: string): LinkToken[] => {
  const tokens: LinkToken[] = []
  let lastIndex = 0
  for (const match of text.matchAll(URL_RE)) {
    const matched = match[0]
    const start = match.index
    if (start > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, start) })
    }
    const { link, tail } = splitTrailing(matched)
    if (link.length > 0) tokens.push({ type: 'link', value: link })
    if (tail.length > 0) tokens.push({ type: 'text', value: tail })
    lastIndex = start + matched.length
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return tokens
}

export function Linkify({ text }: { text: string }): ReactNode {
  const tokens = tokenizeLinks(text)
  return tokens.map((t, i) =>
    t.type === 'link' ? (
      <a
        key={i}
        href={t.value}
        target="_blank"
        // noopener/noreferrer: 新規タブの乗っ取り防止。
        // nofollow ugc: ユーザー投稿リンクへの被リンク評価/spam 連鎖を防ぐ (SEO 配慮)。
        rel="noopener noreferrer nofollow ugc"
        className="underline decoration-[#7A6749] underline-offset-2 hover:decoration-[#B89B6E]"
        style={{ color: '#B89B6E', wordBreak: 'break-all' }}
      >
        {t.value}
      </a>
    ) : (
      <span key={i}>{t.value}</span>
    ),
  )
}
