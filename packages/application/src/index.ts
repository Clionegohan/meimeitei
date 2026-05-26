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
