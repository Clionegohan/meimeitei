import {
  createBlockUser,
  createBusinessHoursGuard,
  createClearTyping,
  createCreatePost,
  createDeletePost,
  createLikePost,
  createListConversations,
  createListMessages,
  createListOnlineUsers,
  createListOwnPosts,
  createListTimeline,
  createMarkAsRead,
  createRegisterUser,
  createSendMessage,
  createStartConversationByPost,
  createStartConversationDirect,
  createUnblockUser,
  createUnlikePost,
  createUpdatePresence,
  createUpdateProfile,
  createUpdateTyping,
  systemClock,
  systemIdGenerator,
} from '@me-me-en/application'
import {
  blockRepository,
  conversationRepository,
  likeRepository,
  messageRepository,
  postRepository,
  presenceRepository,
  typingRepository,
  userRepository,
} from './repositories'

// Shared ports
export const clock = systemClock
export const idGenerator = systemIdGenerator
export const businessHoursGuard = createBusinessHoursGuard(clock)

// User
export const registerUser = createRegisterUser({
  userRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const updateProfile = createUpdateProfile({
  userRepository,
  businessHoursGuard,
})

// Conversation
export const startConversationByPost = createStartConversationByPost({
  conversationRepository,
  postRepository,
  blockRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const startConversationDirect = createStartConversationDirect({
  conversationRepository,
  userRepository,
  blockRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const listConversations = createListConversations({
  conversationRepository,
  blockRepository,
  businessHoursGuard,
})

// Message
export const sendMessage = createSendMessage({
  conversationRepository,
  messageRepository,
  blockRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const markAsRead = createMarkAsRead({
  conversationRepository,
  messageRepository,
  clock,
  businessHoursGuard,
})
export const listMessages = createListMessages({
  conversationRepository,
  messageRepository,
  businessHoursGuard,
})

// Post
export const createPost = createCreatePost({
  postRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const deletePost = createDeletePost({
  postRepository,
  clock,
  businessHoursGuard,
})
export const listTimeline = createListTimeline({
  postRepository,
  blockRepository,
  clock,
  businessHoursGuard,
})
export const listOwnPosts = createListOwnPosts({
  postRepository,
  businessHoursGuard,
})

// Like
export const likePost = createLikePost({
  postRepository,
  likeRepository,
  blockRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const unlikePost = createUnlikePost({
  likeRepository,
  businessHoursGuard,
})

// Block
export const blockUser = createBlockUser({
  blockRepository,
  clock,
  idGenerator,
  businessHoursGuard,
})
export const unblockUser = createUnblockUser({
  blockRepository,
  businessHoursGuard,
})

// Presence
export const updatePresence = createUpdatePresence({
  presenceRepository,
  clock,
  businessHoursGuard,
})
export const listOnlineUsers = createListOnlineUsers({
  userRepository,
  presenceRepository,
  blockRepository,
  businessHoursGuard,
})

// Typing
export const updateTyping = createUpdateTyping({
  conversationRepository,
  typingRepository,
  blockRepository,
  clock,
  businessHoursGuard,
})
export const clearTyping = createClearTyping({
  typingRepository,
  businessHoursGuard,
})
