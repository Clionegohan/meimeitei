// 月相 SVG。terminator (明暗境界) を楕円弧で描画する正攻法。
//
// phase 規約 (getMoonPhase と同じ): 0 = 新月、0.25 = 上弦、0.5 = 満月、0.75 = 下弦、1 = 新月。
//
// 構造:
//   1. glow (オプション)
//   2. 月本体 = 暗い disc (背景より少し明るい dark grey)
//   3. lit portion = path で「半円 + terminator 楕円弧」を結合したシルエット
//      lit side = 月の照らされる側 (waxing なら右、waning なら左)
//      terminator rx = |1 - 2*lit| * R → 半月で 0 (直線)、新月/満月付近で 32 (深い弧)
//   4. crater (lit portion の clip 内に薄く)
const PALETTE = {
  darkMoon: '#1F2533', // 月本体の影部分 (背景より一段明るい灰)
  moon: '#F2EAD1',
}

const R = 32 // 月本体半径 (viewBox 0-100、cx/cy = 50)
const TOP_Y = 50 - R // 18
const BOTTOM_Y = 50 + R // 82

const moonLitPath = (phase: number): string | null => {
  const lit = 1 - Math.abs(phase - 0.5) * 2 // 0 (new) ~ 1 (full)
  if (lit <= 0.01) return null // 新月: 何も描画しない
  if (lit >= 0.99) return 'CIRCLE' // 満月: 円全体

  const isWaxing = phase < 0.5
  // 月本体の lit side 半円
  // waxing は時計回りで右半円 (top → bottom 経由右側)、waning は反時計回りで左半円
  const semiSweep = isWaxing ? 1 : 0
  const semi = `M 50 ${TOP_Y} A ${R} ${R} 0 0 ${semiSweep} 50 ${BOTTOM_Y}`

  // terminator 楕円弧。rx = |1 - 2*lit| * R
  //   lit = 0.5 (半月) → rx = 0 → 直線
  //   lit → 0 or 1 → rx → R → 深い弧
  const rx = Math.abs(1 - 2 * lit) * R
  // sweepFlag:
  //   waxing crescent (lit<0.5, light=right): terminator が右に膨らむ (light 側に食い込む) → 戻り arc sweep=0
  //   waxing gibbous (lit>0.5, light=right): terminator が左に膨らむ (dark 側を侵食) → sweep=1
  //   waning gibbous (lit>0.5, light=left): terminator が右に膨らむ → sweep=0
  //   waning crescent (lit<0.5, light=left): terminator が左に膨らむ → sweep=1
  let termSweep: 0 | 1
  if (isWaxing) {
    termSweep = lit < 0.5 ? 0 : 1
  } else {
    termSweep = lit < 0.5 ? 1 : 0
  }
  const term = `A ${rx} ${R} 0 0 ${termSweep} 50 ${TOP_Y}`

  return `${semi} ${term} Z`
}

export function MoonSvg({
  size = 64,
  phase = 0.5,
  glow = true,
  glowSize = 1.6,
}: {
  size?: number
  phase?: number
  glow?: boolean
  glowSize?: number
}) {
  const id = `moon-${Math.round(phase * 1000)}-${size}`
  const litPath = moonLitPath(phase)

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <radialGradient id={`disc-${id}`} cx="42%" cy="38%">
          <stop offset="0%" stopColor="#FFFAEB" />
          <stop offset="55%" stopColor={PALETTE.moon} />
          <stop offset="100%" stopColor="#BFB59A" />
        </radialGradient>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0%" stopColor={PALETTE.moon} stopOpacity="0.5" />
          <stop offset="55%" stopColor={PALETTE.moon} stopOpacity="0.08" />
          <stop offset="100%" stopColor={PALETTE.moon} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <circle cx="50" cy="50" r={R} />
        </clipPath>
      </defs>

      {glow && (
        <circle cx="50" cy="50" r={50 * glowSize} fill={`url(#glow-${id})`} />
      )}

      {/* 月本体 (暗い側のベース、新月でも薄く存在を残す) */}
      <circle cx="50" cy="50" r={R} fill={PALETTE.darkMoon} />

      {/* 照らされた側 */}
      {litPath === 'CIRCLE' && (
        <circle cx="50" cy="50" r={R} fill={`url(#disc-${id})`} />
      )}
      {litPath !== null && litPath !== 'CIRCLE' && (
        <path d={litPath} fill={`url(#disc-${id})`} />
      )}

      {/* 月面のテクスチャ (crater / うさぎ模様) は一旦削除。disc gradient のみで
          ツルツルなクリーン月とする。後で再導入する場合はここに復活させる。 */}
    </svg>
  )
}
