import type { UserId } from '../shared/id'

// AuthIdentity — 外部 OAuth provider (Google 等) と me-me-en User.id の紐付け。
// MVPα では in-memory Map で運用、β-5-c から Postgres に永続化する。
//
// `providerId` は provider 側のユーザー識別子 (例: Google の `sub`)。
// `email` は表示・サポート目的で参考保持するだけ、login の唯一性は
// `(provider, providerId)` で保証する。
export type AuthIdentity = {
  readonly provider: 'google'
  readonly providerId: string
  readonly email: string | null
  readonly userId: UserId
}
