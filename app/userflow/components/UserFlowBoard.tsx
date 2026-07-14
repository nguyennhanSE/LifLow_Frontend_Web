"use client"

import { useState, useEffect } from "react"
import { useAnnouncement } from "@/hooks/use-announcement/announcement.hook"
import { AnnouncementEntity } from "@/entities/announcements/announcements.entity"
import { EAnnouncementType } from "@/entities/announcements/announcements.entity"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "img", "a", "div", "span"],
  ALLOWED_ATTR: ["src", "alt", "href", "target", "rel", "class", "style"],
  ALLOW_DATA_ATTR: true,
}

interface UserPost {
  id: string
  title: string
  createdAt: string
  authorName: string
  content: string
  imageUrl: string | null
}

function toUserPost(entity: AnnouncementEntity): UserPost {
  const createdAt = entity.createdAt
    ? new Date(entity.createdAt).toISOString().split("T")[0]
    : ""
  const authorName =
    entity.authorName ??
    entity.author?.name ??
    entity.author?.email ??
    "—"
  return {
    id: entity.id,
    title: entity.title,
    createdAt,
    authorName,
    content: entity.content ?? "",
    imageUrl: entity.imageUrl ?? null,
  }
}

export default function UserFlowBoard() {
  const [posts, setPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)
  const [sanitizedContentMap, setSanitizedContentMap] = useState<Record<string, string>>({})
  const { getAnnouncements } = useAnnouncement()

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const result = await getAnnouncements({ type: EAnnouncementType.USER })
        const items = (result?.data ?? []) as AnnouncementEntity[]
        setPosts(items.map(toUserPost))
      } catch (e) {
        console.error("Failed to fetch user announcements:", e)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [getAnnouncements])

  useEffect(() => {
    if (posts.length === 0) {
      setSanitizedContentMap({})
      return
    }
    const run = async () => {
      if (typeof window === "undefined") return
      try {
        const DOMPurify = (await import("dompurify")).default
        const next: Record<string, string> = {}
        for (const post of posts) {
          next[post.id] = DOMPurify.sanitize(post.content, SANITIZE_OPTIONS)
        }
        setSanitizedContentMap(next)
      } catch (e) {
        console.warn("DOMPurify not available, using fallback:", e)
        const next: Record<string, string> = {}
        for (const post of posts) {
          next[post.id] = post.content.replace(/\n/g, "<br />")
        }
        setSanitizedContentMap(next)
      }
    }
    run()
  }, [posts])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] py-8 px-4 md:px-8 flex justify-center">
        <div className="w-full max-w-2xl flex justify-center items-center py-12">
          <span className="text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 md:px-8 flex justify-center">
        <div className="w-full max-w-2xl flex justify-center items-center py-12">
          <span className="text-muted-foreground">콘텐츠가 없습니다.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-8 flex flex-col items-center gap-10">
      <span className="text-2xl font-bold mx-auto">쭈왕몰 이용 가이드</span>
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-14">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden w-full max-w-2xl bg-transparent border-none shadow-none">
            {post.imageUrl && (
              <div className="relative aspect-video w-full bg-muted">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="672px"
                />
              </div>
            )}
            <CardContent className="p-6 md:p-8">
              <h2 className="font-semibold text-foreground text-lg md:text-xl mb-3">{post.title}</h2>
              <div
                className="prose prose-sm max-w-none text-muted-foreground leading-relaxed mb-4
                  prose-headings:text-foreground prose-headings:font-semibold
                  prose-p:text-muted-foreground prose-p:my-2
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                  prose-li:text-muted-foreground
                  prose-img:rounded-lg prose-img:max-w-full prose-img:my-3
                  prose-a:text-primary prose-a:underline
                  [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: sanitizedContentMap[post.id] ?? post.content.replace(/\n/g, "<br />"),
                }}
              />
              <div className="flex items-center gap-5 text-sm text-muted-foreground">
                <span>{post.authorName}</span>
                <span>{post.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
