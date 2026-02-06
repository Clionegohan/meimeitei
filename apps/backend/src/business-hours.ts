/**
 * 営業時間判定 (22:00-04:00 JST)
 *
 * @returns 営業中なら true、営業時間外なら false
 */
export function isOpen(): boolean {
  const now = new Date()
  const jstHour = getJSTHour(now)

  // 22:00 <= hour < 24:00 または 0:00 <= hour < 4:00
  return jstHour >= 22 || jstHour < 4
}

/**
 * UTC時刻をJST時刻に変換して時(hour)を取得
 */
function getJSTHour(date: Date): number {
  // UTC+9 = JST
  const utcHour = date.getUTCHours()
  const jstHour = (utcHour + 9) % 24
  return jstHour
}
