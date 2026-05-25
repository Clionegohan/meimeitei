declare const __brand: unique symbol

export type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type UserId = Brand<string, 'UserId'>
export type ConversationId = Brand<string, 'ConversationId'>
export type MessageId = Brand<string, 'MessageId'>
export type PostId = Brand<string, 'PostId'>
export type ReplyId = Brand<string, 'ReplyId'>
export type LikeId = Brand<string, 'LikeId'>
export type BlockId = Brand<string, 'BlockId'>
