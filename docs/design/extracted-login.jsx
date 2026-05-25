// web-login.jsx — 入店 (login) + 閉店中 (closed) for desktop
// v2 — 迷羊苑 rebrand + copy revisions + kanji numerals

// ─── Helper: convert digits to kanji numerals (for 0–99) ───────────────
const _kanjiDigits = ['〇','一','二','三','四','五','六','七','八','九'];
const toKanji = (n) => {
  n = Math.floor(n);
  if (n < 0) return '〇';
  if (n < 10) return _kanjiDigits[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + _kanjiDigits[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return _kanjiDigits[t] + '十' + (o ? _kanjiDigits[o] : '');
  }
  return String(n);
};
window.toKanji = toKanji;

// ═══════════════════════════════════════════════════════════════════════
// W_Entrance · 入店（合言葉）
// ═══════════════════════════════════════════════════════════════════════
const W_Entrance = () => (
  <DesktopFrame label="01 入店">
    {/* night sky — moon ambient only, no stars */}
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse 80% 60% at 50% 5%, #1A2235 0%, ${W_PALETTE.bg} 60%),
                   linear-gradient(180deg, ${W_PALETTE.bg} 0%, #060810 100%)`,
    }} />

    {/* gentle moonlight wash from above-center */}
    <div style={{
      position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
      width: 900, height: 900, borderRadius: '50%',
      background: `radial-gradient(circle, ${W_PALETTE.moonGlow} 0%, rgba(242,234,209,0.04) 40%, transparent 70%)`,
      pointerEvents: 'none',
    }} />

    {/* far away mountain silhouette */}
    <svg viewBox="0 0 1440 200" width="1440" height="200" preserveAspectRatio="none"
         style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.5 }}>
      <path d="M0,200 L0,140 L120,80 L260,130 L380,60 L520,120 L650,90 L780,140 L920,70 L1080,130 L1220,90 L1360,140 L1440,110 L1440,200 Z"
            fill="#0D1220" />
      <path d="M0,200 L0,170 L100,140 L230,165 L360,130 L490,160 L620,140 L760,170 L900,135 L1040,165 L1180,140 L1320,170 L1440,150 L1440,200 Z"
            fill="#08101C" />
    </svg>

    {/* ── Top bar ───────────────────────────────────────────────────── */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 64,
      padding: '0 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${W_PALETTE.hairline}`,
    }}>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 16, letterSpacing: '0.5em', color: W_PALETTE.textDim,
      }}>
        迷 羊 苑
      </div>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 11, letterSpacing: '0.45em', color: W_PALETTE.muted,
      }}>
        営業 二十二時 — 翌五時
      </div>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.textDim, letterSpacing: '0.2em',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: W_PALETTE.accent,
                       boxShadow: `0 0 8px ${W_PALETTE.accent}` }} />
        ただ今 営業中 · 二十三時 十二分
      </div>
    </div>

    {/* ── Side vertical labels ──────────────────────────────────────── */}
    <div style={{ position: 'absolute', top: 110, left: 56 }}>
      <VLabelW size={11} weight={300}>令和八年 神無月 廿五日</VLabelW>
    </div>
    <div style={{ position: 'absolute', top: 110, right: 56 }}>
      <VLabelW size={11} weight={300}>眠れぬ夜の 子羊たちの隠れ家</VLabelW>
    </div>

    {/* ── Center composition ────────────────────────────────────────── */}
    <div style={{
      position: 'absolute', inset: '120px 0 90px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Moon */}
      <div style={{ marginBottom: 28 }}>
        <Moon2 size={140} phase={0.78} glow={true} glowSize={2.4} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 88, letterSpacing: '0.32em',
        fontWeight: 300, color: W_PALETTE.text, lineHeight: 1,
        textShadow: `0 0 40px ${W_PALETTE.moonGlow}`,
      }}>
        迷羊苑
      </div>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 11, letterSpacing: '0.7em',
        color: W_PALETTE.textDim, marginTop: 20,
      }}>
        M E &nbsp;·&nbsp; M E &nbsp;·&nbsp; E N
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 36, fontFamily: W_FONT_MIN, fontSize: 14,
        color: W_PALETTE.textBody, letterSpacing: '0.2em', lineHeight: 2.2,
        textAlign: 'center', fontWeight: 300,
      }}>
        眠れぬ夜、ひとりではない、と<br />
        言葉だけで、確かめあう場所です。
      </div>

      {/* Sumi divider */}
      <div style={{ marginTop: 40, marginBottom: 28 }}>
        <SumiDivider width={320} />
      </div>

      {/* Passphrase form */}
      <div style={{ width: 360 }}>
        <div style={{
          fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
          letterSpacing: '0.4em', marginBottom: 10, textAlign: 'center',
        }}>
          合 言 葉
        </div>
        <div style={{
          height: 48, borderBottom: `1px solid ${W_PALETTE.hairlineLight}`,
          display: 'flex', alignItems: 'center', padding: '0 6px',
          fontFamily: W_FONT_MIN, fontSize: 18, color: W_PALETTE.text,
          letterSpacing: '0.6em', justifyContent: 'center',
          background: 'transparent',
        }}>
          ● ● ● ● ● ● ● ●<span style={{ animation: 'blink 1.1s steps(2) infinite', marginLeft: 4, color: W_PALETTE.accent }}>|</span>
        </div>
        <button style={{
          width: '100%', height: 52, marginTop: 28, border: `1px solid ${W_PALETTE.text}`,
          background: 'transparent', color: W_PALETTE.text, cursor: 'pointer',
          fontFamily: W_FONT_MIN, fontSize: 14, letterSpacing: '0.7em',
          fontWeight: 400,
        }}>
          暖簾をくぐる
        </button>
        <div style={{
          textAlign: 'center', marginTop: 22, fontSize: 11,
          fontFamily: W_FONT_MIN, color: W_PALETTE.textDim, letterSpacing: '0.2em',
        }}>
          はじめての方は&nbsp;
          <span style={{
            color: W_PALETTE.accent,
            borderBottom: `1px solid ${W_PALETTE.accent}`, paddingBottom: 2,
          }}>ご記帳ください</span>
        </div>
      </div>
    </div>

    {/* ── Footer ────────────────────────────────────────────────────── */}
    <div style={{
      position: 'absolute', bottom: 28, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', padding: '0 56px',
      fontSize: 10, color: W_PALETTE.muted, fontFamily: W_FONT_MIN, letterSpacing: '0.3em',
    }}>
      <span>© 迷羊苑 · 二十六年 神無月</span>
      <span>苑主 まで · お問合せ · 規則</span>
    </div>
  </DesktopFrame>
);

// ═══════════════════════════════════════════════════════════════════════
// W_Closed · 閉店中（昼間）
// ═══════════════════════════════════════════════════════════════════════
const W_Closed = () => (
  <DesktopFrame label="02 閉店中">
    {/* daytime — still dim, dawn-like */}
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(180deg, #1C2030 0%, ${W_PALETTE.bg} 65%, #060810 100%)`,
    }} />
    {/* hint of sun behind */}
    <div style={{
      position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
      width: 360, height: 360, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(242,234,209,0.06) 0%, transparent 70%)',
    }} />

    {/* Top bar */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 64,
      padding: '0 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${W_PALETTE.hairline}`,
    }}>
      <div style={{ fontFamily: W_FONT_MIN, fontSize: 16, letterSpacing: '0.5em', color: W_PALETTE.textDim }}>
        迷 羊 苑
      </div>
      <div style={{ fontFamily: W_FONT_MIN, fontSize: 11, letterSpacing: '0.45em', color: W_PALETTE.muted }}>
        営業 二十二時 — 翌五時
      </div>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.textDim, letterSpacing: '0.2em',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: W_PALETTE.muted }} />
        ただ今 閉店中 · 十四時 二十三分
      </div>
    </div>

    {/* ── Center: large noren-like sign ─────────────────────────────── */}
    <div style={{
      position: 'absolute', inset: '120px 0 60px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Crescent moon — faded for day */}
      <div style={{ opacity: 0.35, marginBottom: 36 }}>
        <Moon2 size={88} phase={0.3} glow={false} />
      </div>

      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 18, letterSpacing: '0.4em',
        color: W_PALETTE.textDim, marginBottom: 24,
      }}>
        ただ今、準備中
      </div>

      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 128, letterSpacing: '0.32em',
        fontWeight: 300, color: W_PALETTE.text, lineHeight: 1,
      }}>
        閉 店
      </div>

      <div style={{ marginTop: 44 }}>
        <SumiDivider width={420} />
      </div>

      <div style={{
        marginTop: 36, fontFamily: W_FONT_MIN, fontSize: 15, color: W_PALETTE.textBody,
        letterSpacing: '0.18em', lineHeight: 2.2, textAlign: 'center', fontWeight: 300,
      }}>
        日が沈む頃、暖簾を出します。<br />
        月の昇る刻、またここでお会いしましょう。
      </div>

      {/* Countdown — all kanji numerals */}
      <div style={{
        marginTop: 56, padding: '24px 48px',
        border: `1px solid ${W_PALETTE.hairlineLight}`,
        background: 'rgba(15,19,28,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'baseline', gap: 28,
      }}>
        <span style={{
          fontFamily: W_FONT_MIN, fontSize: 11, letterSpacing: '0.4em', color: W_PALETTE.muted,
        }}>
          開 店 ま で
        </span>
        <span style={{
          fontFamily: W_FONT_MIN, fontSize: 34, fontWeight: 300,
          color: W_PALETTE.text, letterSpacing: '0.08em',
        }}>
          七<span style={{ fontSize: 14, opacity: 0.6, margin: '0 4px', letterSpacing: '0.2em' }}>時間</span>
          三十七<span style={{ fontSize: 14, opacity: 0.6, margin: '0 4px', letterSpacing: '0.2em' }}>分</span>
          十二<span style={{ fontSize: 14, opacity: 0.6, margin: '0 4px', letterSpacing: '0.2em' }}>秒</span>
        </span>
      </div>
    </div>

    {/* Footer */}
    <div style={{
      position: 'absolute', bottom: 28, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: 28,
      fontSize: 10, color: W_PALETTE.muted, fontFamily: W_FONT_MIN, letterSpacing: '0.3em',
    }}>
      <span>本日の予報 · 晴れのち月夜</span>
      <span>·</span>
      <span>苑主 まで</span>
      <span>·</span>
      <span>規則</span>
    </div>
  </DesktopFrame>
);

Object.assign(window, { W_Entrance, W_Closed });
