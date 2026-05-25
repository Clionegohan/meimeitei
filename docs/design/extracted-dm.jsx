// web-dm.jsx — 手紙 (DM) for desktop
// v2 — rename 文→手紙, persistent across nights, no @handle

// ─── DM list panel ───────────────────────────────────────────────────────

const DMListPanel = () => (
  <div style={{
    width: 320, position: 'absolute', top: 64, left: 240, bottom: 0,
    borderRight: `1px solid ${W_PALETTE.hairline}`,
    background: W_PALETTE.bgSoft,
    display: 'flex', flexDirection: 'column',
  }}>
    {/* Header */}
    <div style={{
      padding: '24px 24px 18px', borderBottom: `1px solid ${W_PALETTE.hairline}`,
    }}>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 22, letterSpacing: '0.18em',
        color: W_PALETTE.text, fontWeight: 300, marginBottom: 4,
      }}>
        手紙 · 個室一覧
      </div>
      <div style={{
        fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
        letterSpacing: '0.25em',
      }}>
        TEGAMI · PRIVATE ROOMS
      </div>

      {/* Search */}
      <div style={{
        marginTop: 16, height: 36, background: W_PALETTE.surface,
        border: `1px solid ${W_PALETTE.hairline}`,
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={W_PALETTE.muted} strokeWidth="1.5">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16" y2="16" strokeLinecap="round" />
        </svg>
        <span style={{
          fontFamily: W_FONT_MIN, fontSize: 12, color: W_PALETTE.muted, letterSpacing: '0.1em',
        }}>
          羊を探す…
        </span>
      </div>

      {/* Filter pills */}
      <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
        {[
          { l: '全て', active: true },
          { l: '灯ともる', active: false, dot: true },
          { l: '未読', active: false },
        ].map((t, i) => (
          <span key={i} style={{
            padding: '4px 10px', fontFamily: W_FONT_MIN, fontSize: 11, letterSpacing: '0.15em',
            color: t.active ? W_PALETTE.text : W_PALETTE.muted,
            border: `1px solid ${t.active ? W_PALETTE.hairlineLight : W_PALETTE.hairline}`,
            background: t.active ? W_PALETTE.elevated : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {t.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: W_PALETTE.accent }} />}
            {t.l}
          </span>
        ))}
      </div>
    </div>

    {/* Section labels */}
    <div style={{
      padding: '14px 24px 8px', fontFamily: W_FONT_MIN, fontSize: 10,
      color: W_PALETTE.muted, letterSpacing: '0.35em',
    }}>
      今 宵 · 灯 と も る
    </div>

    {/* List */}
    <div style={{ flex: 1, overflow: 'hidden' }}>
      {W_DM_LIST.map((u, i) => {
        // Group break — first non-lit
        const showDivider = i > 0 && W_DM_LIST[i - 1].lit && !u.lit;
        return (
          <React.Fragment key={i}>
            {showDivider && (
              <div style={{
                padding: '14px 24px 8px', fontFamily: W_FONT_MIN, fontSize: 10,
                color: W_PALETTE.muted, letterSpacing: '0.35em',
              }}>
                既 に お や す み
              </div>
            )}
            <div style={{
              padding: '14px 24px',
              background: u.active ? 'rgba(184,155,110,0.05)' : 'transparent',
              borderLeft: `2px solid ${u.active ? W_PALETTE.accent : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              opacity: u.lit ? 1 : 0.55,
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: W_PALETTE.surface, border: `1px solid ${W_PALETTE.hairline}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <SheepBrush size={38} tone={u.tone} accent={W_PALETTE.ink} />
                </div>
                {u.lit && (
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 9, height: 9, borderRadius: '50%', background: W_PALETTE.accent,
                    border: `2px solid ${W_PALETTE.bgSoft}`,
                    boxShadow: `0 0 4px ${W_PALETTE.accent}`,
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontFamily: W_FONT_MIN, fontSize: 14, color: W_PALETTE.text, letterSpacing: '0.05em',
                  }}>{u.handle}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, color: W_PALETTE.muted,
                    fontFamily: W_FONT_MIN, letterSpacing: '0.1em',
                  }}>{u.time}</span>
                </div>
                <div style={{
                  fontSize: 11, color: W_PALETTE.textDim, marginTop: 4, lineHeight: 1.5,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '0.04em',
                }}>
                  {u.preview}
                </div>
              </div>
              {u.unread > 0 && (
                <div style={{
                  minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                  background: W_PALETTE.vermilion, color: '#F2EAD1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontFamily: W_FONT_MIN, fontWeight: 500,
                  boxShadow: `0 0 6px ${W_PALETTE.vermilion}40`,
                }}>{u.unread}</div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// ─── Thread panel ────────────────────────────────────────────────────────

const W_DM_THREAD = [
  { from: 'them', time: '02:12', body: 'お久しぶりです。' },
  { from: 'them', time: '02:12', body: '眠れない夜が、続いていますね。' },
  { from: 'me',   time: '02:14', body: 'ええ。今夜もまた、ここに来てしまいました。' },
  { from: 'them', time: '02:15', body: '私も同じです。' },
  { from: 'me',   time: '02:18', body: 'お茶でも、文字越しに。\nほうじ茶を淹れています。' },
  { from: 'them', time: '02:19', body: 'いい香りがしそうです。' },
  { from: 'them', time: '02:20', body: 'こちらは、温めた牛乳を一杯。\n蜂蜜をひとさじ落として、ゆっくり混ぜています。' },
  { from: 'me',   time: '02:22', body: 'それは、しあわせの匂いです。' },
];

const ThreadPanel = () => {
  const partner = W_DM_LIST.find((u) => u.active);
  return (
    <div style={{
      position: 'absolute', top: 64, left: 560, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      background: W_PALETTE.bg,
    }}>
      {/* Header */}
      <div style={{
        height: 78, padding: '0 40px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: `1px solid ${W_PALETTE.hairline}`,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: W_PALETTE.surface, border: `1px solid ${W_PALETTE.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <SheepBrush size={44} tone={partner.tone} accent={W_PALETTE.ink} />
          </div>
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: '50%', background: W_PALETTE.accent,
            border: `2px solid ${W_PALETTE.bg}`, boxShadow: `0 0 6px ${W_PALETTE.accent}`,
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 18, color: W_PALETTE.text, letterSpacing: '0.1em',
          }}>
            {partner.handle}
          </div>
          <div style={{
            fontSize: 11, marginTop: 4, letterSpacing: '0.15em',
            fontFamily: W_FONT_MIN, color: W_PALETTE.accent,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: W_PALETTE.accent,
              boxShadow: `0 0 6px ${W_PALETTE.accent}`,
            }} />
            灯ともる · 起きています
          </div>
        </div>
        {/* Right side actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[
            { svg: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> },
            { svg: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16" y2="16"/></> },
            { svg: <><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></> },
          ].map((ic, i) => (
            <button key={i} style={{
              width: 34, height: 34, border: `1px solid ${W_PALETTE.hairline}`,
              background: 'transparent', color: W_PALETTE.textDim, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                {ic.svg}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-banner: room mood */}
      <div style={{
        padding: '10px 40px', background: W_PALETTE.bgSoft,
        borderBottom: `1px solid ${W_PALETTE.hairline}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.textDim, letterSpacing: '0.2em',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ color: W_PALETTE.accent }}>個室「月見の間」</span>
          <span style={{ color: W_PALETTE.faint }}>·</span>
          <span>二人だけの卓。夜を跨いでも、文字は残ります。</span>
        </div>
        <div style={{
          fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.25em',
        }}>
          四十二夜目 · お席
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: 'hidden', padding: '24px 80px 16px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {/* Date divider */}
        <div style={{
          textAlign: 'center', padding: '8px 0 16px',
          display: 'flex', alignItems: 'center', gap: 16, color: W_PALETTE.muted,
        }}>
          <div style={{ flex: 1, height: 1, background: W_PALETTE.hairline }} />
          <span style={{
            fontFamily: W_FONT_MIN, fontSize: 11, letterSpacing: '0.4em',
          }}>
            子 の 刻 · 二十六年 神無月 廿五日
          </span>
          <div style={{ flex: 1, height: 1, background: W_PALETTE.hairline }} />
        </div>

        {W_DM_THREAD.map((m, i) => {
          const mine = m.from === 'me';
          const prevSame = i > 0 && W_DM_THREAD[i - 1].from === m.from;
          const nextSame = i < W_DM_THREAD.length - 1 && W_DM_THREAD[i + 1].from === m.from;
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
              gap: 12, marginTop: prevSame ? 4 : 12,
            }}>
              {!mine && !prevSame && (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: W_PALETTE.surface, border: `1px solid ${W_PALETTE.hairline}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <SheepBrush size={30} tone={partner.tone} accent={W_PALETTE.ink} />
                </div>
              )}
              {!mine && prevSame && <div style={{ width: 34, flexShrink: 0 }} />}

              <div style={{
                maxWidth: '60%',
                display: 'flex', flexDirection: 'column',
                alignItems: mine ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: mine ? W_PALETTE.bubbleMe : W_PALETTE.surface,
                  border: `1px solid ${mine ? 'transparent' : W_PALETTE.hairline}`,
                  color: W_PALETTE.text,
                  fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-line',
                  fontFamily: W_FONT, letterSpacing: '0.04em',
                  borderRadius: mine
                    ? (prevSame && nextSame) ? '12px 4px 4px 12px'
                    : prevSame ? '12px 4px 12px 12px'
                    : nextSame ? '12px 12px 4px 12px'
                    : '12px 12px 4px 12px'
                    : (prevSame && nextSame) ? '4px 12px 12px 4px'
                    : prevSame ? '4px 12px 12px 12px'
                    : nextSame ? '12px 12px 12px 4px'
                    : '12px 12px 12px 4px',
                }}>
                  {m.body}
                </div>
                {!nextSame && (
                  <div style={{
                    marginTop: 4, fontSize: 10, color: W_PALETTE.muted,
                    fontFamily: W_FONT_MIN, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.15em',
                  }}>
                    {m.time} {mine && <span style={{ marginLeft: 8, color: W_PALETTE.accentDim }}>·  読</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: W_PALETTE.surface, border: `1px solid ${W_PALETTE.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <SheepBrush size={30} tone={partner.tone} accent={W_PALETTE.ink} />
          </div>
          <div style={{
            padding: '12px 18px', background: W_PALETTE.surface,
            border: `1px solid ${W_PALETTE.hairline}`, borderRadius: '12px 12px 12px 4px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {[0, 1, 2].map((d) => (
              <span key={d} style={{
                width: 5, height: 5, borderRadius: '50%', background: W_PALETTE.textDim,
                animation: `tdot 1.2s infinite ${d * 0.2}s`,
              }} />
            ))}
          </div>
          <span style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.muted, letterSpacing: '0.2em',
          }}>
            筆を執っています…
          </span>
        </div>
      </div>

      {/* Composer */}
      <div style={{
        padding: '16px 40px 24px', borderTop: `1px solid ${W_PALETTE.hairline}`,
        background: W_PALETTE.bgSoft,
      }}>
        <div style={{
          border: `1px solid ${W_PALETTE.hairlineLight}`, background: W_PALETTE.surface,
          padding: '12px 16px', display: 'flex', alignItems: 'flex-end', gap: 14,
          minHeight: 64,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: W_FONT, fontSize: 14, color: W_PALETTE.muted,
              letterSpacing: '0.05em', lineHeight: 1.9, paddingTop: 6,
            }}>
              そっと、文字を置く…
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              {/* tiny icon buttons */}
              {['☽', '◌', '⌗', '✦'].map((ic, i) => (
                <span key={i} style={{
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: W_PALETTE.muted, fontSize: 14, cursor: 'pointer', fontFamily: W_FONT_MIN,
                }}>{ic}</span>
              ))}
              <span style={{
                marginLeft: 8, fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.15em',
              }}>
                夜を跨いで、ふたりだけの記憶になります
              </span>
            </div>
          </div>
          <button style={{
            height: 40, padding: '0 22px',
            background: 'transparent', border: `1px solid ${W_PALETTE.text}`, color: W_PALETTE.text,
            fontFamily: W_FONT_MIN, fontSize: 13, letterSpacing: '0.4em', fontWeight: 400,
            cursor: 'pointer',
          }}>
            送る
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// W_DM
// ═══════════════════════════════════════════════════════════════════════
const W_DM = () => (
  <DesktopFrame label="04 手紙 / DM">
    <TopBar section="手紙" sectionRomaji="TEGAMI" />
    <Sidebar active="tegami" />
    <DMListPanel />
    <ThreadPanel />
  </DesktopFrame>
);

Object.assign(window, { W_DM, DMListPanel, ThreadPanel });
