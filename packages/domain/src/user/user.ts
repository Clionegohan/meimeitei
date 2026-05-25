import { ValidationError } from '../shared/errors'
import type { UserId } from '../shared/id'

export type PresenceVisibility = 'visible' | 'invisible'

// しるし — profile-only mood tag. English snake_case in the BE layer;
// the UI (apps/web) maps these to 迷羊苑 expressions (眠れない / 読書中 / ...).
// Per spec: 8 tags, profile-only (not on posts).
export const SIGN_TAGS = [
  'sleepless',
  'reading',
  'having_tea',
  'moon_gazing',
  'nothing',
  'wanting_to_hear',
  'shiritori',
  'staying_up_late',
] as const

export type SignTag = (typeof SIGN_TAGS)[number]

export const isSignTag = (s: string): s is SignTag =>
  (SIGN_TAGS as readonly string[]).includes(s)

// Avatar tone palette (design-derived; rendered as SheepBrush color).
export const TONES = ['#E8E2D2', '#D8B890', '#D8CFB8', '#C8BFA0', '#B8A480', '#E8D2B8'] as const

export type Tone = (typeof TONES)[number]

export type User = {
  readonly id: UserId
  readonly nickname: string
  readonly bio: string
  readonly tone: Tone
  readonly presenceVisibility: PresenceVisibility
  readonly currentSigns: readonly SignTag[]
  readonly joinedAt: Date
}

export type CreateUserInput = {
  id: UserId
  nickname: string
  bio?: string
  tone?: Tone
  presenceVisibility?: PresenceVisibility
  currentSigns?: readonly SignTag[]
  joinedAt: Date
}

const DEFAULT_TONE: Tone = '#E8E2D2'
const NICKNAME_MAX = 20
const BIO_MAX = 200

const graphemeLength = (s: string): number => [...s].length

const isValidTone = (t: string): t is Tone =>
  (TONES as readonly string[]).includes(t)

export const createUser = (input: CreateUserInput): User => {
  if (input.nickname.trim().length === 0) {
    throw new ValidationError('nickname must not be empty')
  }
  if (graphemeLength(input.nickname) > NICKNAME_MAX) {
    throw new ValidationError(`nickname must be at most ${NICKNAME_MAX} characters`)
  }
  const bio = input.bio ?? ''
  if (graphemeLength(bio) > BIO_MAX) {
    throw new ValidationError(`bio must be at most ${BIO_MAX} characters`)
  }
  const tone = input.tone ?? DEFAULT_TONE
  if (!isValidTone(tone)) {
    throw new ValidationError('tone must be one of the predefined palette')
  }
  return {
    id: input.id,
    nickname: input.nickname,
    bio,
    tone,
    presenceVisibility: input.presenceVisibility ?? 'visible',
    currentSigns: input.currentSigns ?? [],
    joinedAt: input.joinedAt,
  }
}
