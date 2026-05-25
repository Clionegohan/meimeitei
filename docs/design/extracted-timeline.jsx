// web-timeline.jsx — 軒先 (timeline) — the centerpiece app shell
// v2 — rebrand 迷羊苑, copy revisions, no 聴く / no counts on actions / no @handle / kanji nums

// ─── Top bar ─────────────────────────────────────────────────────────────

const TopBar = ({
  section = '軒先',
  sectionRomaji = 'NOKISAKI',
  time = '02:47',
  date = '令和八年 神無月 廿五日',
  closeIn = '二時間 十三分',
}) => (
  <div style={{
    height: 64, position: 'absolute', top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', padding: '0 32px 0 0',
    borderBottom: `1px solid ${W_PALETTE.hairline}`,
    background: 'rgba(8,11,18,0.85)', backdropFilter: 'blur(10px)',
    zIndex: 10,
  }}>
    {/* Logo / brand */}
    <div style={{
      width: 240, height: '100%', display: 'flex', alignItems: 'center', padding: '0 28px',
      borderRight: `1px solid ${W_PALETTE.hairline}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Moon2 size={28} phase={0.78} glow={false} />
        <div style={{
          fontFamily: W_FONT_MIN, fontSize: 17, letterSpacing: '0.35em',
          color: W_PALETTE.text, fontWeight: 400,
        }}>
          迷羊苑
        </div>
      </div>
    </div>

    {/* Section title */}
    <div style={{ flex: 1, paddingLeft: 32, display: 'flex', alignItems: 'baseline', gap: 16 }}>
      <span style={{
        fontFamily: W_FONT_MIN, fontSize: 18, letterSpacing: '0.25em', color: W_PALETTE.text, fontWeight: 400,
      }}>{section}</span>
      <span style={{
        fontFamily: W_FONT_MIN, fontSize: 10, letterSpacing: '0.4em', color: W_PALETTE.muted,
      }}>· {sectionRomaji}</span>
    </div>

    {/* Right cluster */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.textDim, letterSpacing: '0.18em' }}>
          {date}
        </div>
        <div style={{
          fontFamily: W_FONT_MIN, fontSize: 18, color: W_PALETTE.text,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em', marginTop: 1,
        }}>
          {time}
          <span style={{ fontSize: 10, color: W_PALETTE.muted, marginLeft: 10, letterSpacing: '0.25em' }}>
            子の刻
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 36, background: W_PALETTE.hairline }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: W_PALETTE.accent,
                       boxShadow: `0 0 8px ${W_PALETTE.accent}` }} />
        <div>
          <div style={{ fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.25em' }}>
            閉店まで
          </div>
          <div style={{ fontFamily: W_FONT_MIN, fontSize: 13, color: W_PALETTE.text, letterSpacing: '0.08em' }}>
            {closeIn}
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 36, background: W_PALETTE.hairline }} />

      {/* Notifications */}
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative',
        padding: 4,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={W_PALETTE.textDim} strokeWidth="1.3">
          <path d="M12 4 L12 3 M6 10 a6 6 0 0 1 12 0 c0 7 3 8 3 8 H3 s3 -1 3 -8 Z" strokeLinejoin="round" />
          <path d="M10 21 a2 2 0 0 0 4 0" />
        </svg>
        <span style={{
          position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%',
          background: W_PALETTE.vermilion, boxShadow: `0 0 5px ${W_PALETTE.vermilion}`,
        }} />
      </button>

      {/* Avatar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          border: `1px solid ${W_PALETTE.hairlineLight}`,
          background: W_PALETTE.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <SheepBrush size={36} tone="#E8E2D2" accent={W_PALETTE.ink} />
        </div>
      </div>
    </div>
  </div>
);

// ─── Sidebar ─────────────────────────────────────────────────────────────

const Sidebar = ({ active = 'nokisaki' }) => {
  const items = [
    { id: 'nokisaki', label: '軒先', sub: '皆のつぶやき', icon: NorenIcon },
    { id: 'tegami',   label: '手紙', sub: '一対一の語らい', icon: FumiIcon, badge: 2 },
    { id: 'hitsuji',  label: '羊',   sub: '客帳',         icon: SheepIcon },
    { id: 'onore',    label: '己',   sub: 'あなたの席',   icon: MoonIcon },
  ];
  const lower = [
    { id: 'fuda', label: 'お品書き', sub: '設定と規則', icon: FudaIcon },
  ];

  const renderItem = (it) => {
    const Icon = it.icon;
    const isActive = it.id === active;
    return (
      <div key={it.id} style={{
        padding: '14px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: isActive ? 'rgba(184,155,110,0.06)' : 'transparent',
        borderLeft: `2px solid ${isActive ? W_PALETTE.accent : 'transparent'}`,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isActive ? 1 : 0.7,
        }}>
          <Icon size={22} color={isActive ? W_PALETTE.text : W_PALETTE.textDim} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 16, letterSpacing: '0.18em',
            color: isActive ? W_PALETTE.text : W_PALETTE.textBody, fontWeight: 400,
          }}>
            {it.label}
          </div>
          <div style={{
            fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.1em', marginTop: 3,
            fontFamily: W_FONT_MIN,
          }}>
            {it.sub}
          </div>
        </div>
        {it.badge && (
          <div style={{
            minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
            background: W_PALETTE.vermilion, color: '#F2EAD1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontFamily: W_FONT_MIN, fontWeight: 500,
            boxShadow: `0 0 8px ${W_PALETTE.vermilion}40`,
          }}>{it.badge}</div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: 240, position: 'absolute', top: 64, left: 0, bottom: 0,
      borderRight: `1px solid ${W_PALETTE.hairline}`,
      background: W_PALETTE.bgSoft,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Compose CTA */}
      <div style={{ padding: '24px 22px 18px' }}>
        <button style={{
          width: '100%', height: 46, border: `1px solid ${W_PALETTE.text}`,
          background: 'transparent', color: W_PALETTE.text, cursor: 'pointer',
          fontFamily: W_FONT_MIN, fontSize: 13, letterSpacing: '0.4em', fontWeight: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>筆</span>
          筆を取る
        </button>
      </div>

      <div style={{ margin: '4px 22px 18px' }}>
        <SumiDivider width={196} opacity={0.5} />
      </div>

      <div style={{ flex: 1 }}>
        {items.map(renderItem)}
      </div>

      <div style={{ borderTop: `1px solid ${W_PALETTE.hairline}`, padding: '12px 0' }}>
        {lower.map(renderItem)}
      </div>

      <div style={{
        padding: '14px 22px 18px', borderTop: `1px solid ${W_PALETTE.hairline}`,
        fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.15em',
        fontFamily: W_FONT_MIN, lineHeight: 1.7,
      }}>
        本日は 二十六年<br />
        神無月 廿五日
      </div>
    </div>
  );
};

// ─── Right rail ──────────────────────────────────────────────────────────

const RightRail = () => {
  const lit = [
    { handle: '月見羊',   tone: '#E8E2D2', mood: '月を眺めています' },
    { handle: '茶の羊',   tone: '#D8B890', mood: 'ほうじ茶を、一杯' },
    { handle: '三時の羊', tone: '#D8CFB8', mood: '氷を口に' },
    { handle: '寝言の羊', tone: '#C8BFA0', mood: 'しりとり、募集中' },
    { handle: '読書羊',   tone: '#B8A480', mood: '本を読み返しています' },
  ];
  const seats = [
    { tag: '眠れぬ夜', count: '十八' },
    { tag: 'ほうじ茶卓', count: '四' },
    { tag: '星見の縁台', count: '十二' },
    { tag: '本を読む', count: '七' },
    { tag: '夜更けの台所', count: '三' },
  ];

  return (
    <div style={{
      width: 340, position: 'absolute', top: 64, right: 0, bottom: 0,
      borderLeft: `1px solid ${W_PALETTE.hairline}`,
      background: W_PALETTE.bgSoft,
      overflow: 'hidden',
    }}>
      {/* ── Moon phase panel ────────────────────────────────────── */}
      <div style={{
        padding: '28px 28px 22px',
        borderBottom: `1px solid ${W_PALETTE.hairline}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40 }}>
          <Moon2 size={130} phase={0.78} glow={true} glowSize={1.4} />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
            letterSpacing: '0.35em', marginBottom: 12,
          }}>
            今 宵 の 月
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 22, color: W_PALETTE.text,
            letterSpacing: '0.18em', fontWeight: 300,
          }}>
            居待月
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.textDim,
            letterSpacing: '0.15em', marginTop: 6, lineHeight: 1.9,
          }}>
            十八夜 · 月齢 十七<br />
            月の出 <span style={{ fontVariantNumeric: 'tabular-nums' }}>21:42</span>
            <span style={{ color: W_PALETTE.faint, margin: '0 8px' }}>·</span>
            月の入 <span style={{ fontVariantNumeric: 'tabular-nums' }}>09:18</span>
          </div>
        </div>
      </div>

      {/* ── 灯ともる羊 ────────────────────────────────────────── */}
      <div style={{ padding: '22px 28px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14,
        }}>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.text,
            letterSpacing: '0.3em',
          }}>
            灯 と も る 羊
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.2em',
          }}>
            二十七 匹
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lit.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <SheepBrush size={32} tone={u.tone} accent={W_PALETTE.ink} />
                <span style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 8, height: 8, borderRadius: '50%', background: W_PALETTE.accent,
                  border: `2px solid ${W_PALETTE.bgSoft}`, boxShadow: `0 0 4px ${W_PALETTE.accent}`,
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: W_FONT_MIN, fontSize: 13, color: W_PALETTE.text,
                  letterSpacing: '0.06em',
                }}>{u.handle}</div>
                <div style={{
                  fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.06em', marginTop: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontFamily: W_FONT_MIN,
                }}>{u.mood}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── お席のご案内 ──────────────────────────────────────── */}
      <div style={{
        padding: '22px 28px', borderTop: `1px solid ${W_PALETTE.hairline}`,
      }}>
        <div style={{
          fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.text,
          letterSpacing: '0.3em', marginBottom: 14,
        }}>
          お 席 の ご 案 内
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {seats.map((s, i) => (
            <div key={i} style={{
              padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              borderBottom: i < seats.length - 1 ? `1px dotted ${W_PALETTE.hairline}` : 'none',
              cursor: 'pointer',
            }}>
              <span style={{
                fontFamily: W_FONT_MIN, fontSize: 12, color: W_PALETTE.textBody,
                letterSpacing: '0.1em',
              }}>#{s.tag}</span>
              <span style={{
                fontSize: 10, color: W_PALETTE.muted, letterSpacing: '0.15em',
                fontFamily: W_FONT_MIN,
              }}>
                {s.count} 匹
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Post card ───────────────────────────────────────────────────────────

const PostCard = ({ post, dim = false }) => (
  <div style={{
    padding: '24px 4px',
    display: 'flex', gap: 18,
    opacity: dim ? 0.7 : 1,
    position: 'relative',
  }}>
    {/* Avatar */}
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: W_PALETTE.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        border: `1px solid ${W_PALETTE.hairline}`,
      }}>
        <SheepBrush size={44} tone={post.tone} accent={W_PALETTE.ink} />
      </div>
      {post.glow && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 10, height: 10, borderRadius: '50%', background: W_PALETTE.accent,
          border: `2px solid ${W_PALETTE.bg}`, boxShadow: `0 0 6px ${W_PALETTE.accent}`,
        }} />
      )}
    </div>

    {/* Content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* meta — nickname + time only, no @handle */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{
          fontFamily: W_FONT_MIN, fontSize: 16, color: W_PALETTE.text,
          letterSpacing: '0.08em',
        }}>{post.handle}</span>
        <span style={{ color: W_PALETTE.faint, fontSize: 11 }}>·</span>
        <span style={{
          fontSize: 11, color: W_PALETTE.textDim, letterSpacing: '0.08em', fontFamily: W_FONT_MIN,
        }}>{post.dist}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: W_PALETTE.muted,
          fontFamily: W_FONT_MIN, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.1em',
        }}>{post.time}</span>
      </div>

      {/* body */}
      <div style={{
        fontFamily: W_FONT, fontSize: 15, lineHeight: 2, color: W_PALETTE.textBody,
        letterSpacing: '0.04em', whiteSpace: 'pre-line',
      }}>
        {post.body}
      </div>

      {/* actions — 応える + 燭を寄せる, no counts */}
      <div style={{
        marginTop: 16, display: 'flex', alignItems: 'center', gap: 28,
      }}>
        <button style={{
          background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 8,
          color: W_PALETTE.textDim, fontFamily: W_FONT_MIN, fontSize: 12, letterSpacing: '0.2em',
          cursor: 'pointer', padding: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M21 12 a9 9 0 1 1 -3.5 -7 L21 5 l-1 4 L21 12" />
          </svg>
          応 え る
        </button>

        <button style={{
          background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 8,
          color: W_PALETTE.textDim, fontFamily: W_FONT_MIN, fontSize: 12, letterSpacing: '0.2em',
          cursor: 'pointer', padding: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={W_PALETTE.accent} stroke="none">
            <path d="M12 2 C12 6 16 8 16 13 a4 4 0 0 1 -8 0 c0 -5 4 -7 4 -11 z" opacity="0.6" />
          </svg>
          燭 を 寄 せ る
        </button>

        <span style={{ marginLeft: 'auto', color: W_PALETTE.muted, fontSize: 14, padding: '0 4px', cursor: 'pointer' }}>···</span>
      </div>
    </div>
  </div>
);

// ─── Composer (inline at top of timeline) ────────────────────────────────

const InlineComposer = () => (
  <div style={{
    border: `1px solid ${W_PALETTE.hairlineLight}`,
    background: W_PALETTE.surface,
    padding: '20px 24px', display: 'flex', gap: 18,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 200, height: 80,
      background: `radial-gradient(ellipse at top right, ${W_PALETTE.moonGlow} 0%, transparent 60%)`,
      pointerEvents: 'none',
    }} />

    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      background: W_PALETTE.elevated, border: `1px solid ${W_PALETTE.hairline}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <SheepBrush size={42} tone="#E8E2D2" accent={W_PALETTE.ink} />
    </div>

    <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
      <div style={{
        minHeight: 56, fontFamily: W_FONT, fontSize: 15, color: W_PALETTE.muted,
        letterSpacing: '0.05em', lineHeight: 1.9, paddingTop: 4,
      }}>
        今宵のひとこと、置きませんか。
      </div>

      <div style={{
        marginTop: 12, paddingTop: 14,
        borderTop: `1px solid ${W_PALETTE.hairline}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{
          fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.muted, letterSpacing: '0.2em',
        }}>
          今宵の様態 ·
        </span>
        {['眠れない', '寝る前に', '独り言', 'しりとり'].map((t, i) => (
          <span key={i} style={{
            padding: '4px 12px', border: `1px solid ${W_PALETTE.hairlineLight}`,
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.textDim,
            letterSpacing: '0.15em', cursor: 'pointer', borderRadius: 2,
          }}>{t}</span>
        ))}

        <button style={{
          marginLeft: 'auto', height: 36, padding: '0 24px',
          background: W_PALETTE.text, color: W_PALETTE.bg, border: 'none',
          fontFamily: W_FONT_MIN, fontSize: 13, letterSpacing: '0.4em', fontWeight: 500,
          cursor: 'pointer',
        }}>
          筆を取る
        </button>
      </div>
    </div>
  </div>
);

// ─── Begin-of-night marker (showing past nights are not viewable) ────────

const NightStartMark = () => (
  <div style={{
    margin: '20px 0 10px', padding: '24px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    opacity: 0.85,
  }}>
    <SumiDivider width={620} opacity={0.5} />
    <div style={{
      fontFamily: W_FONT_MIN, fontSize: 13, color: W_PALETTE.textDim,
      letterSpacing: '0.35em', textAlign: 'center', lineHeight: 1.9,
    }}>
      ここから 今宵 が 始まりました
    </div>
    <div style={{
      fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
      letterSpacing: '0.3em',
    }}>
      二十二時 開店 · 二十六年 神無月 廿五日
    </div>
    <div style={{
      marginTop: 8, fontFamily: W_FONT_MIN, fontSize: 10, color: W_PALETTE.muted,
      letterSpacing: '0.15em', textAlign: 'center', maxWidth: 360, lineHeight: 1.8,
    }}>
      昨夜より前の文は、朝とともに片付けられました。<br />
      軒先には、今宵の文だけが並びます。
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// W_Timeline · 軒先
// ═══════════════════════════════════════════════════════════════════════
const W_Timeline = () => (
  <DesktopFrame label="03 軒先">
    <TopBar section="軒先" sectionRomaji="NOKISAKI" />
    <Sidebar active="nokisaki" />
    <RightRail />

    {/* ── Main content area ───────────────────────────────────────── */}
    <div style={{
      position: 'absolute', top: 64, left: 240, right: 340, bottom: 0,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Section subheader */}
      <div style={{
        padding: '28px 56px 22px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 32, letterSpacing: '0.2em',
            color: W_PALETTE.text, fontWeight: 300,
          }}>
            軒先のつぶやき
          </div>
          <div style={{
            fontFamily: W_FONT_MIN, fontSize: 11, color: W_PALETTE.muted,
            letterSpacing: '0.25em', marginTop: 6,
          }}>
            ぽつり、ぽつりと、皆の独り言が並ぶところ。
          </div>
        </div>
        {/* filter tabs */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[
            { l: '今宵', active: true },
            { l: '灯ともる', active: false },
            { l: '燭を寄せた', active: false },
          ].map((t, i) => (
            <span key={i} style={{
              padding: '6px 14px',
              fontFamily: W_FONT_MIN, fontSize: 12, letterSpacing: '0.2em',
              color: t.active ? W_PALETTE.text : W_PALETTE.muted,
              borderBottom: t.active ? `1px solid ${W_PALETTE.accent}` : `1px solid transparent`,
              cursor: 'pointer',
            }}>{t.l}</span>
          ))}
        </div>
      </div>

      {/* Scrollable feed */}
      <div style={{
        flex: 1, overflow: 'hidden', padding: '0 56px 32px',
      }}>
        <InlineComposer />

        {/* Posts */}
        <div style={{ marginTop: 8 }}>
          {W_POSTS.slice(0, 3).map((p, i) => (
            <React.Fragment key={i}>
              <PostCard post={p} />
              {i < 2 && <SumiDivider width={760} opacity={0.4} />}
            </React.Fragment>
          ))}

          <NightStartMark />
        </div>
      </div>
    </div>
  </DesktopFrame>
);

Object.assign(window, { TopBar, Sidebar, RightRail, PostCard, InlineComposer, NightStartMark, W_Timeline });
