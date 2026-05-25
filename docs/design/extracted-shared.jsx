// web-shared.jsx — Web/desktop shared atoms for Direction A (月夜の墨)

// ─── Palette (refined for desktop) ───────────────────────────────────────
const W_PALETTE = {
  bg:        '#080B12', // deeper than mobile for desktop comfort
  bgSoft:    '#0C1018',
  surface:   '#10141E',
  elevated:  '#161B27',
  card:      '#0F131C',
  hairline:  '#1F2533',
  hairlineLight: '#2A3142',
  text:      '#ECE6D4',
  textBody:  '#D8D2C0',
  textDim:   '#9A9484',
  muted:     '#5E5A4F',
  faint:     '#3A382F',
  moon:      '#F2EAD1',
  moonGlow:  'rgba(242,234,209,0.18)',
  ink:       '#050810',
  accent:    '#B89B6E',  // aged paper gold
  accentDim: '#7A6749',
  vermilion: '#A85040',  // sealing-ink red for hanko/important
  bubbleMe:  '#1A2236',
  glassBg:   'rgba(8,11,18,0.7)',
};

const W_FONT      = '"Zen Kaku Gothic New", "Noto Sans JP", system-ui, sans-serif';
const W_FONT_MIN  = '"Shippori Mincho", "Noto Serif JP", serif';

// ─── Moon (refined with phase support) ───────────────────────────────────
const Moon2 = ({ size = 100, phase = 0.85, glow = true, glowSize = 1.6 }) => {
  // phase: 0 = new, 0.5 = full, 1 = new again. We just render the lit disc
  // with a shadow disc offset to simulate phase.
  const id = `moon-${Math.round(phase * 1000)}-${size}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`disc-${id}`} cx="42%" cy="38%">
          <stop offset="0%"  stopColor="#FFFAEB" />
          <stop offset="55%" stopColor={W_PALETTE.moon} />
          <stop offset="100%" stopColor="#BFB59A" />
        </radialGradient>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0%"   stopColor={W_PALETTE.moon} stopOpacity="0.5" />
          <stop offset="55%"  stopColor={W_PALETTE.moon} stopOpacity="0.08" />
          <stop offset="100%" stopColor={W_PALETTE.moon} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <circle cx="50" cy="50" r="32" />
        </clipPath>
      </defs>
      {glow && <circle cx="50" cy="50" r={50 * glowSize} fill={`url(#glow-${id})`} />}
      <circle cx="50" cy="50" r="32" fill={`url(#disc-${id})`} />
      {/* shadow disc to simulate phase */}
      {phase < 0.95 && (
        <g clipPath={`url(#clip-${id})`}>
          <ellipse
            cx={50 - (1 - phase * 2) * 28}
            cy="50"
            rx="32"
            ry="32"
            fill={W_PALETTE.bg}
            opacity="0.96"
          />
        </g>
      )}
      {/* craters on lit side */}
      <g opacity="0.4">
        <circle cx="42" cy="44" r="2.4" fill="#B5AB8C" />
        <circle cx="58" cy="52" r="1.6" fill="#B5AB8C" />
        <circle cx="49" cy="59" r="2.0" fill="#B5AB8C" />
        <circle cx="55" cy="40" r="1.2" fill="#B5AB8C" />
      </g>
    </svg>
  );
};

// ─── Ink brush sheep (refined w/ hand-drawn brush feel) ──────────────────
const SheepBrush = ({ size = 40, tone = '#E8E2D2', accent = W_PALETTE.ink }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
    <defs>
      <filter id={`brush-${size}-${tone.replace('#','')}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>
        <feDisplacementMap in="SourceGraphic" scale="0.6"/>
      </filter>
    </defs>
    {/* wool blob — fewer, more organic */}
    <g fill={tone} filter={`url(#brush-${size}-${tone.replace('#','')})`}>
      <ellipse cx="32" cy="36" rx="18" ry="12" />
      <circle cx="22" cy="30" r="7.5" />
      <circle cx="32" cy="26" r="8.5" />
      <circle cx="42" cy="30" r="7.5" />
      <circle cx="24" cy="44" r="6.5" />
      <circle cx="40" cy="44" r="6.5" />
    </g>
    {/* head */}
    <ellipse cx="32" cy="22" rx="6" ry="7" fill={accent} />
    {/* ears */}
    <ellipse cx="26" cy="18" rx="2.4" ry="3.4" fill={accent} transform="rotate(-25 26 18)" />
    <ellipse cx="38" cy="18" rx="2.4" ry="3.4" fill={accent} transform="rotate(25 38 18)" />
    {/* eye */}
    <circle cx="32" cy="22" r="1.2" fill={tone} />
    {/* tiny legs hint */}
    <rect x="24" y="48" width="1.8" height="4" fill={accent} />
    <rect x="38.2" y="48" width="1.8" height="4" fill={accent} />
  </svg>
);

// ─── Noren (small icon-sized) ────────────────────────────────────────────
const NorenIcon = ({ size = 22, color = W_PALETTE.text }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <rect x="3" y="3" width="18" height="1.4" fill={color} />
    <path d="M4 4.5 L4 17 Q5.5 18.5 7 17 L7 4.5 Z" fill={color} />
    <path d="M9 4.5 L9 18 Q10.5 19.5 12 18 Q13.5 19.5 15 18 L15 4.5 Z" fill={color} />
    <path d="M17 4.5 L17 17 Q18.5 18.5 20 17 L20 4.5 Z" fill={color} />
  </svg>
);

// ─── Other glyph icons used in nav ───────────────────────────────────────
const FumiIcon = ({ size = 22, color = W_PALETTE.text }) => (
  // letter / scroll
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16v12H4z" />
    <path d="M4 6l8 6 8-6" />
    <path d="M4 18l5-5" />
    <path d="M20 18l-5-5" />
  </svg>
);

const SheepIcon = ({ size = 22, color = W_PALETTE.text }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="11" r="3" />
    <circle cx="12" cy="9.5" r="3.2" />
    <circle cx="16" cy="11" r="3" />
    <circle cx="10" cy="14" r="2.8" />
    <circle cx="14" cy="14" r="2.8" />
    <ellipse cx="12" cy="7.5" rx="2" ry="2.4" fill={color} />
    <circle cx="12" cy="7.5" r="0.5" fill={W_PALETTE.bg} />
    <line x1="9" y1="18" x2="9" y2="20" />
    <line x1="15" y1="18" x2="15" y2="20" />
  </svg>
);

const MoonIcon = ({ size = 22, color = W_PALETTE.text }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M17 12.5 a6.5 6.5 0 1 1 -5.7 -6.45 a5 5 0 0 0 5.7 6.45z" fill={color} />
  </svg>
);

const FudaIcon = ({ size = 22, color = W_PALETTE.text }) => (
  // hanging tag for settings/お品書き
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round">
    <path d="M12 3 L7 7 L7 21 L17 21 L17 7 Z" />
    <line x1="12" y1="3" x2="12" y2="5" />
    <circle cx="12" cy="11" r="1" fill={color} stroke="none" />
    <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
    <line x1="9.5" y1="17" x2="14.5" y2="17" />
  </svg>
);

// ─── Ink wash brush divider ──────────────────────────────────────────────
const SumiDivider = ({ width = 600, color = W_PALETTE.hairline, opacity = 0.6 }) => (
  <svg viewBox={`0 0 ${width} 8`} width={width} height={8} style={{ opacity }} preserveAspectRatio="none">
    <path
      d={`M0,4 Q${width * 0.2},2 ${width * 0.5},4 T${width},4`}
      stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round"
    />
    <path
      d={`M${width * 0.15},5 L${width * 0.85},5`}
      stroke={color} strokeWidth="0.4" fill="none" strokeDasharray="1 4"
    />
  </svg>
);

// ─── Hanko (red seal) ────────────────────────────────────────────────────
const Hanko = ({ size = 36, ch = '羊', color = W_PALETTE.vermilion }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect x="2" y="2" width="44" height="44" fill={color} opacity="0.92" rx="2" />
    <text x="24" y="33" fontSize="26" fill="#F2EAD1" textAnchor="middle"
          fontFamily={W_FONT_MIN} fontWeight="600">{ch}</text>
    {/* worn edges */}
    <rect x="2" y="2" width="44" height="44" fill="none" stroke={W_PALETTE.bg} strokeWidth="0.5" opacity="0.3" rx="2" />
  </svg>
);

// ─── Subtle star field ───────────────────────────────────────────────────
const StarField = ({ density = 60, opacity = 0.5 }) => {
  // deterministic stars
  const stars = [];
  let seed = 1234;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < density; i++) {
    stars.push({
      cx: rnd() * 100,
      cy: rnd() * 100,
      r: 0.15 + rnd() * 0.6,
      o: 0.3 + rnd() * 0.7,
    });
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={W_PALETTE.moon} opacity={s.o} />
      ))}
    </svg>
  );
};

// ─── Vertical Japanese label ─────────────────────────────────────────────
const VLabelW = ({ children, size = 11, color = W_PALETTE.textDim, style, weight = 400 }) => (
  <span style={{
    writingMode: 'vertical-rl',
    fontFamily: W_FONT_MIN, letterSpacing: '0.4em',
    fontSize: size, color, fontWeight: weight,
    ...style,
  }}>
    {children}
  </span>
);

// ─── Desktop Frame ───────────────────────────────────────────────────────
const DesktopFrame = ({ children, label, style }) => (
  <div
    style={{
      width: 1440, height: 900, position: 'relative', overflow: 'hidden',
      background: W_PALETTE.bg, color: W_PALETTE.text, fontFamily: W_FONT,
      ...style,
    }}
    data-screen-label={label}
  >
    {children}
  </div>
);

// ─── Sample data ─────────────────────────────────────────────────────────
const W_POSTS = [
  {
    handle: '月見羊', sub: 'tsukimiyo', tone: '#E8E2D2',
    time: '02:47', dist: 'たった今',
    body: '眠れないので、月を眺めています。雲が早足で過ぎていきました。\n誰かに、夜空のことを話したくなりました。',
    listen: 7, reply: 2, glow: true,
  },
  {
    handle: '三時の羊', sub: 'sanji_no_hitsuji', tone: '#D8CFB8',
    time: '02:39', dist: '8分前',
    body: '冷蔵庫を開ける音だけが、部屋にひびく夜です。氷を一粒、口に含んで、しばらく溶けるのを待っています。',
    listen: 12, reply: 4,
  },
  {
    handle: '寝言の羊', sub: 'negoto', tone: '#C8BFA0',
    time: '02:24', dist: '23分前',
    body: '明日のことを考えると、心臓が早くなる。誰か、しりとりでも、しませんか。',
    listen: 19, reply: 11, glow: true,
  },
  {
    handle: '星見羊', sub: 'hoshimiyo', tone: '#E8D2B8',
    time: '02:11', dist: '36分前',
    body: '今夜は星がよく見えます。ベランダに出てみてください。\nオリオンが斜めに立っています。',
    listen: 24, reply: 6,
  },
  {
    handle: '茶の羊', sub: 'chanohitsuji', tone: '#D8B890',
    time: '01:58', dist: '49分前',
    body: 'お茶を淹れました。ほうじ茶です。香ばしさだけで、もう少しだけ起きていられそうです。',
    listen: 14, reply: 3,
  },
  {
    handle: '読書羊', sub: 'dokusho', tone: '#B8A480',
    time: '01:42', dist: '1時間5分前',
    body: '夜中に読み返す本というのは、不思議と昼に読んだのとは違う顔を見せます。同じ文章なのに。',
    listen: 31, reply: 8,
  },
];

const W_DM_LIST = [
  { handle: '月見羊', sub: 'tsukimiyo', tone: '#E8E2D2', preview: '...こちらは、温めた牛乳を一杯。', time: '02:20', unread: 0, lit: true, active: true },
  { handle: '茶の羊', sub: 'chanohitsuji', tone: '#D8B890', preview: 'ほうじ茶、温まりますよね。', time: '01:58', unread: 2, lit: true },
  { handle: '寝言の羊', sub: 'negoto', tone: '#C8BFA0', preview: '(画像を送りました)', time: '昨夜', unread: 0, lit: false },
  { handle: '読書羊', sub: 'dokusho', tone: '#B8A480', preview: 'いつかその本、貸してください。', time: '昨夜', unread: 0, lit: false },
  { handle: '星見羊', sub: 'hoshimiyo', tone: '#E8D2B8', preview: 'オリオン、見えました。ありがとう。', time: '一昨夜', unread: 0, lit: false },
];

Object.assign(window, {
  W_PALETTE, W_FONT, W_FONT_MIN,
  Moon2, SheepBrush, NorenIcon, FumiIcon, SheepIcon, MoonIcon, FudaIcon,
  SumiDivider, Hanko, StarField, VLabelW,
  DesktopFrame, W_POSTS, W_DM_LIST,
});
