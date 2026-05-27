// お品書き (設定 / 規則) — 機能未実装の placeholder。
// 後続 phase で設定項目 (presence visibility、通知、ブロック一覧管理、規則閲覧) を追加予定。

export default function SettingsPage() {
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
            お 品 書 き
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#5E5A4F',
              letterSpacing: '0.25em',
              marginTop: 6,
            }}
          >
            お席の作法、ご利用の規則。
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
              お 品 書 き を
              <br />
              ただ今 整え中で ございます。
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
