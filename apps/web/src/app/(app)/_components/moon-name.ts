// 月相名 (伝統名 16 種)。phase → 月齢 → 名前 の閾値マッピング。
// 月齢 = phase * 29.5305882 (synodic month)。
//
// ピン (月齢 → 主な名前):
//   0     朔 (新月、月齢 0)
//   1     二日月、繊月 (月齢 1)
//   2-3   三日月 (月齢 2-3)
//   7     上弦の月、弓張月 (月齢 7)
//   10    十日夜の月 (月齢 9-10)
//   12    十三夜月 (月齢 12)
//   13    小望月、十四日月 (月齢 13)
//   14    望月、満月、十五夜 (月齢 14)
//   15    十六夜 (いざよい、月齢 15)
//   16    立待月 (月齢 16)
//   17    居待月 (月齢 17)
//   18    寝待月、臥待月 (月齢 18)
//   22    下弦の月、弓張月 (月齢 22)
//   25    二十六夜 (月齢 25)
//   28    有明月 (月齢 26-30 残月の総称)
//   29    晦月、三十日月 (月齢 29)

export const SYNODIC_DAYS = 29.5305882

type NameThreshold = { upTo: number; name: string }

// age が upTo 未満なら name。順番に評価。
const THRESHOLDS: readonly NameThreshold[] = [
  { upTo: 0.5, name: '朔' },
  { upTo: 1.5, name: '二日月' },
  { upTo: 5, name: '三日月' },
  { upTo: 8, name: '上弦の月' },
  { upTo: 10.5, name: '十日夜の月' },
  { upTo: 12.5, name: '十三夜' },
  { upTo: 13.5, name: '小望月' },
  { upTo: 15, name: '望月' },
  { upTo: 15.8, name: '十六夜' },
  { upTo: 16.5, name: '立待月' },
  { upTo: 17.5, name: '居待月' },
  { upTo: 20, name: '寝待月' },
  { upTo: 23, name: '下弦の月' },
  { upTo: 26, name: '二十六夜' },
  { upTo: 28.8, name: '有明月' },
  { upTo: 29.6, name: '晦月' },
] as const

export const moonAgeOf = (phase: number): number => phase * SYNODIC_DAYS

export const moonNameOf = (phase: number): string => {
  const age = moonAgeOf(phase)
  for (const t of THRESHOLDS) {
    if (age < t.upTo) return t.name
  }
  return '朔' // 周回末尾は朔に戻る
}

// /dev/moons で全種類を grid 表示するための代表ピン (16 種)。
// 各種類の中央付近の phase を逆算 (age → phase = age / SYNODIC)。
export const REPRESENTATIVE_PHASES: ReadonlyArray<{ phase: number; age: number }> = [
  0, 1, 3, 7, 10, 12, 13, 14, 15.3, 16, 17, 18, 22, 25, 28, 29.3,
].map((age) => ({ phase: age / SYNODIC_DAYS, age }))

// 「好きな月」(FavoriteMoon name) → phase の代表値。
// profile card 等で MoonSvg を描画する時の phase を引く。
const FAVORITE_MOON_TO_AGE: Record<string, number> = {
  朔: 0,
  二日月: 1,
  三日月: 3,
  上弦の月: 7,
  十日夜の月: 10,
  十三夜: 12,
  小望月: 13,
  望月: 14,
  十六夜: 15.3,
  立待月: 16,
  居待月: 17,
  寝待月: 18,
  下弦の月: 22,
  二十六夜: 25,
  有明月: 28,
  晦月: 29.3,
}

export const phaseOfFavoriteMoon = (name: string | null): number | null => {
  if (name === null) return null
  const age = FAVORITE_MOON_TO_AGE[name]
  if (age === undefined) return null
  return age / SYNODIC_DAYS
}
