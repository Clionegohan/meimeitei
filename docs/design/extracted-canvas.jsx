// web-canvas.jsx — assembles Web/desktop screens

const App = () => (
  <DesignCanvas
    title="迷羊苑 · Web版 — 月夜の墨"
    subtitle="デスクトップ 1440×900。入店（合言葉）／閉店中／軒先（タイムライン）／文（DM）／己（プロフィール）の5画面。"
  >
    <DCSection
      id="atmospheric"
      title="入口の世界"
      subtitle="店の前に立つ瞬間。営業時間内かどうかで、見える景色が変わります。"
    >
      <DCArtboard id="entrance" label="01 · 入店 — 合言葉" width={1440} height={900}>
        <W_Entrance />
      </DCArtboard>
      <DCArtboard id="closed" label="02 · 閉店中（昼間）" width={1440} height={900}>
        <W_Closed />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="inside"
      title="店のなか"
      subtitle="サイドナビは漢字＋小さなアイコン。右の脇には、今宵の月・灯ともる羊・お席のご案内。"
    >
      <DCArtboard id="timeline" label="03 · 軒先 — タイムライン" width={1440} height={900}>
        <W_Timeline />
      </DCArtboard>
      <DCArtboard id="dm" label="04 · 文 — DM" width={1440} height={900}>
        <W_DM />
      </DCArtboard>
      <DCArtboard id="profile" label="05 · 己 — プロフィール" width={1440} height={900}>
        <W_Profile />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
