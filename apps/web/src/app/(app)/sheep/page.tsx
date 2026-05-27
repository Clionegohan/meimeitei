// 客帳 (全体ユーザー一覧) — 機能未実装の placeholder。
// 後続 phase で listUsers use case + UI 実装予定。spec L44 S-c で採用。

export default function SheepPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div
        className="flex-1 min-w-0 overflow-hidden"
        style={{ padding: '40px 56px' }}
      >
        <div>
          <div
            style={{
              fontSize: 32,
              letterSpacing: '0.2em',
              color: '#ECE6D4',
              fontWeight: 300,
            }}
          >
            客 帳
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#5E5A4F',
              letterSpacing: '0.25em',
              marginTop: 6,
            }}
          >
            ここに来た 全ての羊の 帳面。
          </div>
        </div>

        <div
          className="flex items-center justify-center text-center"
          style={{ marginTop: 120 }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: '#9A9484',
                letterSpacing: '0.3em',
                lineHeight: 2.2,
              }}
            >
              ま だ お 客 様 を
              <br />
              お通しする 支度が ございません。
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#5E5A4F',
                letterSpacing: '0.2em',
                marginTop: 18,
                lineHeight: 1.8,
              }}
            >
              いま少し お待ちくださいませ。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
