"use client"

import { useState, useEffect, useCallback } from "react"
import { Volume2, Eye, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAnnouncement } from "@/hooks/use-announcement/announcement.hook"
import { AnnouncementEntity } from "@/entities/announcements/announcements.entity"
import { EAnnouncementType } from "@/entities/announcements/announcements.entity"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Announcement {
  id: string
  title: string
  date: string
  views: number
  author: string
  content: string
  isEvent?: boolean
}

type TabType = "general" | "recipe"

export default function AnnouncementBoard() {
  const [activeTab, setActiveTab] = useState<TabType>("recipe")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [sanitizedContent, setSanitizedContent] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const { getAnnouncements, addAnnouncementView } = useAnnouncement()
  const router = useRouter()

  // Update view count when an announcement is viewed (first on load or when user selects another)
  const updateViewForAnnouncement = useCallback((announcement: Announcement) => {
    if (!announcement?.id) return
    addAnnouncementView(announcement.id)
      .then((data: { views?: number } | undefined) => {
        const newViews = data?.views ?? announcement.views + 1
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? { ...a, views: newViews } : a))
        )
        setSelectedAnnouncement((prev) =>
          prev?.id === announcement.id ? { ...prev, views: newViews } : prev
        )
      })
      .catch(() => {
        // Optimistic update on error
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === announcement.id ? { ...a, views: a.views + 1 } : a
          )
        )
        setSelectedAnnouncement((prev) =>
          prev?.id === announcement.id && prev ? { ...prev, views: prev.views + 1 } : prev
        )
      })
  }, [addAnnouncementView])
  // Convert entity to component interface
  const convertEntityToAnnouncement = (entity: AnnouncementEntity): Announcement => {
    const date = entity.createdAt 
      ? new Date(entity.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    
    return {
      id: entity.id,
      title: entity.title,
      date: date,
      views: entity.views || 0,
      author: entity.author?.name || entity.author?.email || "쭈왕몰 관리자",
      content: entity.content || "",
      isEvent: entity.isFixed || false,
    }
  }

  // Fetch announcements based on active tab
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const type = activeTab === "general" ? EAnnouncementType.GENERAL : EAnnouncementType.RECIPE
        const response = await getAnnouncements({ type })
        const list = Array.isArray(response?.data) ? response.data : []
        const convertedAnnouncements = list.map((entity) =>
          convertEntityToAnnouncement(entity as AnnouncementEntity)
        )
        setAnnouncements(convertedAnnouncements)
        
        // Set first announcement as selected
        if (convertedAnnouncements.length > 0) {
          setSelectedAnnouncement(convertedAnnouncements[0])
        } else {
          setSelectedAnnouncement(null)
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error)
        setAnnouncements([])
        setSelectedAnnouncement(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [activeTab, getAnnouncements])

  // Sanitize HTML content on client side
  useEffect(() => {
    if (!selectedAnnouncement) {
      setSanitizedContent("")
      return
    }

    const sanitizeContent = async () => {
      if (typeof window !== "undefined") {
        try {
          const DOMPurify = (await import("dompurify")).default
          const clean = DOMPurify.sanitize(selectedAnnouncement.content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'img', 'a', 'div', 'span'],
            ALLOWED_ATTR: ['src', 'alt', 'href', 'target', 'rel', 'class', 'style'],
            ALLOW_DATA_ATTR: true,
          })
          setSanitizedContent(clean)
        } catch (error) {
          // Fallback: convert newlines to <br> if DOMPurify is not available
          console.warn("DOMPurify not available, using fallback:", error)
          setSanitizedContent(selectedAnnouncement.content.replace(/\n/g, '<br />'))
        }
      } else {
        // Server-side fallback
        setSanitizedContent(selectedAnnouncement.content.replace(/\n/g, '<br />'))
      }
    }
    sanitizeContent()
  }, [selectedAnnouncement?.content])

  // Call addAnnouncementView when an announcement is displayed (first one on load or when user selects another)
  useEffect(() => {
    if (!selectedAnnouncement?.id) return
    updateViewForAnnouncement(selectedAnnouncement)
  }, [selectedAnnouncement?.id, updateViewForAnnouncement])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleNextAnnouncement = () => {
    if (!selectedAnnouncement) return
    const currentIndex = announcements.findIndex((a) => a.id === selectedAnnouncement.id)
    if (currentIndex < announcements.length - 1) {
      setSelectedAnnouncement(announcements[currentIndex + 1])
    }
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto bg-gray-50 rounded-lg p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {/* <Volume2 className="h-6 w-6 text-muted-foreground" /> */}
            <h1 className="text-2xl font-bold text-foreground">📢 공지사항</h1>
          </div>
          <p className="text-muted-foreground">쭈왕몰의 새로운 소식과 이벤트를 확인하세요.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex bg-muted rounded-full p-1">
            <button
              onClick={() => handleTabChange("general")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === "general"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              일반 공지사항
            </button>
            <button
              onClick={() => handleTabChange("recipe")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === "recipe"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              쭈왕 레시피 공지사항
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcement List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <h2 className="font-semibold text-foreground mb-4">전체 공지사항</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">공지사항이 없습니다.</div>
                ) : (
                  announcements.map((announcement) => (
                    <button
                      key={announcement.id}
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg transition-colors",
                        selectedAnnouncement?.id === announcement.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {announcement.isEvent && (
                          <Image src="/pin.png" alt="event" width={20} height={20} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {announcement.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{announcement.date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {announcement.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Announcement Detail */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {!selectedAnnouncement ? (
                <div className="text-center py-12 text-muted-foreground">
                  {loading ? "로딩 중..." : "공지사항을 선택해주세요."}
                </div>
              ) : (
                <>
                  {/* Badge */}
                  <Badge className="bg-orange-500 hover:bg-orange-500 text-white mb-4">
                    <Volume2 className="h-3 w-3 mr-1" />
                    공지
                  </Badge>

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {selectedAnnouncement.title}
                  </h2>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                    <div>
                      <span className="text-muted-foreground">작성자</span>{" "}
                      <span className="text-foreground">{selectedAnnouncement.author}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">작성일</span>{" "}
                      <span className="text-foreground">{selectedAnnouncement.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{selectedAnnouncement.views}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed mb-8
                      prose-headings:text-foreground prose-headings:font-semibold
                      prose-p:text-foreground prose-p:my-4
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-ul:text-foreground prose-ol:text-foreground
                      prose-li:text-foreground
                      prose-img:rounded-lg prose-img:max-w-full prose-img:my-4
                      prose-a:text-primary prose-a:underline
                      [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizedContent || selectedAnnouncement.content.replace(/\n/g, '<br />')
                    }}
                  />

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-4">
                    <Button onClick={() => router.push("/")} variant="outline" className="gap-2 bg-transparent">
                      <ChevronLeft className="h-4 w-4" />
                      메인으로
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleNextAnnouncement}
                      disabled={announcements.findIndex((a) => a.id === selectedAnnouncement.id) === announcements.length - 1}
                    >
                      다음 공지 보기
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
