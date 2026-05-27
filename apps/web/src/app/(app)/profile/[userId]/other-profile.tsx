'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { FavoriteMoon, SignTag, Tone } from '@me-me-en/domain'
import { startDirectMessageAction } from '../actions'
import { MoonSvg } from '../../_components/moon-svg'
import { SumiDivider } from '../../_components/sumi-divider'
import { phaseOfFavoriteMoon } from '../../_components/moon-name'
import { formatJapaneseDate } from '../../_components/kanji'
import { SheepAvatar } from '../_components/sheep-avatar'

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

// 他者からの公開範囲 (spec 51): avatar / nickname / bio / しるし / 好きな月 / 入店初日。
// 来店帳・在席チャート・親しい羊 は含めない (本人のみ可視、page.tsx で取得もしない)。
export type OtherUserDto = {
  id: string
  nickname: string
  bio: string
  tone: Tone
  currentSigns: readonly SignTag[]
  favoriteMoon: FavoriteMoon | null
  joinedAt: string
  presenceVisible: boolean
}

export function OtherProfile({ user }: { user: OtherUserDto }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const startDm = () => {
    if (pending) return
    setError(null)
    startTransition(async () => {
      const result = await startDirectMessageAction({ partnerId: user.id })
      if (result.ok) router.push(`/chats/${result.conversationId}`)
      else setError(result.error)
    })
  }

  const joinedAtJa = formatJapaneseDate(new Date(user.joinedAt))
  const statusLabel = user.presenceVisible ? '灯る · 今宵 在席' : '灯 秘匿 もしくは 不在'
  // 装飾月: 好きな月が設定されていればその月相、未設定なら居待月 fallback。
  const moonPhaseForCard = phaseOfFavoriteMoon(user.favoriteMoon) ?? 17 / 29.5305882

  return (
    <div>
      {/* heading */}
      <div className="flex items-baseline justify-between">
        <div>
          <div
            className="text-[22px] md:text-[32px]"
            style={{ letterSpacing: '0.2em', color: '#ECE6D4', fontWeight: 300 }}
          >
            {user.nickname} さんの席
          </div>
          <div
            style={{ fontSize: 14, color: '#5E5A4F', letterSpacing: '0.25em', marginTop: 6 }}
          >
            御覧いただける、この羊のしつらえ。
          </div>
        </div>
        <button
          type="button"
          onClick={startDm}
          disabled={pending}
          className="hover:bg-[#161B27] transition-colors disabled:opacity-40 shrink-0"
          style={{
            height: 36,
            padding: '0 22px',
            border: '1px solid #ECE6D4',
            background: 'transparent',
            color: '#ECE6D4',
            fontSize: 14,
            letterSpacing: '0.3em',
          }}
        >
          {pending ? 'ご案内中…' : '話しかける'}
        </button>
      </div>

      <div style={{ marginTop: 28 }}>
        <SumiDivider width={760} opacity={0.5} />
      </div>

      {/* Profile card — 己 と同じ意匠 (SP は縦積み) */}
      <div
        className="relative overflow-hidden mt-7 flex flex-col md:flex-row gap-6 md:gap-9 p-6 md:px-9 md:py-8"
        style={{ background: '#10141E', border: '1px solid #1F2533' }}
      >
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
            style={{ width: 132, height: 132, background: '#161B27', border: '1px solid #2A3142' }}
          >
            <SheepAvatar tone={user.tone} size={124} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 relative" style={{ zIndex: 2 }}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{ fontSize: 34, color: '#ECE6D4', letterSpacing: '0.12em', fontWeight: 400 }}
            >
              {user.nickname}
            </span>
          </div>

          <div
            className="flex items-center"
            style={{
              fontSize: 14,
              color: user.presenceVisible ? '#B89B6E' : '#5E5A4F',
              letterSpacing: '0.3em',
              marginBottom: 18,
              gap: 8,
            }}
          >
            {user.presenceVisible && (
              <span
                className="rounded-full"
                aria-hidden
                style={{ width: 6, height: 6, background: '#B89B6E', boxShadow: '0 0 6px #B89B6E' }}
              />
            )}
            {statusLabel}
          </div>

          {user.bio.length > 0 && (
            <p
              className="whitespace-pre-line"
              style={{ fontSize: 18, color: '#D8D2C0', letterSpacing: '0.04em', lineHeight: 2, maxWidth: 480 }}
            >
              {user.bio}
            </p>
          )}

          {/* 3 列 meta (己 と同じ。SP は折り返し) */}
          <div className="flex flex-wrap mt-6 pt-[18px] gap-x-9 gap-y-4 border-t border-[#1F2533]">
            <MetaCell label="入店初日" value={joinedAtJa} />
            <MetaCell label="好きな月" value={user.favoriteMoon ?? 'まだ'} />
            <MetaCell label="よく置く文" value="独り言" />
          </div>
        </div>
      </div>

      {/* 今宵のしるし */}
      <div className="mt-7">
        <SectionTitle title="今 宵 の し る し" />
        {user.currentSigns.length === 0 ? (
          <p style={{ fontSize: 14, color: '#5E5A4F', letterSpacing: '0.15em' }}>
            今宵は しるしを 掲げていない。
          </p>
        ) : (
          <div className="flex flex-wrap" style={{ gap: 10 }}>
            {user.currentSigns.map((s) => (
              <span
                key={s}
                style={{
                  padding: '9px 20px',
                  border: '1px solid #B89B6E',
                  background: 'rgba(184,155,110,0.08)',
                  color: '#ECE6D4',
                  fontSize: 16,
                  letterSpacing: '0.2em',
                }}
              >
                {SIGN_LABEL[s]}
              </span>
            ))}
          </div>
        )}
      </div>

      {error !== null && (
        <p className="mt-4" style={{ fontSize: 14, color: '#A85040', letterSpacing: '0.05em' }}>
          {error}
        </p>
      )}
    </div>
  )
}

const MetaCell = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontSize: 12, color: '#5E5A4F', letterSpacing: '0.25em' }}>{label}</div>
    <div style={{ fontSize: 18, color: '#ECE6D4', marginTop: 4, letterSpacing: '0.06em' }}>
      {value}
    </div>
  </div>
)

const SectionTitle = ({ title }: { title: string }) => (
  <div style={{ fontSize: 18, color: '#ECE6D4', letterSpacing: '0.25em', marginBottom: 14 }}>
    {title}
  </div>
)
