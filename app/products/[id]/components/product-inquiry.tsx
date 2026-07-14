"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useProductInquiry } from "@/hooks/use-product-inquiry/product-inquiry.hook"
import { QueryProductInquiriesDto, CreateProductInquiryAnswerDto } from "@/hooks/use-product-inquiry/product-inquiry.dto"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { ProductInquiryEntity } from "@/entities/product-inquiry/product-inquiry.entity"
import { useTranslation } from 'react-i18next'

export default function ProductInquiry() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const { getProductInquiries, createProductInquiryAnswer} = useProductInquiry()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [sortBy, setSortBy] = useState<string>("latest")
  const [filterTab, setFilterTab] = useState<string>("all")
  const [isAdmin, setIsAdmin] = useState(false)

  // Helper: read cookie on client (role is stored in cookie by auth, not localStorage)
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()?.trim() || null
    return null
  }

  // Check if user is admin (role comes from cookie set by sign-in)
  useEffect(() => {
    const checkAdminRole = () => {
      try {
        const role = getCookie("role")
        setIsAdmin(role?.toUpperCase() === "ADMIN")
      } catch (error) {
        console.error("Error checking admin role:", error)
        setIsAdmin(false)
      }
    }
    checkAdminRole()
  }, [])

  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false)
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const limit = 10


  // Query parameters - always fetch all inquiries so tab counts stay stable
  // latest (최신순) → sortOrder 'asc', oldest (오래된순) → sortOrder 'desc'
  const getQueryParams = (page: number): QueryProductInquiriesDto => {
    return {
      productId,
      page,
      limit,
      sortBy: "createdAt",
      sortOrder: sortBy === "latest" ? "asc" : "desc",
    }
  }

  // Infinite query for inquiries
  const {
    data: inquiriesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ProductInquiryEntity[]>({
    queryKey: ["product-inquiries", productId, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number
      const page = offset / limit + 1
      const queryParams = getQueryParams(page)
      const response = await getProductInquiries(queryParams)
      return response?.items ?? []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const lastLength = Array.isArray(lastPage) ? (lastPage.length ?? 0) : 0
      if (lastLength < limit) return undefined // no more pages
      const safePages = Array.isArray(allPages) ? allPages : []
      const nextOffset = safePages.reduce(
        (sum, page) => sum + (Array.isArray(page) ? (page.length ?? 0) : 0),
        0,
      )
      return nextOffset
    },
    enabled: !!productId,
  })

  // Flatten pages data
  const allInquiries = useMemo(() => {
    if (!inquiriesData?.pages) return []
    return inquiriesData.pages.flat()
  }, [inquiriesData])

  const totalInquiries = allInquiries.length
  const answeredInquiries = allInquiries.filter((inquiry) => {
    const hasAnswers = inquiry.productInquiryAnswers && inquiry.productInquiryAnswers.length > 0
    return inquiry.hasAnswer || inquiry.answer || hasAnswers
  })
  const unansweredInquiries = allInquiries.filter((inquiry) => {
    const hasAnswers = inquiry.productInquiryAnswers && inquiry.productInquiryAnswers.length > 0
    return !inquiry.hasAnswer && !inquiry.answer && !hasAnswers
  })

  // Filter inquiries based on active tab
  const filteredInquiries = useMemo(() => {
    if (filterTab === "answered") return answeredInquiries
    if (filterTab === "unanswered") return unansweredInquiries
    return allInquiries
  }, [allInquiries, filterTab, answeredInquiries, unansweredInquiries])

  // Infinite scroll: fetch next page when scrolling to bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (bottomRef.current) {
      observer.observe(bottomRef.current)
    }

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Format date
  const formatDate = (date?: Date | string | null) => {
    if (!date) return ""
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  // Mask author name (show first 2 chars + *)
  const maskAuthorName = (inquiry: ProductInquiryEntity) => {
    const name = inquiry.user?.name || inquiry.user?.email
    if (!name) return "Anonymous"
    if (name.length <= 2) return name + "*"
    return name.substring(0, 2) + "*"
  }

  // Avatar or fallback initial (user.avatarUrl from API)
  const renderInquiryAvatar = (inquiry: ProductInquiryEntity) => {
    const avatarUrl = inquiry.user?.avatarUrl
    const name = inquiry.user?.name || inquiry.user?.email || ""
    const initial = name ? name.charAt(0).toUpperCase() : "?"
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover shrink-0"
        />
      )
    }
    return (
      <div
        className="h-8 w-8 rounded-full bg-[#FF6B4A]/20 text-[#FF6B4A] flex items-center justify-center text-sm font-semibold shrink-0"
        aria-hidden
      >
        {initial}
      </div>
    )
  }


  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast({
        title: "답변 필수",
        description: t('key555', '제출하기 전에 답변을 작성해주세요.'),
        variant: "destructive",
      })
      return
    }

    if (!selectedInquiryId) {
      toast({
        title: "오류",
        description: t('key556', '선택된 문의가 없습니다.'),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dto: CreateProductInquiryAnswerDto = {
        answer: answerText,
      }

      await createProductInquiryAnswer(selectedInquiryId, dto)
      
      toast({
        title: "답변 등록 완료",
        description: t('key557', '답변이 성공적으로 등록되었습니다.'),
      })

      // Reset form
      setAnswerText("")
      setSelectedInquiryId(null)
      setIsAnswerDialogOpen(false)

      // Invalidate and refetch inquiries
      queryClient.invalidateQueries({ queryKey: ["product-inquiries", productId] })
    } catch (error: any) {
      toast({
        title: "오류",
        description: error?.message || t('key558', '답변 제출에 실패했습니다. 다시 시도해주세요.'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open answer dialog
  const handleOpenAnswerDialog = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId)
    setAnswerText("")
    setIsAnswerDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('key559', '문의를 불러오는데 실패했습니다. 나중에 다시 시도해주세요.')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Answer Dialog */}
      <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('key560', '문의 답변')}</DialogTitle>
            <DialogDescription>
              {t('key561', '이 문의에 대한 답변을 작성해주세요.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Answer Text */}
            <div className="space-y-2">
              <Label htmlFor="answer-text">{t('key562', '답변 *')}</Label>
              <Textarea
                id="answer-text"
                placeholder={t('key563', '답변을 작성해주세요...')}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAnswerDialogOpen(false)
                setAnswerText("")
                setSelectedInquiryId(null)
              }}
              disabled={isSubmitting}
            >
              {t('key212', '취소')}
            </Button>
            <Button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerText.trim()}
              className="bg-[#FF6B4A] hover:bg-[#FF5A39] text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  {t('key538', '제출 중...')}
                </>
              ) : (
                "답변 등록"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter and Sort Bar - Always visible */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t('key494', '최신순')}</SelectItem>
              <SelectItem value="oldest">{t('key553', '오래된순')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full lg:w-auto">
          <TabsList>
            <TabsTrigger value="all" className="data-[state=active]:bg-[#FF6B4A] data-[state=active]:text-white">{t('totalinquiries', '전체 ({{totalInquiries}})', { totalInquiries })}</TabsTrigger>
            <TabsTrigger value="answered" className="data-[state=active]:bg-[#FF6B4A] data-[state=active]:text-white">{t('length5', '답변완료 ({{length}})', { length: answeredInquiries.length })}</TabsTrigger>
            <TabsTrigger value="unanswered" className="data-[state=active]:bg-[#FF6B4A] data-[state=active]:text-white">{t('length6', '답변대기 ({{length}})', { length: unansweredInquiries.length })}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Inquiries List */}
      <div className="space-y-6">
        {totalInquiries === 0 ? (
          /* Empty state - no inquiries at all (like design) */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{t('qa', 'Q&A')}</h2>
              <p className="text-sm text-muted-foreground">{t('key564', '상품의 궁금한 점을 해결해 드립니다.')}</p>
            </div>
            <div className="rounded-lg bg-[#f8f8f8] py-16 flex items-center justify-center">
              <p className="text-muted-foreground">{t('key565', '게시물이 없습니다')}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => router.push(`/products/${productId}`)}
              >
                {t('key65', '전체 보기')}
              </Button>
              <Button
                className="bg-[#FF6B4A] hover:bg-[#FF5A39] text-white"
                onClick={() => router.push(`/products/${productId}/inquiry-create`)}
              >
                {t('key566', '상품문의하기')}
              </Button>
            </div>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('key567', '해당하는 문의가 없습니다.')}
          </div>
        ) : (
          <>
            {filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} className="border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Inquiry Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {renderInquiryAvatar(inquiry)}
                        <h3 className="font-semibold text-lg">{inquiry.title}</h3>
                      </div>
                      {(inquiry.hasAnswer || 
                          inquiry.answer || 
                          (inquiry.productInquiryAnswers && inquiry.productInquiryAnswers.length > 0)) ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 size={14} className="mr-1" />
                            {t('key364', '답변완료')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {t('key363', '답변대기')}
                          </Badge>
                        )}
                    </div>

                    {/* Inquiry Content */}
                    <div className="flex items-center gap-5">
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {inquiry.content}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>

                    {/* Answer Section - Display productInquiryAnswers */}
                    {(inquiry.productInquiryAnswers && inquiry.productInquiryAnswers.length > 0) && (
                      <div className="space-y-3">
                        {inquiry.productInquiryAnswers.map((answerItem) => (
                          <div key={answerItem.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#FF6B4A]">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 size={16} className="text-[#FF6B4A]" />
                              <span className="font-semibold text-sm">{t('key568', '답변')}</span>
                              {answerItem.createdAt && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatDate(answerItem.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-line">
                              {answerItem.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback: Display old answer field if no productInquiryAnswers */}
                    {(!inquiry.productInquiryAnswers || inquiry.productInquiryAnswers.length === 0) && inquiry.answer && (
                      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#FF6B4A]">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-[#FF6B4A]" />
                          <span className="font-semibold text-sm">{t('key568', '답변')}</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {inquiry.answer}
                        </p>
                      </div>
                    )}

                    {/* Inquiry Actions - ADMIN: 답변 추가 가능 (답변완료여도 추가 답변) */}
                    {isAdmin && (
                      <div className="flex items-center gap-4 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleOpenAnswerDialog(inquiry.id)}
                        >
                          <MessageSquare size={16} />
                          {t('key569', '답변하기')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Infinite scroll trigger */}
            <div ref={bottomRef} className="h-4" />
            
            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Spinner className="w-6 h-6" />
              </div>
            )}

            {/* Bottom action buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => router.push(`/products/${productId}`)}
              >
                {t('key65', '전체 보기')}
              </Button>
              <Button
                className="bg-[#FF6B4A] hover:bg-[#FF5A39] text-white"
                onClick={() => router.push(`/products/${productId}/inquiry-create`)}
              >
                {t('key566', '상품문의하기')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
