// web-profile.jsx — 己 (profile / your seat)
// v2 — kanji nums, no @handle, replace heatmap with 在席の刻 chart + add 親しい羊

const W_Profile = () => (
  <DesktopFrame label="05 己">
    <TopBar section="己" sectionRomaji="ONORE" />
    <Sidebar active="onore" />

    {/* ── Right rail ────────────────────────────────────────────────── */}
    <div style={{
      width: 340, position: 'absolute', top: 64, right: 0, bottom: 0,
      borderLeft: `1px solid ${W_PALETTE.hairline}`,
      background: W_PALETTE.bgSoft,
      padding: '32px 28px', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.muted,
        letterSpacing: '0.35em', marginBottom: 18,
      }}>
        来 店 帳
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { l: '入店した夜', v: '142', u: '夜' },
          { l: '連続来店',   v: '7',   u: '夜' },
          { l: '置いた文',   v: '318', u: '通' },
          { l: '寄せられた燭', v: '892', u: '本' },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            paddingBottom: 12, borderBottom: `1px dotted ${W_PALETTE.hairline}`,
          }}>
            <span style={{
              fontFamily: W_FONT_MIN, fontSize: 12, color: W_PALETTE.textDim, letterSpacing: '0.2em',
            }}>{s.l}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontFamily: W_FONT_MIN, fontSize: 24, color: W_PALETTE.text,
                fontVariantNumeric: 'tabular-nums', fontWeight: 300, letterSpacing: '0.02em',
              }}>{s.v}</span>
              <span style={{
                fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.25em',
              }}>{s.u}</span>
            </span>
          </div>
        ))}
      </div>

      {/* ── 在席の刻 (hourly chart, 22h–5h) ─────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14,
        }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.muted,
            letterSpacing: '0.35em',
          }}>
            在 席 の 刻
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.15em',
          }}>
            この三十日
          </div>
        </div>

        {/* Bars: 22h, 23h, 0, 1, 2, 3, 4, 5 */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 6, height: 88,
          padding: '0 2px',
        }}>
          {[
            { h: '廿二', v: 0.28 },
            { h: '廿三', v: 0.52 },
            { h: '〇',   v: 0.78 },
            { h: '一',   v: 0.88 },
            { h: '二',   v: 1.00, peak: true },
            { h: '三',   v: 0.72 },
            { h: '四',   v: 0.38 },
            { h: '五',   v: 0.16 },
          ].map((b, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4,
            }}>
              <div style={{
                width: '100%',
                height: `${b.v * 100}%`,
                background: b.peak
                  ? `linear-gradient(180deg, ${W_PALETTE.accent} 0%, ${W_PALETTE.accentDim} 100%)`
                  : `linear-gradient(180deg, ${W_PALETTE.accentDim} 0%, rgba(122,103,73,0.4) 100%)`,
                opacity: b.peak ? 1 : 0.75,
                borderTop: b.peak ? `1px solid ${W_PALETTE.moon}` : 'none',
                boxShadow: b.peak ? `0 0 8px ${W_PALETTE.accent}40` : 'none',
              }} />
            </div>
          ))}
        </div>

        {/* Hour labels */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 6, padding: '0 2px',
        }}>
          {['廿二','廿三','〇','一','二','三','四','五'].map((h, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', fontFamily: W_FONT_MIN, fontSize: 9,
              color: i === 4 ? W_PALETTE.accent : W_PALETTE.muted,
              letterSpacing: '0.05em',
            }}>{h}</div>
          ))}
        </div>

        <div style={{
          marginTop: 14, fontFamily: W_FONT_MIN, fontSize: 10,
          color: W_PALETTE.textDim, letterSpacing: '0.15em', lineHeight: 1.8,
        }}>
          よく在席されるのは&nbsp;
          <span style={{ color: W_PALETTE.accent }}>丑三つ時</span>&nbsp;あたり。
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
        <button style={{
          width: '100%', height: 42, border: `1px solid ${W_PALETTE.hairlineLight}`,
          background: 'transparent', color: W_PALETTE.textDim, cursor: 'pointer',
          fontFamily: W_FONT_MIN, fontSize: 12, letterSpacing: '0.3em',
        }}>
          退店する
        </button>
      </div>
    </div>

    {/* ── Main ───────────────────────────────────────────────────────── */}
    <div style={{
      position: 'absolute', top: 64, left: 240, right: 340, bottom: 0,
      overflow: 'hidden', padding: '40px 56px',
    }}>
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 32, letterSpacing: '0.2em',
            color: W_PALETTE.text, fontWeight: 300,
          }}>
            あなたの席
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.muted,
            letterSpacing: '0.25em', marginTop: 6,
          }}>
            お席のしつらえと、ご自身のお話。
          </div>
        </div>
        <button style={{
          height: 36, padding: '0 22px', border: `1px solid ${W_PALETTE.hairlineLight}`,
          background: 'transparent', color: W_PALETTE.text, cursor: 'pointer',
          fontFamily: W_FONT_MIN, fontSize: 12, letterSpacing: '0.3em',
        }}>
          整える
        </button>
      </div>

      <div style={{ marginTop: 28 }}>
        <SumiDivider width={760} opacity={0.5} />
      </div>

      {/* Profile card */}
      <div style={{
        marginTop: 28, padding: '32px 36px',
        background: W_PALETTE.surface, border: `1px solid ${W_PALETTE.hairline}`,
        display: 'flex', gap: 36, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, opacity: 0.4 }}>
          <Moon2 size={180} phase={0.78} glow={true} glowSize={1.4} />
        </div>

        {/* Avatar with hanko */}
        <div style={{ flexShrink: 0, position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 132, height: 132, borderRadius: '50%',
            background: W_PALETTE.elevated, border: `1px solid ${W_PALETTE.hairlineLight}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <SheepBrush size={124} tone="#E8E2D2" accent={W_PALETTE.ink} />
          </div>
          <div style={{
            position: 'absolute', bottom: -4, right: -4, transform: 'rotate(8deg)',
          }}>
            <Hanko size={42} ch="迷" />
          </div>
        </div>

        {/* Info — nickname only, no @handle */}
        <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{
              fontFamily: W_FONT_MIN, fontSize: 34, color: W_PALETTE.text,
              letterSpacing: '0.12em', fontWeight: 400,
            }}>
              夜更けの羊
            </span>
          </div>

          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.accent,
            letterSpacing: '0.3em', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: W_PALETTE.accent,
              boxShadow: `0 0 6px ${W_PALETTE.accent}`,
            }} />
            灯ともる · 今宵 在席
          </div>

          <div style={{
            fontFamily: W_FONT, fontSize: 14, color: W_PALETTE.textBody,
            letterSpacing: '0.04em', lineHeight: 2, maxWidth: 480,
          }}>
            夜の三時頃、ふと目が覚めて、暗い天井を見ていることが多いです。<br />
            ほうじ茶と、文庫本と、月を眺めるのが好きです。<br />
            よろしくお願いいたします。
          </div>

          <div style={{
            marginTop: 24, paddingTop: 18, borderTop: `1px solid ${W_PALETTE.hairline}`,
            display: 'flex', gap: 36,
          }}>
            {[
              { l: '入店初日', v: '二十五年 葉月 三日' },
              { l: '好きな時刻', v: '丑三つ時' },
              { l: 'よく置く文', v: '独り言' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.25em' }}>
                  {m.l}
                </div>
                <div style={{ fontFamily: W_FONT_MIN, fontSize: 14, color: W_PALETTE.text, marginTop: 4, letterSpacing: '0.06em' }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 今宵のしるし ───────────────────────────────────────── */}
      <div style={{ marginTop: 28, display: 'flex', gap: 40 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 14, color: W_PALETTE.text,
            letterSpacing: '0.25em', marginBottom: 14,
          }}>
            今 宵 の し る し
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
            letterSpacing: '0.15em', marginBottom: 14, lineHeight: 1.8,
          }}>
            同じしるしを掲げる羊と、ふと出会えます。
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { l: '眠れない',     active: true },
              { l: '読書中',       active: false },
              { l: 'お茶を一杯',   active: false },
              { l: '月を眺める',   active: false },
              { l: '何でもない',   active: false },
              { l: '声を聞きたい', active: false },
              { l: 'しりとり',     active: false },
              { l: '夜更かし',     active: false },
            ].map((m, i) => (
              <span key={i} style={{
                padding: '8px 18px',
                border: `1px solid ${m.active ? W_PALETTE.accent : W_PALETTE.hairlineLight}`,
                background: m.active ? 'rgba(184,155,110,0.08)' : 'transparent',
                color: m.active ? W_PALETTE.text : W_PALETTE.textDim,
                fontFamily: W_FONT_MIN, fontSize: 12, letterSpacing: '0.2em',
                cursor: 'pointer',
              }}>{m.l}</span>
            ))}
          </div>
        </div>

        {/* ── 親しい羊 ────────────────────────────────────────── */}
        <div style={{ width: 280 }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 14, color: W_PALETTE.text,
            letterSpacing: '0.25em', marginBottom: 14,
          }}>
            親 し い 羊
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
            letterSpacing: '0.15em', marginBottom: 14, lineHeight: 1.8,
          }}>
            よく文をやり取りする羊たち。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { handle: '月見羊',   tone: '#E8E2D2', meta: '四十二夜目', lit: true },
              { handle: '茶の羊',   tone: '#D8B890', meta: '十八夜目',   lit: true },
              { handle: '読書羊',   tone: '#B8A480', meta: '九夜目',     lit: false },
            ].map((u, i) => (
              <div key={i} style={{
                padding: '10px 14px', border: `1px solid ${W_PALETTE.hairline}`,
                background: W_PALETTE.surface,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
                <div style={{ position: 'relative' }}>
                  <SheepBrush size={32} tone={u.tone} accent={W_PALETTE.ink} />
                  {u.lit && (
                    <span style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 8, height: 8, borderRadius: '50%', background: W_PALETTE.accent,
                      border: `2px solid ${W_PALETTE.surface}`, boxShadow: `0 0 4px ${W_PALETTE.accent}`,
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: W_FONT_MIN, fontSize: 13, color: W_PALETTE.text, letterSpacing: '0.06em',
                  }}>{u.handle}</div>
                  <div style={{
                    fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
                    letterSpacing: '0.15em', marginTop: 2,
                  }}>個室 · {u.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </DesktopFrame>
);

Object.assign(window, { W_Profile });
