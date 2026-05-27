// 朱印 SVG。design HTML (docs/design/extracted-shared.jsx) の Hanko を移植。
// 文字入り角印、worn edge 効果あり。8 度ほど傾けて使うのが標準。
type HankoProps = {
  size?: number
  ch?: string
  color?: string
}

export const Hanko = ({
  size = 36,
  ch = '羊',
  color = '#A85040',
}: HankoProps) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <rect x="2" y="2" width="44" height="44" fill={color} opacity="0.92" rx="2" />
    <text
      x="24"
      y="33"
      fontSize="26"
      fill="#F2EAD1"
      textAnchor="middle"
      fontFamily='"Shippori Mincho", "Noto Serif JP", serif'
      fontWeight="600"
    >
      {ch}
    </text>
    {/* worn edges */}
    <rect
      x="2"
      y="2"
      width="44"
      height="44"
      fill="none"
      stroke="#080B12"
      strokeWidth="0.5"
      opacity="0.3"
      rx="2"
    />
  </svg>
)
