import { ValidationError } from '../shared/errors'
import type { UserId } from '../shared/id'

export type PresenceVisibility = 'visible' | 'invisible'

// しるし — profile-only mood tag. English snake_case in the BE layer;
// the UI (apps/web) maps these to 迷羊苑 expressions (眠れない / 読書中 / ...).
// profile-only (not on posts). having_tea=一服(茶・珈琲・休憩), nightcap=晩酌(酒).
export const SIGN_TAGS = [
  'sleepless',
  'reading',
  'having_tea',
  'nightcap',
  'moon_gazing',
  'nothing',
  'staying_up_late',
] as const

export type SignTag = (typeof SIGN_TAGS)[number]

export const isSignTag = (s: string): s is SignTag => (SIGN_TAGS as readonly string[]).includes(s)

// Avatar tone palette (rendered as SheepBrush color)。
// 10 の色相 (黄/珊瑚/丁子/緑/青緑 ・ 紫紅/桃/青/菫/紫) を、それぞれ
// 鮮やか→淡 の 5 段で並べた 50 色。各行は左ほど濃く右ほど淡い。
// 淡タン (#E8E2D2) は DEFAULT_TONE 兼用のため温存している。
export const TONES = [
  // 黄 / 金
  '#E8B85A',
  '#F4D452',
  '#F8E7B4',
  '#F7F4BE',
  '#FCFCF2',
  // 珊瑚 / 朱
  '#F26A4B',
  '#F68B84',
  '#F7BFA2',
  '#F9CECE',
  '#F1E4E2',
  // 丁子 / 砂
  '#9C7E68',
  '#B2A36C',
  '#D8CDB2',
  '#DED2A2',
  '#E8E2D2',
  // 緑
  '#6E8C50',
  '#74C16E',
  '#AAC6AA',
  '#D0E1CD',
  '#EDF6ED',
  // 青緑 / 鴨
  '#15637A',
  '#6E9AA0',
  '#5EC3C5',
  '#B4E3DF',
  '#E4F8F6',
  // 紫紅 / 葡萄
  '#6E3A5E',
  '#B25179',
  '#BE809F',
  '#E4BED1',
  '#F7E9F0',
  // 桃 / 紅梅
  '#E84B9F',
  '#F36DB1',
  '#F2B8D3',
  '#F5CFE7',
  '#FCEFF6',
  // 青 / 空
  '#0E7EB8',
  '#50B7F0',
  '#86B6D3',
  '#B8DFF2',
  '#DDF0FA',
  // 菫 / 群青
  '#5A6EC0',
  '#5F79E3',
  '#A8B7ED',
  '#CAD2F3',
  '#E9EDFA',
  // 紫 / 藤
  '#8B5FC3',
  '#B17FE7',
  '#C8A8E9',
  '#DEC9F1',
  '#F0E7F8',
] as const

export type Tone = (typeof TONES)[number]

// 「好きな月」— 月相の伝統名 16 種から自分で選ぶ flavor 設定。
// profile card の装飾月相と「3 列 meta · 好きな月」に反映される。
export const FAVORITE_MOONS = [
  '朔',
  '二日月',
  '三日月',
  '上弦の月',
  '十日夜の月',
  '十三夜',
  '小望月',
  '望月',
  '十六夜',
  '立待月',
  '居待月',
  '寝待月',
  '下弦の月',
  '二十六夜',
  '有明月',
  '晦月',
] as const

export type FavoriteMoon = (typeof FAVORITE_MOONS)[number]

export const isFavoriteMoon = (s: string): s is FavoriteMoon =>
  (FAVORITE_MOONS as readonly string[]).includes(s)

export type User = {
  readonly id: UserId
  readonly nickname: string
  readonly bio: string
  readonly tone: Tone
  readonly presenceVisibility: PresenceVisibility
  readonly currentSigns: readonly SignTag[]
  readonly favoriteMoon: FavoriteMoon | null
  readonly joinedAt: Date
}

export type CreateUserInput = {
  id: UserId
  nickname: string
  bio?: string
  tone?: Tone
  presenceVisibility?: PresenceVisibility
  currentSigns?: readonly SignTag[]
  favoriteMoon?: FavoriteMoon | null
  joinedAt: Date
}

const DEFAULT_TONE: Tone = '#E8E2D2'
const NICKNAME_MAX = 20
const BIO_MAX = 200

const graphemeLength = (s: string): number => [...s].length

const isValidTone = (t: string): t is Tone => (TONES as readonly string[]).includes(t)

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
  const favoriteMoon = input.favoriteMoon ?? null
  if (favoriteMoon !== null && !isFavoriteMoon(favoriteMoon)) {
    throw new ValidationError('favoriteMoon must be one of the predefined names')
  }
  return {
    id: input.id,
    nickname: input.nickname,
    bio,
    tone,
    presenceVisibility: input.presenceVisibility ?? 'visible',
    currentSigns: input.currentSigns ?? [],
    favoriteMoon,
    joinedAt: input.joinedAt,
  }
}
