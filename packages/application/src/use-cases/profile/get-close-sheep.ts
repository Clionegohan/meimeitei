import type {
  BlockRepository,
  ConversationRepository,
  MessageRepository,
  UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type CloseSheep = {
  userId: UserId
  messageCount: number
}

export type GetCloseSheepDeps = {
  conversationRepository: ConversationRepository
  messageRepository: MessageRepository
  blockRepository: BlockRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type GetCloseSheepInput = { userId: UserId }

export type GetCloseSheep = (
  input: GetCloseSheepInput,
) => Promise<readonly CloseSheep[]>

const WINDOW_DAYS = 30
const LIMIT = 3

// 直近 30 日の DM メッセージ数を相手ユーザー単位で合算し、降順 Top 3 を返す。
// - 同じ相手で複数 conversation がある場合はメッセージ数を合算（spec L50）
// - block は無向で除外（listConversations と同じ流儀）
// - 「親しい羊」は本人のみ可視（spec L51）。本 use case の呼出側がそれを保証
export const createGetCloseSheep = (
  deps: GetCloseSheepDeps,
): GetCloseSheep => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const now = deps.clock.now()
  const from = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const convs = await deps.conversationRepository.listByUser(input.userId)
  if (convs.length === 0) return []

  const ids = convs.map((c) => c.id)
  const counts = await deps.messageRepository.countByConversationsInWindow(
    ids,
    from,
    now,
  )

  const perPeer = new Map<UserId, number>()
  for (const conv of convs) {
    const peer = conv.participantIds.find((p) => p !== input.userId)
    if (peer === undefined) continue
    perPeer.set(peer, (perPeer.get(peer) ?? 0) + (counts.get(conv.id) ?? 0))
  }

  const candidates: CloseSheep[] = []
  for (const [peer, c] of perPeer) {
    if (c === 0) continue
    const blocked = await deps.blockRepository.existsBetween(input.userId, peer)
    if (blocked) continue
    candidates.push({ userId: peer, messageCount: c })
  }

  candidates.sort((a, b) => b.messageCount - a.messageCount)
  return candidates.slice(0, LIMIT)
}
