// SheepBrush 風の墨絵調アバター。design HTML（docs/design/extracted-shared.jsx）
// の SheepBrush component を踏襲。tone でウールの色を変える。
const INK = '#050810'

export function SheepAvatar({
  tone,
  size = 96,
  accent = INK,
}: {
  tone: string
  size?: number
  accent?: string
}) {
  const filterId = `brush-${size}-${tone.replace('#', '')}`
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="0.6" />
        </filter>
      </defs>
      <g fill={tone} filter={`url(#${filterId})`}>
        <ellipse cx="32" cy="36" rx="18" ry="12" />
        <circle cx="22" cy="30" r="7.5" />
        <circle cx="32" cy="26" r="8.5" />
        <circle cx="42" cy="30" r="7.5" />
        <circle cx="24" cy="44" r="6.5" />
        <circle cx="40" cy="44" r="6.5" />
      </g>
      <ellipse cx="32" cy="22" rx="6" ry="7" fill={accent} />
      <ellipse
        cx="26"
        cy="18"
        rx="2.4"
        ry="3.4"
        fill={accent}
        transform="rotate(-25 26 18)"
      />
      <ellipse
        cx="38"
        cy="18"
        rx="2.4"
        ry="3.4"
        fill={accent}
        transform="rotate(25 38 18)"
      />
      <circle cx="32" cy="22" r="1.2" fill={tone} />
      <rect x="24" y="48" width="1.8" height="4" fill={accent} />
      <rect x="38.2" y="48" width="1.8" height="4" fill={accent} />
    </svg>
  )
}
