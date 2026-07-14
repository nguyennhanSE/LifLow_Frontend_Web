"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { ThumbsUp, Star, Upload, X, FileText } from "lucide-react"
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
import { useProductReview } from "@/hooks/use-product-review/product-review.hook"
import { useRecipe } from "@/hooks/use-recipe/recipt.hook"
import {
  CreateProductReviewDto,
  ProductReviewFeedItem,
  ProductReviewFeedRecipe,
  ProductReviewFeedReview,
} from "@/hooks/use-product-review/product-review.dto"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"

interface RatingDistribution {
  [key: number]: number
}

// Star Rating Component
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          size={size}
        />
      ))}
    </div>
  )
}

// Interactive Star Rating Component for form
function InteractiveStarRating({ 
  rating, 
  onRatingChange, 
  size = 24 
}: { 
  rating: number; 
  onRatingChange: (rating: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} cursor-pointer`}
            size={size}
          />
        </button>
      ))}
    </div>
  )
}

// Recipe feed card: badge, authorName, createdAt, thumbnail, content, view recipe link, likes
function FeedRecipeCard({
  item,
  formatDate,
  onLikeClick,
  isLiking,
}: {
  item: { type: "recipe"; createdAt: string; likes: number; likedByMe: boolean; recipe: ProductReviewFeedRecipe }
  formatDate: (date?: Date | string | null) => string
  onLikeClick: (recipeId: string) => Promise<void>
  isLiking: boolean
}) {
  const { recipe, createdAt, likes, likedByMe } = item
  const thumbnailUrl = recipe.thumbnailUrl?.[0] ?? null
  return (
    <Card className="border">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Recipe review
            </Badge>

          </div>
          <div className="text-sm text-muted-foreground">
              {recipe.authorName} · {formatDate(createdAt)}
            </div>
          {thumbnailUrl && (
            <div className="relative w-full max-w-[200px] aspect-video rounded-md overflow-hidden border">
              <Image
                src={thumbnailUrl}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {recipe.content}
          </p>
          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => onLikeClick(recipe.id)}
              disabled={isLiking}
            >
              <ThumbsUp size={16} className={likedByMe ? "fill-current" : undefined} />
              도움이 돼요 ({likes})
            </Button>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/community/main/${recipe.id}`}>
              <FileText size={16} />
              View recipe
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Review feed card: rating, authorName, createdAt, imageUrl, review text, ThumbsUp
function FeedReviewCard({
  item,
  formatDate,
  onLikeClick,
  isLiking,
}: {
  item: { type: "review"; createdAt: string; likes: number; likedByMe: boolean; review: ProductReviewFeedReview }
  formatDate: (date?: Date | string | null) => string
  onLikeClick: (productReviewId: string) => Promise<void>
  isLiking: boolean
}) {
  const { review, likes, likedByMe } = item
  return (
    <Card className="border">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <StarRating rating={review.rating} />
          </div>
          <div className="text-sm text-muted-foreground">
              {review.authorName} · {formatDate(review.createdAt)}
            </div>
          {review.imageUrl && (
            <div className="flex gap-2 flex-wrap">
              <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                <Image
                  src={review.imageUrl}
                  alt="Review"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {review.review}
          </p>
          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => onLikeClick(review.id)}
              disabled={isLiking}
            >
              <ThumbsUp size={16} className={likedByMe ? "fill-current" : undefined} />
              도움이 돼요 ({likes})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductReview() {
  const params = useParams()
  const productId = params?.id as string
  const { getProductReviewsByProductId, createProductReview, toggleProductReviewLike } = useProductReview()
  const { toggleRecipeLike } = useRecipe()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [filterTab, setFilterTab] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest") // latest → sortOrder 'asc', oldest → sortOrder 'desc'
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [likingId, setLikingId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState<string>("")
  const [reviewImage, setReviewImage] = useState<File | null>(null)
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const limit = 10
  const feedQueryKey = ["product-reviews-feed", productId, sortBy] as const

  // Infinite query using getProductReviewsByProductId (returns feed: recipe + review items)
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ProductReviewFeedItem[]>({
    queryKey: feedQueryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number
      const sortOrder = sortBy === "latest" ? "asc" : "desc"
      const items = await getProductReviewsByProductId(productId, page, limit, sortOrder)
      return Array.isArray(items) ? (items as ProductReviewFeedItem[]) : []
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const lastLength = Array.isArray(lastPage) ? lastPage.length : 0
      if (lastLength < limit) return undefined
      return (allPages?.length ?? 0) + 1
    },
    enabled: !!productId,
  })

  // Flatten all feed items
  const allItems = useMemo(() => {
    if (!feedData?.pages) return []
    return feedData.pages.flat()
  }, [feedData])

  // Split by type for tabs and rating distribution
  const reviewItems = useMemo(
    () => allItems.filter((item): item is ProductReviewFeedItem & { type: "review" } => item.type === "review"),
    [allItems],
  )
  const recipeItems = useMemo(
    () => allItems.filter((item): item is ProductReviewFeedItem & { type: "recipe" } => item.type === "recipe"),
    [allItems],
  )

  // Rating distribution from review items only
  const ratingDistribution = useMemo<RatingDistribution>(() => {
    const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviewItems.forEach(({ review }) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1
      }
    })
    return distribution
  }, [reviewItems])

  const totalItems = allItems.length
  const totalReviews = reviewItems.length
  const totalRecipes = recipeItems.length

  // Filter by active tab
  const filteredItems = useMemo(() => {
    if (filterTab === "general") return reviewItems
    if (filterTab === "recipe") return recipeItems
    return allItems
  }, [allItems, filterTab, reviewItems, recipeItems])

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

  // Calculate percentages for rating distribution (reviews only)
  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0
    return Math.round((count / totalReviews) * 100)
  }

  const optimisticToggleLike = (target: { type: "recipe" | "review"; id: string }) => {
    queryClient.setQueryData<InfiniteData<ProductReviewFeedItem[]>>(feedQueryKey, (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((item) => {
            if (target.type === "recipe" && item.type === "recipe" && item.recipe.id === target.id) {
              const nextLiked = !item.likedByMe
              const nextLikes = Math.max(0, (item.likes ?? 0) + (nextLiked ? 1 : -1))
              return { ...item, likedByMe: nextLiked, likes: nextLikes }
            }
            if (target.type === "review" && item.type === "review" && item.review.id === target.id) {
              const nextLiked = !item.likedByMe
              const nextLikes = Math.max(0, (item.likes ?? 0) + (nextLiked ? 1 : -1))
              return { ...item, likedByMe: nextLiked, likes: nextLikes }
            }
            return item
          }),
        ),
      }
    })
  }

  const recipeLikeMutation = useMutation({
    mutationFn: async (recipeId: string) => toggleRecipeLike(recipeId),
    onMutate: async (recipeId: string) => {
      setLikingId(recipeId)
      await queryClient.cancelQueries({ queryKey: feedQueryKey })
      const previous = queryClient.getQueryData<InfiniteData<ProductReviewFeedItem[]>>(feedQueryKey)
      optimisticToggleLike({ type: "recipe", id: recipeId })
      return { previous }
    },
    onError: (_error, _recipeId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(feedQueryKey, ctx.previous)
      }
      toast({
        title: "오류",
        description: "좋아요를 누를 수 없습니다.",
        variant: "destructive",
      })
    },
    onSettled: async () => {
      setLikingId(null)
      // Keep data consistent eventually
      queryClient.invalidateQueries({ queryKey: ["product-reviews-feed", productId] })
    },
  })

  const reviewLikeMutation = useMutation({
    mutationFn: async (reviewId: string) => toggleProductReviewLike(reviewId),
    onMutate: async (reviewId: string) => {
      setLikingId(reviewId)
      await queryClient.cancelQueries({ queryKey: feedQueryKey })
      const previous = queryClient.getQueryData<InfiniteData<ProductReviewFeedItem[]>>(feedQueryKey)
      optimisticToggleLike({ type: "review", id: reviewId })
      return { previous }
    },
    onError: (_error, _reviewId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(feedQueryKey, ctx.previous)
      }
      toast({
        title: "오류",
        description: "좋아요를 누를 수 없습니다.",
        variant: "destructive",
      })
    },
    onSettled: async () => {
      setLikingId(null)
      queryClient.invalidateQueries({ queryKey: ["product-reviews-feed", productId] })
    },
  })

  const handleReviewLike = async (productReviewId: string) => {
    try {
      await reviewLikeMutation.mutateAsync(productReviewId)
    } catch {
      // handled via onError (toast + rollback)
    }
  }
  const handleRecipeLike = async (recipeId: string) => {
    try {
      await recipeLikeMutation.mutateAsync(recipeId)
    } catch {
      // handled via onError (toast + rollback)
    }
  }

  // Format date
  const formatDate = (date?: Date | string | null) => {
    if (!date) return ""
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return dateObj.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReviewImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReviewImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setReviewImage(null)
    setReviewImagePreview(null)
  }

  // Handle form submission
  const handleSubmitReview = async () => {
    if (!reviewRating || reviewRating === 0) {
      toast({
        title: "평점 필수",
        description: "제출하기 전에 평점을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!reviewText.trim()) {
      toast({
        title: "리뷰 내용 필수",
        description: "제출하기 전에 리뷰를 작성해주세요.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      const dto: CreateProductReviewDto = {
        productId,
        review: reviewText,
        rating: reviewRating,
      }

      await createProductReview(dto, reviewImage || undefined)
      
      toast({
        title: "리뷰 등록 완료",
        description: "리뷰가 성공적으로 등록되었습니다.",
      })

      // Reset form
      setReviewRating(0)
      setReviewText("")
      setReviewImage(null)
      setReviewImagePreview(null)
      setIsDialogOpen(false)

      // Invalidate feed so new review appears
      queryClient.invalidateQueries({ queryKey: ["product-reviews-feed", productId] })
      queryClient.invalidateQueries({ queryKey: ["product-reviews-count", productId] })
    } catch (error: any) {
      toast({
        title: "오류",
        description: error?.message || "리뷰 제출에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
        리뷰를 불러오는데 실패했습니다. 나중에 다시 시도해주세요.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Write Review Button */}
      <div className="flex justify-end">
        <Button 
          className="bg-[#FF6B4A] hover:bg-[#FF5A39] text-white gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <Upload size={16} />
          리뷰 작성
        </Button>
      </div>

      {/* Write Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>리뷰 작성</DialogTitle>
            <DialogDescription>
              이 제품에 대한 경험을 공유해 주세요. 귀하의 리뷰는 다른 고객이 정보에 입각한 결정을 내리는 데 도움이 됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Rating Selection */}
            <div className="space-y-2">
              <Label>평점 *</Label>
              <InteractiveStarRating 
                rating={reviewRating} 
                onRatingChange={setReviewRating}
              />
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <Label htmlFor="review-text">리뷰 내용 *</Label>
              <Textarea
                id="review-text"
                placeholder="이 제품에 대한 경험을 알려주세요..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="review-image">사진 추가 (선택사항)</Label>
              {reviewImagePreview ? (
                <div className="relative inline-block">
                  <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                    <Image
                      src={reviewImagePreview}
                      alt="Review preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="review-image"
                    className="cursor-pointer border border-dashed rounded-md p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">이미지 업로드</span>
                    </div>
                  </Label>
                  <input
                    id="review-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    aria-label="Upload review image"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setReviewRating(0)
                setReviewText("")
                setReviewImage(null)
                setReviewImagePreview(null)
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting || reviewRating === 0 || !reviewText.trim()}
              className="bg-[#FF6B4A] hover:bg-[#FF5A39] text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  제출 중...
                </>
              ) : (
                "리뷰 등록"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Distribution Card (reviews only) */}
      {totalReviews > 0 && (
        <Card className="border">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">평점 분포</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating] || 0
                  const percentage = getPercentage(count)
                  return (
                    <div key={rating} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          {rating} <Star className="fill-yellow-400 text-yellow-400" size={14} />
                        </span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div
                          className="bg-[#FF6B4A] h-2 rounded-full transition-all absolute left-0 top-0"
                          style={{ width: `${percentage}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
            {/* Filter and Sort Bar */}
      <div className="flex justify-between  items-center  gap-4 flex-wrap self-end">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "latest" | "oldest")}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="oldest">오래된순</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full lg:w-auto">
          <TabsList>
            <TabsTrigger value="all" className="data-[state=active]:bg-[#FF6B4A] data-[state=active]:text-white">
              전체 ({totalItems})
            </TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:bg-[#FF6B4A] data-[state=active]:text-white">
              일반 리뷰 ({totalReviews})
            </TabsTrigger>
            <TabsTrigger value="recipe" className="data-[state=active]:bg-[#FF6B4A] data-[state=active]:text-white">
              레시피 리뷰 ({totalRecipes})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Feed List: recipe items and review items */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            리뷰가 없습니다.
          </div>
        ) : (
          <>
            {filteredItems.map((item) =>
              item.type === "recipe" ? (
                <FeedRecipeCard
                  key={item.recipe.id}
                  item={item}
                  formatDate={formatDate}
                  onLikeClick={handleRecipeLike}
                  isLiking={likingId === item.recipe.id}
                />
              ) : (
                <FeedReviewCard
                  key={item.review.id}
                  item={item}
                  formatDate={formatDate}
                  onLikeClick={handleReviewLike}
                  isLiking={likingId === item.review.id}
                />
              ),
            )}
            <div ref={bottomRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Spinner className="w-6 h-6" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

