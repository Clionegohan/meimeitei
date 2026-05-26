// 月相 SVG。design HTML の Moon2 component を踏襲。
// phase: 0 (new moon, fully dark) → 0.5 (full) → 1 (new again)。
// 影 disc を offset させて満ち欠けを近似する simple な実装。
const PALETTE = {
  bg: '#080B12',
  moon: '#F2EAD1',
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
          <circle cx="50" cy="50" r="32" />
        </clipPath>
      </defs>
      {glow && <circle cx="50" cy="50" r={50 * glowSize} fill={`url(#glow-${id})`} />}
      <circle cx="50" cy="50" r="32" fill={`url(#disc-${id})`} />
      {phase < 0.95 && (
        <g clipPath={`url(#clip-${id})`}>
          <ellipse
            cx={50 - (1 - phase * 2) * 28}
            cy="50"
            rx="32"
            ry="32"
            fill={PALETTE.bg}
            opacity="0.96"
          />
        </g>
      )}
      <g opacity="0.4">
        <circle cx="42" cy="44" r="2.4" fill="#B5AB8C" />
        <circle cx="58" cy="52" r="1.6" fill="#B5AB8C" />
        <circle cx="49" cy="59" r="2.0" fill="#B5AB8C" />
        <circle cx="55" cy="40" r="1.2" fill="#B5AB8C" />
      </g>
    </svg>
  )
}
