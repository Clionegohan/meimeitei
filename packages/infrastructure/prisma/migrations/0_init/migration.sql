-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL,
    "presenceVisibility" TEXT NOT NULL,
    "currentSigns" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth_identities" (
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_auth_identities_pkey" PRIMARY KEY ("provider","providerId")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "rootPostId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "nightId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "userId" TEXT NOT NULL,
    "nightId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("userId","nightId")
);

-- CreateTable
CREATE TABLE "presence_events" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presence_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_auth_identities_userId_idx" ON "user_auth_identities"("userId");

-- CreateIndex
CREATE INDEX "conversations_participantAId_idx" ON "conversations"("participantAId");

-- CreateIndex
CREATE INDEX "conversations_participantBId_idx" ON "conversations"("participantBId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participantAId_participantBId_rootPostId_key" ON "conversations"("participantAId", "participantBId", "rootPostId");

-- CreateIndex
CREATE INDEX "messages_conversationId_sentAt_idx" ON "messages"("conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "posts_nightId_postedAt_idx" ON "posts"("nightId", "postedAt");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_postId_userId_key" ON "likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_blockerId_blockedId_key" ON "blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "presence_events_userId_occurredAt_idx" ON "presence_events"("userId", "occurredAt");

-- R2 enforcement (手書き追加): Postgres は NULL を distinct とみなすため
-- conversations の (participantAId, participantBId, rootPostId) unique では
-- rootPostId IS NULL の direct conversation を一意化できない。partial unique
-- index で「rootPostId NULL のペア」のみ 1 つに制限する。
CREATE UNIQUE INDEX "conversations_pair_direct_key"
  ON "conversations" ("participantAId", "participantBId")
  WHERE "rootPostId" IS NULL;

