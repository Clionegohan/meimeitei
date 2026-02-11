/**
 * 営業時間判定 (22:00-04:00 JST)
 *
 * @returns 営業中なら true、営業時間外なら false
 */
export function isOpen(): boolean {
  // テスト環境では営業時間チェックをバイパス
  if (process.env.SKIP_BUSINESS_HOURS_CHECK === 'true') {
    return true
  }

  // テスト用: 時刻をオーバーライド可能にする
  // 例: TEST_JST_HOUR=23 で常に23時として扱う
  const testHour = process.env.TEST_JST_HOUR
  if (testHour !== undefined) {
    const parsedHour = parseInt(testHour, 10)
    if (!Number.isFinite(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      throw new Error(
        `Invalid TEST_JST_HOUR: "${testHour}". Must be a number between 0-23.`,
      )
    }
    return parsedHour >= 22 || parsedHour < 4
  }

  const jstHour = getJSTHour(new Date())

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
