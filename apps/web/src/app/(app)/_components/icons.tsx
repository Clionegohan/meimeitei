// design HTML (docs/design/extracted-shared.jsx) 由来の SVG icon 群。
// sidebar のメニュー（軒先 / 手紙 / 羊 / 己 / お品書き）で使う。

type IconProps = { size?: number; color?: string }

export const NorenIcon = ({ size = 22, color = '#ECE6D4' }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <rect x="3" y="3" width="18" height="1.4" fill={color} />
    <path d="M4 4.5 L4 17 Q5.5 18.5 7 17 L7 4.5 Z" fill={color} />
    <path d="M9 4.5 L9 18 Q10.5 19.5 12 18 Q13.5 19.5 15 18 L15 4.5 Z" fill={color} />
    <path d="M17 4.5 L17 17 Q18.5 18.5 20 17 L20 4.5 Z" fill={color} />
  </svg>
)

export const FumiIcon = ({ size = 22, color = '#ECE6D4' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16v12H4z" />
    <path d="M4 6l8 6 8-6" />
    <path d="M4 18l5-5" />
    <path d="M20 18l-5-5" />
  </svg>
)

export const SheepIcon = ({ size = 22, color = '#ECE6D4' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="11" r="3" />
    <circle cx="12" cy="9.5" r="3.2" />
    <circle cx="16" cy="11" r="3" />
    <circle cx="10" cy="14" r="2.8" />
    <circle cx="14" cy="14" r="2.8" />
    <ellipse cx="12" cy="7.5" rx="2" ry="2.4" fill={color} />
    <circle cx="12" cy="7.5" r="0.5" fill="#080B12" stroke="none" />
    <line x1="9" y1="18" x2="9" y2="20" />
    <line x1="15" y1="18" x2="15" y2="20" />
  </svg>
)

export const MoonIcon = ({ size = 22, color = '#ECE6D4' }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path
      d="M17 12.5 a6.5 6.5 0 1 1 -5.7 -6.45 a5 5 0 0 0 5.7 6.45z"
      fill={color}
    />
  </svg>
)

export const FudaIcon = ({ size = 22, color = '#ECE6D4' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.3"
    strokeLinejoin="round"
  >
    <path d="M12 3 L7 7 L7 21 L17 21 L17 7 Z" />
    <line x1="12" y1="3" x2="12" y2="5" />
    <circle cx="12" cy="11" r="1" fill={color} stroke="none" />
    <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
    <line x1="9.5" y1="17" x2="14.5" y2="17" />
  </svg>
)
