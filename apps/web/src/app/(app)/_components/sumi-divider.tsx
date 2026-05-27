// design HTML (docs/design/extracted-shared.jsx) 由来の墨流し区切り線。
// 上 path = 緩やかな波 (Q カーブ二回)、下 path = 点線で「掠れ」を演出。
type SumiDividerProps = {
  width?: number
  color?: string
  opacity?: number
}

export const SumiDivider = ({
  width = 600,
  color = '#1F2533',
  opacity = 0.6,
}: SumiDividerProps) => (
  <svg
    viewBox={`0 0 ${width} 8`}
    width={width}
    height={8}
    style={{ opacity, display: 'block' }}
    preserveAspectRatio="none"
  >
    <path
      d={`M0,4 Q${width * 0.2},2 ${width * 0.5},4 T${width},4`}
      stroke={color}
      strokeWidth="0.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d={`M${width * 0.15},5 L${width * 0.85},5`}
      stroke={color}
      strokeWidth="0.4"
      fill="none"
      strokeDasharray="1 4"
    />
  </svg>
)
