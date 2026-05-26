'use client'

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

  useEffect(() => {
    const socket = getSocket(myUserId)
    const onPostNew = (newPost: PostDto) => {
      setPosts((prev) =>
        prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev],
      )
    }
    socket.on('post:new', onPostNew)
    return () => {
      socket.off('post:new', onPostNew)
    }
  }, [myUserId])

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
