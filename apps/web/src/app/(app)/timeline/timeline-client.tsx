'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket-client'
import { PostCard, type PostDto } from './post-card'

export function TimelineClient({
  initialPosts,
  myUserId,
}: {
  initialPosts: readonly PostDto[]
  myUserId: string
}) {
  const [posts, setPosts] = useState<PostDto[]>([...initialPosts])
  const router = useRouter()

  useEffect(() => {
    const socket = getSocket(myUserId)
    const onPostNew = (newPost: PostDto) => {
      setPosts((prev) =>
        prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev],
      )
    }
    // presence:update は trigger-only。SSR で OnlineSheepList を revalidate する。
    const onPresenceUpdate = () => {
      router.refresh()
    }
    socket.on('post:new', onPostNew)
    socket.on('presence:update', onPresenceUpdate)
    return () => {
      socket.off('post:new', onPostNew)
      socket.off('presence:update', onPresenceUpdate)
    }
  }, [myUserId, router])

  if (posts.length === 0) {
    return (
      <p className="text-sm text-[#9A9484] tracking-wider py-12 text-center">
        まだ今宵の言葉はありません。
      </p>
    )
  }

  return (
    <div>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} myUserId={myUserId} />
      ))}
    </div>
  )
}
