import { ValidationError } from './errors'
import type { Brand } from './id'

// 迷羊苑の営業日（夜）— JST 固定、サマータイムなし。
// 22:00 JST 開店 〜 翌 05:00 JST 閉店。
// 「夜」の id は開店した日付（YYYY-MM-DD JST）。
//   22:00〜23:59 はその日付の夜、00:00〜04:59 は前日の夜に属する。

export type NightId = Brand<string, 'NightId'>

const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const OPEN_HOUR = 22
const CLOSE_HOUR = 5

const toJst = (utc: Date): Date => new Date(utc.getTime() + JST_OFFSET_MS)

const formatYmd = (jstShifted: Date): string => {
  const y = jstShifted.getUTCFullYear()
  const m = String(jstShifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(jstShifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const isOpen = (now: Date): boolean => {
  const h = toJst(now).getUTCHours()
  return h >= OPEN_HOUR || h < CLOSE_HOUR
}

export const nightIdOf = (now: Date): NightId => {
  const jst = toJst(now)
  const h = jst.getUTCHours()
  if (h >= OPEN_HOUR) return formatYmd(jst) as NightId
  if (h < CLOSE_HOUR) {
    const prev = new Date(jst.getTime() - 24 * 60 * 60 * 1000)
    return formatYmd(prev) as NightId
  }
  throw new ValidationError(
    `time ${now.toISOString()} is outside business hours (22:00-05:00 JST); no night assigned`,
  )
}

export const currentNightId = (now: Date): NightId | null =>
  isOpen(now) ? nightIdOf(now) : null

const parseNightId = (nightId: NightId): { y: number; m: number; d: number } => {
  const parts = String(nightId).split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new ValidationError(`invalid NightId: ${String(nightId)}`)
  }
  const [y, m, d] = parts as [number, number, number]
  return { y, m, d }
}

// 開店時刻: nightId が表す日の 22:00 JST = 13:00 UTC.
export const opensAtOf = (nightId: NightId): Date => {
  const { y, m, d } = parseNightId(nightId)
  return new Date(Date.UTC(y, m - 1, d, OPEN_HOUR - 9, 0, 0))
}

// 閉店時刻: nightId の翌日 05:00 JST = 20:00 UTC of nightId date.
export const closesAtOf = (nightId: NightId): Date => {
  const { y, m, d } = parseNightId(nightId)
  return new Date(Date.UTC(y, m - 1, d, CLOSE_HOUR + 24 - 9, 0, 0))
}

// 営業時間外の判定理由を返す（UI で文言を変える用）。
// 朝〜昼前（5:00-13:59 JST）: 直前の閉店からまだ近い -> after-close
// 昼過ぎ〜夜（14:00-21:59 JST）: 次の開店が近づく -> before-open
export const closedReason = (now: Date): 'before-open' | 'after-close' | null => {
  if (isOpen(now)) return null
  const h = toJst(now).getUTCHours()
  return h >= CLOSE_HOUR && h < 14 ? 'after-close' : 'before-open'
}
