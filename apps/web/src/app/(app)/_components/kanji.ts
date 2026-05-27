// design HTML (docs/design/extracted-login.jsx) の toKanji を移植 + 拡張。
// 和暦 / 月名 / 干支の刻 のマッピングも合わせて持つ。

const KANJI_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const

// 0-99 のアラビア数字を漢数字に変換。100 以上は半角のまま返す。
// 略字を使う: 二十 → 廿、三十 → 卅 (sidebar 日付の「廿五日」と統一)。
//   廿 (20) / 廿一〜廿九 / 卅 (30) / 卅一〜卅九 / それ以外は 四十... と通常表記。
export const toKanji = (n: number): string => {
  const i = Math.floor(n)
  if (i < 0) return '〇'
  if (i < 10) return KANJI_DIGITS[i] ?? '〇'
  if (i === 10) return '十'
  if (i < 20) return '十' + (KANJI_DIGITS[i - 10] ?? '')
  // 20 番台は「廿」、30 番台は「卅」を使う
  if (i === 20) return '廿'
  if (i < 30) return '廿' + (KANJI_DIGITS[i - 20] ?? '')
  if (i === 30) return '卅'
  if (i < 40) return '卅' + (KANJI_DIGITS[i - 30] ?? '')
  if (i < 100) {
    const t = Math.floor(i / 10)
    const o = i % 10
    return (KANJI_DIGITS[t] ?? '') + '十' + (o > 0 ? KANJI_DIGITS[o] ?? '' : '')
  }
  return String(i)
}

// 和暦の月名 (1-12)。
const TRADITIONAL_MONTHS = [
  '睦月', '如月', '弥生', '卯月', '皐月', '水無月',
  '文月', '葉月', '長月', '神無月', '霜月', '師走',
] as const

// 干支の刻 (時刻 → 時辰)。子=23-1, 丑=1-3, ...
// 24 時間を 2 時間ずつ 12 分割。
const TWELVE_HOURS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

// JST に変換して year / month / day / hour を取り出す。
const toJstParts = (utc: Date): { y: number; m: number; d: number; h: number; min: number } => {
  const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000)
  return {
    y: jst.getUTCFullYear(),
    m: jst.getUTCMonth() + 1,
    d: jst.getUTCDate(),
    h: jst.getUTCHours(),
    min: jst.getUTCMinutes(),
  }
}

// 「令和八年 神無月 廿五日」のような表記を作る。
// 令和は 2019 年から始まる (令和元年 = 2019)。
export const formatJapaneseDate = (now: Date): string => {
  const { y, m, d } = toJstParts(now)
  const reiwa = y - 2018
  const monthName = TRADITIONAL_MONTHS[m - 1] ?? ''
  return `令和${toKanji(reiwa)}年 ${monthName} ${toKanji(d)}日`
}

// 時刻文字列 "HH:MM" (24h、JST、半角数字 + tabular-nums で揃える前提)。
export const formatJapaneseTime = (now: Date): string => {
  const { h, min } = toJstParts(now)
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// 「子の刻」「丑の刻」など、現在時刻が属する時辰を返す。
export const currentHourBranch = (now: Date): string => {
  const { h } = toJstParts(now)
  // 子の刻は 23:00 - 01:00 (前の刻が前日寄り)。23 → 0 → 1 は子。
  // index = ((h + 1) / 2) % 12 で対応する。h=23 → 12 → 0 = 子。h=0 → 1 → ...→0、h=1 → 2 → 1 = 丑、不一致。
  // 計算: 23-1 -> 子, 1-3 -> 丑, 3-5 -> 寅, ... 21-23 -> 亥。
  // 整数化: index = floor(((h + 1) % 24) / 2)
  const idx = Math.floor(((h + 1) % 24) / 2)
  return `${TWELVE_HOURS[idx]}の刻`
}

// 営業時間 (22:00-05:00 JST) を踏まえたカウントダウン。
// 営業中 → 次の 05:00 までの残り (label: 閉店まで)
// 営業時間外 → 次の 22:00 までの残り (label: 開店まで)
export type Countdown = {
  label: '閉店まで' | '開店まで'
  text: string // 「二時間 十三分」
  isOpen: boolean
}

export const calcCountdown = (now: Date): Countdown => {
  const { h, min } = toJstParts(now)
  const isOpen = h >= 22 || h < 5

  // 次の target 時刻 (JST) までの分数を計算する。
  // 今が JST のどの分にいるかを 0-1439 で表す。
  const nowMinJst = h * 60 + min

  let targetMinJst: number
  if (isOpen) {
    // 閉店時刻 = 翌 (もしくは当日) 05:00 JST = 5 * 60 = 300
    if (h >= 22) {
      // 翌日 05:00 まで = (24 * 60 - nowMinJst) + 300
      targetMinJst = 24 * 60 + 300
    } else {
      // 当日 05:00 まで
      targetMinJst = 300
    }
  } else {
    // 開店時刻 = 当日 22:00 = 22 * 60 = 1320
    targetMinJst = 1320
  }
  const diffMin = Math.max(0, targetMinJst - nowMinJst)
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  const text = `${toKanji(hours)}時間 ${toKanji(mins)}分`
  return {
    label: isOpen ? '閉店まで' : '開店まで',
    text,
    isOpen,
  }
}
