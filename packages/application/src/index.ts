export type { Clock } from './ports/clock'
export { systemClock } from './ports/clock'
export type { BusinessHoursGuard } from './ports/business-hours-guard'
export { createBusinessHoursGuard } from './ports/business-hours-guard'
export type { IdGenerator } from './ports/id-generator'
export { systemIdGenerator } from './ports/id-generator'

// Use cases — User
export type {
  RegisterUser,
  RegisterUserInput,
  RegisterUserDeps,
} from './use-cases/user/register-user'
export { createRegisterUser } from './use-cases/user/register-user'
export type {
  UpdateProfile,
  UpdateProfileInput,
  UpdateProfilePatch,
  UpdateProfileDeps,
} from './use-cases/user/update-profile'
export { createUpdateProfile } from './use-cases/user/update-profile'
export type {
  ListUsers,
  ListUsersInput,
  ListUsersDeps,
} from './use-cases/user/list-users'
export { createListUsers } from './use-cases/user/list-users'

// Use cases — Conversation
export type {
  StartConversationByPost,
  StartConversationByPostInput,
  StartConversationByPostDeps,
} from './use-cases/conversation/start-conversation-by-post'
export { createStartConversationByPost } from './use-cases/conversation/start-conversation-by-post'
export type {
  StartConversationDirect,
  StartConversationDirectInput,
  StartConversationDirectDeps,
} from './use-cases/conversation/start-conversation-direct'
export { createStartConversationDirect } from './use-cases/conversation/start-conversation-direct'
export type {
  ListConversations,
  ListConversationsInput,
  ListConversationsDeps,
} from './use-cases/conversation/list-conversations'
export { createListConversations } from './use-cases/conversation/list-conversations'

// Use cases — Message
export type {
  SendMessage,
  SendMessageInput,
  SendMessageDeps,
} from './use-cases/message/send-message'
export { createSendMessage } from './use-cases/message/send-message'
export type {
  MarkAsRead,
  MarkAsReadInput,
  MarkAsReadDeps,
} from './use-cases/message/mark-as-read'
export { createMarkAsRead } from './use-cases/message/mark-as-read'
export type {
  ListMessages,
  ListMessagesInput,
  ListMessagesDeps,
} from './use-cases/message/list-messages'
export { createListMessages } from './use-cases/message/list-messages'

// Use cases — Post
export type {
  CreatePost,
  CreatePostInput,
  CreatePostDeps,
} from './use-cases/post/create-post'
export { createCreatePost } from './use-cases/post/create-post'
export type {
  DeletePost,
  DeletePostInput,
  DeletePostDeps,
} from './use-cases/post/delete-post'
export { createDeletePost } from './use-cases/post/delete-post'
export type {
  ListTimeline,
  ListTimelineInput,
  ListTimelineDeps,
} from './use-cases/post/list-timeline'
export { createListTimeline } from './use-cases/post/list-timeline'
export type {
  ListOwnPosts,
  ListOwnPostsInput,
  ListOwnPostsDeps,
} from './use-cases/post/list-own-posts'
export { createListOwnPosts } from './use-cases/post/list-own-posts'

// Use cases — Like
export type {
  LikePost,
  LikePostInput,
  LikePostDeps,
} from './use-cases/like/like-post'
export { createLikePost } from './use-cases/like/like-post'
export type {
  UnlikePost,
  UnlikePostInput,
  UnlikePostDeps,
} from './use-cases/like/unlike-post'
export { createUnlikePost } from './use-cases/like/unlike-post'

// Use cases — Block
export type {
  BlockUser,
  BlockUserInput,
  BlockUserDeps,
} from './use-cases/block/block-user'
export { createBlockUser } from './use-cases/block/block-user'
export type {
  UnblockUser,
  UnblockUserInput,
  UnblockUserDeps,
} from './use-cases/block/unblock-user'
export { createUnblockUser } from './use-cases/block/unblock-user'

// Use cases — Presence
export type {
  UpdatePresence,
  UpdatePresenceInput,
  UpdatePresenceDeps,
} from './use-cases/presence/update-presence'
export { createUpdatePresence } from './use-cases/presence/update-presence'
export type {
  ListOnlineUsers,
  ListOnlineUsersInput,
  ListOnlineUsersDeps,
} from './use-cases/presence/list-online-users'
export { createListOnlineUsers } from './use-cases/presence/list-online-users'

// Use cases — Typing
export type {
  UpdateTyping,
  UpdateTypingInput,
  UpdateTypingDeps,
} from './use-cases/typing/update-typing'
export { createUpdateTyping } from './use-cases/typing/update-typing'
export type {
  ClearTyping,
  ClearTypingInput,
  ClearTypingDeps,
} from './use-cases/typing/clear-typing'
export { createClearTyping } from './use-cases/typing/clear-typing'

// Use cases — Login history / Presence event log / Profile stats (β-1)
export type {
  RecordLogin,
  RecordLoginInput,
  RecordLoginDeps,
} from './use-cases/login-history/record-login'
export { createRecordLogin } from './use-cases/login-history/record-login'
export type {
  RecordPresenceEvent,
  RecordPresenceEventInput,
  RecordPresenceEventDeps,
} from './use-cases/presence-event/record-presence-event'
export { createRecordPresenceEvent } from './use-cases/presence-event/record-presence-event'
export type {
  GetProfileStats,
  GetProfileStatsInput,
  GetProfileStatsDeps,
  ProfileStats,
} from './use-cases/profile/get-profile-stats'
export { createGetProfileStats } from './use-cases/profile/get-profile-stats'
export type {
  GetHourlyPresenceChart,
  GetHourlyPresenceChartInput,
  GetHourlyPresenceChartDeps,
  HourlyPresenceBucket,
} from './use-cases/profile/get-hourly-presence-chart'
export { createGetHourlyPresenceChart } from './use-cases/profile/get-hourly-presence-chart'
export type {
  GetCloseSheep,
  GetCloseSheepInput,
  GetCloseSheepDeps,
  CloseSheep,
} from './use-cases/profile/get-close-sheep'
export { createGetCloseSheep } from './use-cases/profile/get-close-sheep'

// Presentation utilities (pure, no business state)
export { getMoonPhase } from './utils/moon-phase'
