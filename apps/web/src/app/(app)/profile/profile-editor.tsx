'use client'

import { useState, useTransition } from 'react'
import {
  FAVORITE_MOONS,
  SIGN_TAGS,
  TONES,
  type FavoriteMoon,
  type SignTag,
  type Tone,
} from '@me-me-en/domain'
import { updateProfileAction } from './actions'
import { MoonSvg } from '../_components/moon-svg'
import { SumiDivider } from '../_components/sumi-divider'
import { phaseOfFavoriteMoon } from '../_components/moon-name'
import { formatJapaneseDate } from '../_components/kanji'
import { SheepAvatar } from './_components/sheep-avatar'

const SIGN_LABEL: Record<SignTag, string> = {
  sleepless: '眠れない',
  reading: '読書中',
  having_tea: 'お茶を一杯',
  moon_gazing: '月を眺める',
  nothing: '何でもない',
  wanting_to_hear: '声を聞きたい',
  shiritori: 'しりとり',
  staying_up_late: '夜更かし',
}

export type ProfileEditorDto = {
  id: string
  nickname: string
  bio: string
  tone: Tone
  presenceVisibility: 'visible' | 'invisible'
  currentSigns: readonly SignTag[]
  favoriteMoon: FavoriteMoon | null
  joinedAt: string
}

// design HTML の「heading + SumiDivider + profile card + 今宵のしるし + 親しい羊」
// レイアウトを表示モードとして描画し、edit モードへの切替も内包する。
// 「親しい羊」list は別 Server Component から ReactNode で受け取る。
export function ProfileEditor({
  user,
  closeSheepList,
}: {
  user: ProfileEditorDto
  closeSheepList: React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(user.nickname)
  const [bio, setBio] = useState(user.bio)
  const [tone, setTone] = useState<Tone>(user.tone)
  const [presenceVisibility, setPresenceVisibility] =
    useState<'visible' | 'invisible'>(user.presenceVisibility)
  const [signs, setSigns] = useState<readonly SignTag[]>(user.currentSigns)
  const [favoriteMoon, setFavoriteMoon] = useState<FavoriteMoon | null>(
    user.favoriteMoon,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const toggleSign = (s: SignTag) => {
    setSigns((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateProfileAction({
        nickname,
        bio,
        tone,
        presenceVisibility,
        currentSigns: signs,
        favoriteMoon,
      })
      if (result.ok) setEditing(false)
      else setError(result.error)
    })
  }

  const cancel = () => {
    setNickname(user.nickname)
    setBio(user.bio)
    setTone(user.tone)
    setPresenceVisibility(user.presenceVisibility)
    setSigns(user.currentSigns)
    setFavoriteMoon(user.favoriteMoon)
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <EditForm
        tone={tone}
        nickname={nickname}
        bio={bio}
        presenceVisibility={presenceVisibility}
        signs={signs}
        favoriteMoon={favoriteMoon}
        pending={pending}
        error={error}
        onChangeTone={setTone}
        onChangeNickname={setNickname}
        onChangeBio={setBio}
        onChangePresence={setPresenceVisibility}
        onToggleSign={toggleSign}
        onChangeFavoriteMoon={setFavoriteMoon}
        onSave={save}
        onCancel={cancel}
      />
    )
  }

  return (
    <ProfileDisplay
      user={user}
      closeSheepList={closeSheepList}
      onEdit={() => setEditing(true)}
    />
  )
}

// ─── Display モード ──────────────────────────────────────────────────────

function ProfileDisplay({
  user,
  closeSheepList,
  onEdit,
}: {
  user: ProfileEditorDto
  closeSheepList: React.ReactNode
  onEdit: () => void
}) {
  const joinedAtJa = formatJapaneseDate(new Date(user.joinedAt))
  const statusLabel =
    user.presenceVisibility === 'visible' ? '灯ともる · 今宵 在席' : '灯 秘匿'
  // profile card の装飾月。「好きな月」が未設定なら 居待月 (phase 0.58) を fallback。
  const favoriteMoonPhase = phaseOfFavoriteMoon(user.favoriteMoon)
  const moonPhaseForCard = favoriteMoonPhase ?? 17 / 29.5305882

  return (
    <div>
      {/* heading */}
      <div className="flex items-baseline justify-between">
        <div>
          <div
            style={{
              fontSize: 32,
              letterSpacing: '0.2em',
              color: '#ECE6D4',
              fontWeight: 300,
            }}
          >
            あなたの席
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#5E5A4F',
              letterSpacing: '0.25em',
              marginTop: 6,
            }}
          >
            お席のしつらえと、ご自身のお話。
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="hover:bg-[#161B27] transition-colors"
          style={{
            height: 36,
            padding: '0 22px',
            border: '1px solid #2A3142',
            background: 'transparent',
            color: '#ECE6D4',
            fontSize: 12,
            letterSpacing: '0.3em',
          }}
        >
          整える
        </button>
      </div>

      <div style={{ marginTop: 28 }}>
        <SumiDivider width={760} opacity={0.5} />
      </div>

      {/* Profile card */}
      <div
        className="relative overflow-hidden"
        style={{
          marginTop: 28,
          padding: '32px 36px',
          background: '#10141E',
          border: '1px solid #1F2533',
          display: 'flex',
          gap: 36,
        }}
      >
        {/* 装飾月: panel 内に完全に収まる右上配置。淡さ (opacity 0.4) は維持。
            user.favoriteMoon が設定されていればその月相、未設定なら居待月 fallback。 */}
        <div
          className="absolute"
          style={{ top: 18, right: 22, opacity: 0.4 }}
          aria-hidden
        >
          <MoonSvg size={140} phase={moonPhaseForCard} glow={true} glowSize={1.3} />
        </div>

        {/* Avatar */}
        <div className="relative shrink-0" style={{ zIndex: 2 }}>
          <div
            className="rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: 132,
              height: 132,
              background: '#161B27',
              border: '1px solid #2A3142',
            }}
          >
            <SheepAvatar tone={user.tone} size={124} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 relative" style={{ zIndex: 2 }}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 34,
                color: '#ECE6D4',
                letterSpacing: '0.12em',
                fontWeight: 400,
              }}
            >
              {user.nickname}
            </span>
          </div>

          <div
            className="flex items-center"
            style={{
              fontSize: 11,
              color: '#B89B6E',
              letterSpacing: '0.3em',
              marginBottom: 18,
              gap: 8,
            }}
          >
            <span
              className="rounded-full"
              aria-hidden
              style={{
                width: 6,
                height: 6,
                background: '#B89B6E',
                boxShadow: '0 0 6px #B89B6E',
              }}
            />
            {statusLabel}
          </div>

          {user.bio.length > 0 && (
            <p
              className="whitespace-pre-line"
              style={{
                fontFamily:
                  'var(--font-gothic), "Noto Sans JP", "Hiragino Sans", system-ui, sans-serif',
                fontSize: 14,
                color: '#D8D2C0',
                letterSpacing: '0.04em',
                lineHeight: 2,
                maxWidth: 480,
              }}
            >
              {user.bio}
            </p>
          )}

          {/* 3 列 meta */}
          <div
            className="flex"
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid #1F2533',
              gap: 36,
            }}
          >
            <MetaCell label="入店初日" value={joinedAtJa} />
            <MetaCell
              label="好きな月"
              value={user.favoriteMoon ?? 'まだ'}
            />
            <MetaCell label="よく置く文" value="独り言" />
          </div>
        </div>
      </div>

      {/* 今宵のしるし + 親しい羊 横並び */}
      <div className="flex" style={{ marginTop: 28, gap: 40 }}>
        <div style={{ flex: 1 }}>
          <SectionTitle title="今 宵 の し る し" />
          <SectionSub>同じしるしを掲げる羊と、ふと出会えます。</SectionSub>
          <div className="flex flex-wrap" style={{ gap: 10 }}>
            {SIGN_TAGS.map((s) => {
              const active = user.currentSigns.includes(s)
              return (
                <span
                  key={s}
                  style={{
                    padding: '8px 18px',
                    border: `1px solid ${active ? '#B89B6E' : '#2A3142'}`,
                    background: active ? 'rgba(184,155,110,0.08)' : 'transparent',
                    color: active ? '#ECE6D4' : '#9A9484',
                    fontSize: 12,
                    letterSpacing: '0.2em',
                  }}
                >
                  {SIGN_LABEL[s]}
                </span>
              )
            })}
          </div>
        </div>

        <div style={{ width: 280 }}>
          <SectionTitle title="親 し い 羊" />
          <SectionSub>よく文をやり取りする羊たち。</SectionSub>
          {closeSheepList}
        </div>
      </div>
    </div>
  )
}

const MetaCell = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div
      style={{
        fontSize: 10,
        color: '#5E5A4F',
        letterSpacing: '0.25em',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 14,
        color: '#ECE6D4',
        marginTop: 4,
        letterSpacing: '0.06em',
      }}
    >
      {value}
    </div>
  </div>
)

const SectionTitle = ({ title }: { title: string }) => (
  <div
    style={{
      fontSize: 14,
      color: '#ECE6D4',
      letterSpacing: '0.25em',
      marginBottom: 14,
    }}
  >
    {title}
  </div>
)

const SectionSub = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 10,
      color: '#5E5A4F',
      letterSpacing: '0.15em',
      marginBottom: 14,
      lineHeight: 1.8,
    }}
  >
    {children}
  </div>
)

// ─── Edit モード ──────────────────────────────────────────────────────────

type EditFormProps = {
  tone: Tone
  nickname: string
  bio: string
  presenceVisibility: 'visible' | 'invisible'
  signs: readonly SignTag[]
  favoriteMoon: FavoriteMoon | null
  pending: boolean
  error: string | null
  onChangeTone: (t: Tone) => void
  onChangeNickname: (s: string) => void
  onChangeBio: (s: string) => void
  onChangePresence: (p: 'visible' | 'invisible') => void
  onToggleSign: (s: SignTag) => void
  onChangeFavoriteMoon: (m: FavoriteMoon | null) => void
  onSave: () => void
  onCancel: () => void
}

function EditForm(props: EditFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        props.onSave()
      }}
      className="space-y-8"
    >
      <div className="flex items-start gap-8">
        <SheepAvatar tone={props.tone} size={120} />
        <div className="flex-1 space-y-6">
          <label className="block">
            <span className="text-xs text-[#5E5A4F] tracking-[0.3em] block mb-2">
              羊の名（1–20 文字）
            </span>
            <input
              type="text"
              value={props.nickname}
              onChange={(e) => props.onChangeNickname(e.target.value)}
              maxLength={20}
              required
              className="w-full bg-transparent border-b border-[#2A3142] py-2 text-[#ECE6D4] text-lg tracking-wider focus:outline-none focus:border-[#B89B6E]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-[#5E5A4F] tracking-[0.3em] block mb-2">
              自己紹介（0–200 文字）
            </span>
            <textarea
              value={props.bio}
              onChange={(e) => props.onChangeBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full bg-[#10141E] border border-[#2A3142] p-3 text-[#ECE6D4] text-[17px] leading-relaxed resize-none focus:outline-none focus:border-[#B89B6E]"
            />
          </label>
        </div>
      </div>

      <fieldset>
        <legend className="text-xs text-[#5E5A4F] tracking-[0.3em] mb-3">
          毛色（tone）
        </legend>
        <div className="flex gap-3">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => props.onChangeTone(t)}
              className={`w-10 h-10 rounded-full border-2 ${
                props.tone === t ? 'border-[#ECE6D4]' : 'border-transparent'
              }`}
              style={{ backgroundColor: t }}
              aria-label={t}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs text-[#5E5A4F] tracking-[0.3em] mb-3">
          今宵のしるし
        </legend>
        <div className="flex flex-wrap gap-2">
          {SIGN_TAGS.map((s) => {
            const on = props.signs.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => props.onToggleSign(s)}
                className={`px-4 py-2 text-xs tracking-[0.2em] border ${
                  on
                    ? 'border-[#B89B6E] bg-[rgba(184,155,110,0.08)] text-[#ECE6D4]'
                    : 'border-[#2A3142] text-[#9A9484] hover:border-[#3A4252]'
                }`}
              >
                {SIGN_LABEL[s]}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs text-[#5E5A4F] tracking-[0.3em] mb-3">
          好きな月
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => props.onChangeFavoriteMoon(null)}
            className={`px-4 py-2 text-xs tracking-[0.2em] border ${
              props.favoriteMoon === null
                ? 'border-[#B89B6E] bg-[rgba(184,155,110,0.08)] text-[#ECE6D4]'
                : 'border-[#2A3142] text-[#9A9484] hover:border-[#3A4252]'
            }`}
          >
            まだ決めない
          </button>
          {FAVORITE_MOONS.map((m) => {
            const on = props.favoriteMoon === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => props.onChangeFavoriteMoon(m)}
                className={`px-4 py-2 text-xs tracking-[0.2em] border ${
                  on
                    ? 'border-[#B89B6E] bg-[rgba(184,155,110,0.08)] text-[#ECE6D4]'
                    : 'border-[#2A3142] text-[#9A9484] hover:border-[#3A4252]'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs text-[#5E5A4F] tracking-[0.3em] mb-3">
          灯ともる の見え方
        </legend>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="presence"
              checked={props.presenceVisibility === 'visible'}
              onChange={() => props.onChangePresence('visible')}
            />
            <span className="text-sm tracking-wider">皆に見える</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="presence"
              checked={props.presenceVisibility === 'invisible'}
              onChange={() => props.onChangePresence('invisible')}
            />
            <span className="text-sm tracking-wider">隠す（他者からは消えて見える）</span>
          </label>
        </div>
      </fieldset>

      {props.error !== null && (
        <p className="text-[#A85040] text-sm tracking-wider">{props.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={props.pending}
          className="h-10 px-6 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm disabled:opacity-40 hover:bg-[#161B27]"
        >
          {props.pending ? '整え中…' : '整える'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.pending}
          className="h-10 px-6 border border-[#2A3142] text-[#9A9484] tracking-[0.4em] text-sm hover:bg-[#161B27]"
        >
          やめる
        </button>
      </div>
    </form>
  )
}
