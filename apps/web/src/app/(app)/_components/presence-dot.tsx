// アバター右下に重ねる在席マーク。
//  - online=true (在席): 灯色の明るい点 + glow
//  - online=false (不在・秘匿): 暗い点 (秘匿か不在かは区別せず、その区別自体も隠す)
// 親要素は position: relative かつ overflow を切らないこと。
export function PresenceDot({
  online,
  size = 12,
  borderColor = '#080B12',
}: {
  online: boolean
  size?: number
  borderColor?: string
}) {
  return (
    <span
      role="img"
      aria-label={online ? '在席' : '不在'}
      className="absolute rounded-full"
      style={{
        bottom: 0,
        right: 0,
        width: size,
        height: size,
        background: online ? '#B89B6E' : '#3A382F',
        border: `2px solid ${borderColor}`,
        boxShadow: online ? '0 0 6px #B89B6E' : 'none',
      }}
    />
  )
}
