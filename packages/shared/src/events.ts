import { z } from 'zod'

// Client → Server Events
export const JoinEventSchema = z.object({
  type: z.literal('join'),
  name: z.string().trim().min(1).max(20),
})

export const AuthenticateEventSchema = z.object({
  type: z.literal('authenticate'),
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(20),
})

export const SeatToggleEventSchema = z.object({
  type: z.literal('seat_toggle'),
})

export const SendMessageEventSchema = z.object({
  type: z.literal('send_message'),
  text: z.string().min(1).max(500),
})

export const ClientEventSchema = z.discriminatedUnion('type', [
  JoinEventSchema,
  AuthenticateEventSchema,
  SeatToggleEventSchema,
  SendMessageEventSchema,
])

export type ClientEvent = z.infer<typeof ClientEventSchema>
export type JoinEvent = z.infer<typeof JoinEventSchema>
export type AuthenticateEvent = z.infer<typeof AuthenticateEventSchema>
export type SeatToggleEvent = z.infer<typeof SeatToggleEventSchema>
export type SendMessageEvent = z.infer<typeof SendMessageEventSchema>

// Server → Client Events
export const WelcomeEventSchema = z.object({
  type: z.literal('welcome'),
  userId: z.string(),
})

export const StateSyncEventSchema = z.object({
  type: z.literal('state_sync'),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      seated: z.boolean(),
    })
  ),
})

export const UserJoinedEventSchema = z.object({
  type: z.literal('user_joined'),
  userId: z.string(),
  name: z.string(),
})

export const UserLeftEventSchema = z.object({
  type: z.literal('user_left'),
  userId: z.string(),
})

export const SeatChangedEventSchema = z.object({
  type: z.literal('seat_changed'),
  userId: z.string(),
  seated: z.boolean(),
})

export const MessageEventSchema = z.object({
  type: z.literal('message'),
  userId: z.string(),
  name: z.string(),
  text: z.string(),
  timestamp: z.number(),
})

export const AuthenticatedEventSchema = z.object({
  type: z.literal('authenticated'),
  userId: z.string(),
  session: z.object({
    connectedAt: z.number(),
    serverTime: z.number(),
  }),
})

export const HistorySyncEventSchema = z.object({
  type: z.literal('history_sync'),
  messages: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      text: z.string(),
      timestamp: z.number(),
    })
  ),
})

export const ServerEventSchema = z.discriminatedUnion('type', [
  WelcomeEventSchema,
  StateSyncEventSchema,
  UserJoinedEventSchema,
  UserLeftEventSchema,
  SeatChangedEventSchema,
  MessageEventSchema,
  AuthenticatedEventSchema,
  HistorySyncEventSchema,
])

export type ServerEvent = z.infer<typeof ServerEventSchema>
export type WelcomeEvent = z.infer<typeof WelcomeEventSchema>
export type StateSyncEvent = z.infer<typeof StateSyncEventSchema>
export type UserJoinedEvent = z.infer<typeof UserJoinedEventSchema>
export type UserLeftEvent = z.infer<typeof UserLeftEventSchema>
export type SeatChangedEvent = z.infer<typeof SeatChangedEventSchema>
export type MessageEvent = z.infer<typeof MessageEventSchema>
export type AuthenticatedEvent = z.infer<typeof AuthenticatedEventSchema>
export type HistorySyncEvent = z.infer<typeof HistorySyncEventSchema>
