import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import {
  createConversation,
  createLike,
  createMessage,
  createPost,
  createPresence,
  createPresenceEvent,
  nightIdOf,
  type ConversationId,
  type FavoriteMoon,
  type LikeId,
  type MessageId,
  type PostId,
  type SignTag,
  type Tone,
  type UserId,
} from '@me-me-en/domain'
import {
  authIdentityRepository,
  conversationRepository,
  likeRepository,
  loginHistoryRepository,
  messageRepository,
  postRepository,
  presenceEventRepository,
  presenceRepository,
  userRepository,
} from '@/server/di'

// dev only。E2E_TEST_ENABLED=true + NODE_ENV !== 'production' で動く。
// alice を主役とした「世界が一通り埋まった」状態を 1 リクエストで構築する。
// GET /api/test/seed-dummy[?as=alice] でブラウザから叩ける。
// 終わったら alice の session cookie を set して /chats へ redirect する。

const isAllowed = (): boolean =>
  process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_ENABLED === 'true'

const SESSION_COOKIE_NAME = 'authjs.session-token'

// JST 22:00 - 翌 05:00 内の Date を返す。日付ベース + 時刻 (h, m)。
const jst = (
  y: number,
  mon: number,
  d: number,
  h: number,
  min: number,
): Date => new Date(Date.UTC(y, mon - 1, d, h - 9, min, 0))

type SeedUser = {
  id: UserId
  nickname: string
  tone: Tone
  bio: string
  signs: readonly SignTag[]
  favoriteMoon: FavoriteMoon | null
  presenceVisible: boolean
  online: boolean
  email: string
  providerId: string
}

const USERS: readonly SeedUser[] = [
  {
    id: 'u_dev_alice' as UserId,
    nickname: 'alice',
    tone: '#E8E2D2' as Tone,
    bio: '夜の三時頃、ふと目が覚めて、暗い天井を見ていることが多いです。\nほうじ茶と、文庫本と、月を眺めるのが好きです。',
    signs: ['sleepless', 'moon_gazing'] as readonly SignTag[],
    favoriteMoon: '居待月',
    presenceVisible: true,
    online: true,
    email: 'alice@local.dev',
    providerId: 'google-sub-dev-alice',
  },
  {
    id: 'u_dev_bob' as UserId,
    nickname: '月見羊',
    tone: '#E8E2D2' as Tone,
    bio: '月を眺めるのが好きです。',
    signs: ['moon_gazing'] as readonly SignTag[],
    favoriteMoon: '十三夜',
    presenceVisible: true,
    online: true,
    email: 'bob@local.dev',
    providerId: 'google-sub-dev-bob',
  },
  {
    id: 'u_dev_carol' as UserId,
    nickname: '茶の羊',
    tone: '#D8B890' as Tone,
    bio: 'ほうじ茶を、一杯。',
    signs: ['having_tea'] as readonly SignTag[],
    favoriteMoon: '小望月',
    presenceVisible: true,
    online: true,
    email: 'carol@local.dev',
    providerId: 'google-sub-dev-carol',
  },
  {
    id: 'u_dev_dave' as UserId,
    nickname: '読書羊',
    tone: '#B8A480' as Tone,
    bio: '本を読み返しています。',
    signs: ['reading'] as readonly SignTag[],
    favoriteMoon: '下弦の月',
    presenceVisible: true,
    online: false,
    email: 'dave@local.dev',
    providerId: 'google-sub-dev-dave',
  },
  {
    id: 'u_dev_eve' as UserId,
    nickname: '星見羊',
    tone: '#E8D2B8' as Tone,
    bio: '星を見ています。',
    signs: ['nothing'] as readonly SignTag[],
    favoriteMoon: '望月',
    presenceVisible: false, // 灯火秘匿 (asymmetric stealth)
    online: false,
    email: 'eve@local.dev',
    providerId: 'google-sub-dev-eve',
  },
]

// 直近の「営業時間入り」の Date を返す。JST 22:00 / 23:00 / 24:00 / ... / 翌 04:00 を時刻として
// past から逆算した夜の中の一点を作る。
const aFewMinutesAgo = (mins: number): Date =>
  new Date(Date.now() - mins * 60_000)

export async function GET(req: Request): Promise<NextResponse> {
  if (!isAllowed()) {
    return NextResponse.json(
      { error: 'seed-dummy is disabled. Set E2E_TEST_ENABLED=true.' },
      { status: 403 },
    )
  }
  const url = new URL(req.url)
  const asNickname = url.searchParams.get('as') ?? 'alice'
  const me = USERS.find((u) => u.nickname === asNickname) ?? USERS[0]
  if (me === undefined) {
    return NextResponse.json({ error: 'no users to seed' }, { status: 500 })
  }

  const now = new Date()

  // ─── 1. Users + AuthIdentity ─────────────────────────────────────
  const joinedBase = jst(2026, 4, 1, 22, 30) // 過去にお店に来ていた人 (令和八年 卯月 一日)
  for (const [i, u] of USERS.entries()) {
    await userRepository.save({
      id: u.id,
      nickname: u.nickname,
      bio: u.bio,
      tone: u.tone,
      presenceVisibility: u.presenceVisible ? 'visible' : 'invisible',
      currentSigns: u.signs,
      favoriteMoon: u.favoriteMoon,
      // 入店初日を羊ごとにずらし、「いつから来ているか」に変化を持たせる
      joinedAt: new Date(joinedBase.getTime() - i * 23 * 86_400_000),
    })
    await authIdentityRepository.upsert({
      provider: 'google',
      providerId: u.providerId,
      email: u.email,
      userId: u.id,
    })
  }

  // ─── 2. Conversations: alice ↔ bob / carol / dave ────────────────
  const aliceId = USERS[0]!.id
  const bobId = USERS[1]!.id
  const carolId = USERS[2]!.id
  const daveId = USERS[3]!.id

  type Pair = { peer: UserId; convId: string; messages: number }
  const pairs: readonly Pair[] = [
    { peer: bobId, convId: 'c_dev_alice_bob', messages: 12 },
    { peer: carolId, convId: 'c_dev_alice_carol', messages: 8 },
    { peer: daveId, convId: 'c_dev_alice_dave', messages: 5 },
  ]

  for (const pair of pairs) {
    const conv = createConversation({
      id: pair.convId as ConversationId,
      participants: [aliceId, pair.peer],
      rootPostId: null,
      openedAt: jst(2026, 4, 15, 22, 0), // 42 夜目相当
    })
    await conversationRepository.save(conv)

    // メッセージ：交互、最後は alice 寄り、ある程度連続発話を含むパターン
    for (let i = 0; i < pair.messages; i++) {
      const sender = i % 3 === 0 ? aliceId : i % 3 === 1 ? pair.peer : pair.peer
      const sentAt = aFewMinutesAgo((pair.messages - i) * 7)
      const body =
        i === 0
          ? '眠れない夜が、続いていますね。'
          : i === 1
          ? 'ええ、今夜もまた、ここに来てしまいました。'
          : i === pair.messages - 1
          ? 'お休みなさい。'
          : `${i + 1} 通目のひとこと。\n夜は更けるばかりです。`
      const m = createMessage({
        id: `m_${pair.convId}_${i}` as MessageId,
        conversationId: conv.id,
        senderId: sender,
        body,
        sentAt,
      })
      await messageRepository.save(m)
    }
  }

  // ─── 3. Posts (タイムライン) ────────────────────────────────────
  // 各 user 数件、postedAt は 今夜の営業時間内に散らす
  const tonight = new Date()
  let postCounter = 0
  for (const u of USERS) {
    const count = u.id === aliceId ? 4 : 2
    for (let i = 0; i < count; i++) {
      const postedAt = aFewMinutesAgo(15 + postCounter * 9)
      try {
        const p = createPost({
          id: `p_dev_${u.id}_${i}` as PostId,
          authorId: u.id,
          body:
            i === 0
              ? '夜の三時頃、ふと目が覚めて、暗い天井を見ていました。'
              : `${u.nickname} の独り言、その ${i + 1}。\n誰かに、夜空のことを話したくなりました。`,
          postedAt,
        })
        await postRepository.save(p)
        postCounter++
      } catch {
        // nightIdOf が business hours guard で throw する可能性あり → skip
      }
    }
    void tonight // referenced
  }

  // ─── 4. Likes ──────────────────────────────────────────────────
  // bob, carol, dave が alice の post に like
  const alicePosts = await postRepository.list({ authorId: aliceId })
  const likers = [bobId, carolId, daveId]
  let likeCounter = 0
  for (const post of alicePosts) {
    for (const likerId of likers) {
      try {
        const like = createLike({
          id: `l_dev_${likeCounter++}` as LikeId,
          postId: post.id,
          userId: likerId,
          addedAt: aFewMinutesAgo(5),
        })
        await likeRepository.save(like)
      } catch {
        // すでにある or 何かしらの validation で skip
      }
    }
  }

  // ─── 5. Login history (alice 中心) ─────────────────────────────
  // 過去 30 夜のうち、ランダム 22 夜 alice が来店。連続 7 夜 (consecutive) を最後に確保。
  const loginSeed = (userId: UserId, nights: number) => {
    let recorded = 0
    for (let dayBack = 0; dayBack < 30 && recorded < nights; dayBack++) {
      // 最後の 7 夜は確定、それ以外は 2 日に 1 夜
      const include = dayBack < 7 || dayBack % 2 === 0
      if (!include) continue
      const ts = new Date(now.getTime() - dayBack * 24 * 60 * 60_000)
      // JST 23:00 帯にする
      const ts2200Jst = jst(
        ts.getUTCFullYear(),
        ts.getUTCMonth() + 1,
        ts.getUTCDate(),
        23,
        Math.floor(Math.random() * 60),
      )
      try {
        const nightId = nightIdOf(ts2200Jst)
        void loginHistoryRepository.recordIfFirstOfNight(
          userId,
          nightId,
          ts2200Jst,
        )
        recorded++
      } catch {
        // nightIdOf が business hours 外で throw する場合 → skip
      }
    }
  }
  await Promise.resolve(loginSeed(aliceId, 22))
  await Promise.resolve(loginSeed(bobId, 18))
  await Promise.resolve(loginSeed(carolId, 14))

  // ─── 6. Presence event (alice の在席チャート埋め用) ─────────────
  // 過去 30 日、JST 22-05 帯にランダム online を撒く。ピークは丑三つ時 (JST 02:30) 前後。
  for (let dayBack = 0; dayBack < 30; dayBack++) {
    const baseDay = new Date(now.getTime() - dayBack * 24 * 60 * 60_000)
    const y = baseDay.getUTCFullYear()
    const mon = baseDay.getUTCMonth() + 1
    const d = baseDay.getUTCDate()
    // 22-04 時の各 hour、ピーク時 hour=2 は確実に online を 3 件、他は 1-2 件
    const hours = [22, 23, 0, 1, 2, 3, 4]
    for (const h of hours) {
      const count = h === 2 ? 3 : Math.random() < 0.6 ? 1 : 0
      for (let i = 0; i < count; i++) {
        const occurredAt = jst(y, mon, d, h, 10 + i * 12)
        const ev = createPresenceEvent({
          userId: aliceId,
          type: 'online',
          occurredAt,
        })
        void presenceEventRepository.record(ev)
      }
    }
  }

  // ─── 7. Current presence state (RightRail の灯ともる羊用) ─────────
  // online フラグの user だけ presenceRepository.set で書き込み
  for (const u of USERS) {
    if (u.online) {
      const p = createPresence({
        userId: u.id,
        status: 'online',
        lastSeenAt: aFewMinutesAgo(1),
      })
      await presenceRepository.set(p)
    }
  }

  // ─── 8. Block: なし (デフォルトで OK)。必要になったら blockRepository.save を埋める

  // ─── 9. me (alice) として session cookie を発行 ────────────────
  const secret = process.env.AUTH_SECRET
  if (secret === undefined || secret.length === 0) {
    return NextResponse.json({ error: 'AUTH_SECRET not set' }, { status: 500 })
  }
  const token = await encode({
    token: {
      sub: me.providerId,
      email: me.email,
      userId: me.id,
      providerId: me.providerId,
    },
    secret,
    salt: SESSION_COOKIE_NAME,
  })

  const to = url.searchParams.get('to') ?? '/timeline'
  const response = NextResponse.redirect(new URL(to, url.origin), { status: 302 })
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
  })
  return response
}
