import { ValidationError } from '../shared/errors'
import type { UserId } from '../shared/id'

export type PresenceVisibility = 'visible' | 'invisible'

// 「しるし」: profile の「今宵のしるし」と post の「今宵の様態」を統合した集合。
// design v2 で両者の用語が重複していたため、ここでは 1 つの enum として扱い、
// presentation 側で文脈ごとに表示する。
export const SIGN_TAGS = [
  '眠れない',
  '寝る前に',
  '独り言',
  'しりとり',
  '読書中',
  'お茶を一杯',
  '月を眺める',
  '何でもない',
  '声を聞きたい',
  '夜更かし',
] as const

export type SignTag = (typeof SIGN_TAGS)[number]

export const isSignTag = (s: string): s is SignTag =>
  (SIGN_TAGS as readonly string[]).includes(s)

export type User = {
  readonly id: UserId
  readonly nickname: string
  readonly bio: string
  readonly tone: string
  readonly sealCharacter: string
  readonly presenceVisibility: PresenceVisibility
  readonly currentSigns: readonly SignTag[]
  readonly joinedAt: Date
}

export type CreateUserInput = {
  id: UserId
  nickname: string
  bio?: string
  tone?: string
  sealCharacter: string
  presenceVisibility?: PresenceVisibility
  currentSigns?: readonly SignTag[]
  joinedAt: Date
}

const DEFAULT_TONE = '#E8E2D2'

export const createUser = (input: CreateUserInput): User => {
  if (input.nickname.trim().length === 0) {
    throw new ValidationError('nickname must not be empty')
  }
  // spread で grapheme 単位（漢字 1 文字 = 1 要素）にする
  if ([...input.sealCharacter].length !== 1) {
    throw new ValidationError('sealCharacter must be exactly one character')
  }
  return {
    id: input.id,
    nickname: input.nickname,
    bio: input.bio ?? '',
    tone: input.tone ?? DEFAULT_TONE,
    sealCharacter: input.sealCharacter,
    presenceVisibility: input.presenceVisibility ?? 'visible',
    currentSigns: input.currentSigns ?? [],
    joinedAt: input.joinedAt,
  }
}
