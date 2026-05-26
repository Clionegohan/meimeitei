'use client'

import { useState, useTransition } from 'react'
import { SIGN_TAGS, TONES, type SignTag, type Tone } from '@me-me-en/domain'
import { updateProfileAction } from './actions'
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
  joinedAt: string
}

export function ProfileEditor({ user }: { user: ProfileEditorDto }) {
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(user.nickname)
  const [bio, setBio] = useState(user.bio)
  const [tone, setTone] = useState<Tone>(user.tone)
  const [presenceVisibility, setPresenceVisibility] =
    useState<'visible' | 'invisible'>(user.presenceVisibility)
  const [signs, setSigns] = useState<readonly SignTag[]>(user.currentSigns)
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
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <ProfileDisplay
        user={user}
        onEdit={() => setEditing(true)}
      />
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="space-y-8"
    >
      <div className="flex items-start gap-8">
        <SheepAvatar tone={tone} size={120} />
        <div className="flex-1 space-y-6">
          <label className="block">
            <span className="text-xs text-[#5E5A4F] tracking-[0.3em] block mb-2">
              羊の名（1–20 文字）
            </span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
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
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full bg-[#10141E] border border-[#2A3142] p-3 text-[#ECE6D4] text-sm leading-relaxed resize-none focus:outline-none focus:border-[#B89B6E]"
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
              onClick={() => setTone(t)}
              className={`w-10 h-10 rounded-full border-2 ${
                tone === t ? 'border-[#ECE6D4]' : 'border-transparent'
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
            const on = signs.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSign(s)}
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
          灯ともる の見え方
        </legend>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="presence"
              checked={presenceVisibility === 'visible'}
              onChange={() => setPresenceVisibility('visible')}
            />
            <span className="text-sm tracking-wider">皆に見える</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="presence"
              checked={presenceVisibility === 'invisible'}
              onChange={() => setPresenceVisibility('invisible')}
            />
            <span className="text-sm tracking-wider">隠す（他者からは消えて見える）</span>
          </label>
        </div>
      </fieldset>

      {error !== null && (
        <p className="text-[#A85040] text-sm tracking-wider">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm disabled:opacity-40 hover:bg-[#161B27]"
        >
          {pending ? '整え中…' : '整える'}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="h-10 px-6 border border-[#2A3142] text-[#9A9484] tracking-[0.4em] text-sm hover:bg-[#161B27]"
        >
          やめる
        </button>
      </div>
    </form>
  )
}

function ProfileDisplay({
  user,
  onEdit,
}: {
  user: ProfileEditorDto
  onEdit: () => void
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-8">
        <SheepAvatar tone={user.tone} size={120} />
        <div className="flex-1">
          <h3 className="text-2xl tracking-wider text-[#ECE6D4] mb-2">
            {user.nickname}
          </h3>
          <p className="text-[11px] text-[#B89B6E] tracking-[0.3em] mb-4">
            {user.presenceVisibility === 'visible' ? '灯ともる · 公開' : '灯ともる · 秘匿'}
          </p>
          {user.bio.length > 0 && (
            <p className="text-sm text-[#D8D2C0] leading-loose whitespace-pre-line max-w-lg">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {user.currentSigns.length > 0 && (
        <div>
          <p className="text-xs text-[#5E5A4F] tracking-[0.3em] mb-3">
            今宵のしるし
          </p>
          <div className="flex flex-wrap gap-2">
            {user.currentSigns.map((s) => (
              <span
                key={s}
                className="px-4 py-2 text-xs tracking-[0.2em] border border-[#B89B6E] bg-[rgba(184,155,110,0.08)] text-[#ECE6D4]"
              >
                {SIGN_LABEL[s]}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onEdit}
        className="h-10 px-6 border border-[#ECE6D4] text-[#ECE6D4] tracking-[0.4em] text-sm hover:bg-[#161B27]"
      >
        整える
      </button>
    </div>
  )
}
