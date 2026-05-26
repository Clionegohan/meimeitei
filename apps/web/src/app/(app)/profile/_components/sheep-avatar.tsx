// Simplified avatar — design HTML uses a hand-drawn SVG SheepBrush;
// in MVPα we render a circle with the tone color and a kanji glyph.
export function SheepAvatar({ tone, size = 96 }: { tone: string; size?: number }) {
  return (
    <div
      className="rounded-full border border-[#2A3142] flex items-center justify-center"
      style={{ width: size, height: size, backgroundColor: tone }}
      aria-hidden
    >
      <span className="text-[#080B12] text-lg tracking-wider">羊</span>
    </div>
  )
}
