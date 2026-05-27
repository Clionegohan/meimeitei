import { notFound } from 'next/navigation'
import { MoonSvg } from '../../(app)/_components/moon-svg'
import { toKanji } from '../../(app)/_components/kanji'
import {
  REPRESENTATIVE_PHASES,
  moonNameOf,
} from '../../(app)/_components/moon-name'

// 月相 SVG + 月相名 検証用 dev page。production では 404。
// 月齢の伝統名 16 種 (朔 / 二日月 / 三日月 / 上弦の月 / 十日夜の月 /
// 十三夜 / 小望月 / 望月 / 十六夜 / 立待月 / 居待月 / 寝待月 / 下弦の月 /
// 二十六夜 / 有明月 / 晦月) の代表 phase を grid 表示。
export default function DevMoonsPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="min-h-screen bg-[#080B12] text-[#ECE6D4] p-10">
      <h1 className="text-[28px] tracking-[0.25em] mb-2">月相 検証</h1>
      <p className="text-[12px] text-[#5E5A4F] tracking-[0.2em] mb-8">
        伝統名 16 種の代表 phase。dev only。
      </p>

      <div className="grid grid-cols-4 gap-8">
        {REPRESENTATIVE_PHASES.map(({ phase, age }) => {
          const name = moonNameOf(phase)
          return (
            <div
              key={age}
              className="flex flex-col items-center gap-3 border border-[#1F2533] bg-[#0C1018] py-6"
            >
              <div className="relative w-[140px] h-[140px] flex items-center justify-center">
                <MoonSvg size={120} phase={phase} glow={true} glowSize={1.3} />
              </div>
              <div className="text-center">
                <div
                  style={{
                    fontSize: 18,
                    color: '#ECE6D4',
                    letterSpacing: '0.15em',
                  }}
                >
                  {name}
                </div>
                <div
                  className="tabular-nums mt-2"
                  style={{
                    fontSize: 11,
                    color: '#9A9484',
                    letterSpacing: '0.15em',
                  }}
                >
                  月齢 {toKanji(Math.floor(age))} · phase {phase.toFixed(3)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <h2
        className="text-[20px] mt-16 mb-4"
        style={{ letterSpacing: '0.2em' }}
      >
        連続変化 (phase 0.00 → 0.95、0.05 刻み)
      </h2>
      <p className="text-[12px] text-[#5E5A4F] tracking-[0.2em] mb-8">
        moonNameOf の閾値判定が連続的に切り替わるかの確認用。
      </p>
      <div className="grid grid-cols-5 gap-6">
        {Array.from({ length: 20 }, (_, i) => Number((i * 0.05).toFixed(2))).map(
          (phase) => {
            const name = moonNameOf(phase)
            return (
              <div
                key={phase}
                className="flex flex-col items-center gap-2 border border-[#1F2533] bg-[#0C1018] py-4"
              >
                <MoonSvg size={80} phase={phase} glow={true} glowSize={1.3} />
                <div
                  className="text-center"
                  style={{
                    fontSize: 13,
                    color: '#D8D2C0',
                    letterSpacing: '0.1em',
                  }}
                >
                  {name}
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 10,
                    color: '#5E5A4F',
                    letterSpacing: '0.15em',
                  }}
                >
                  phase {phase.toFixed(2)}
                </div>
              </div>
            )
          },
        )}
      </div>
    </main>
  )
}
