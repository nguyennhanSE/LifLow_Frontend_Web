"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Heart, Bookmark, Edit2, Trash2, ChevronRight, ChevronLeft, List, Share2, Loader2, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useRecipe } from "@/hooks/use-recipe/recipt.hook"
import { useRecipeComment } from "@/hooks/use-recipe-comment/recipe-comment.hook"
import { Recipe } from "@/entities/recipes/recipe.entity"
import { RecipeComment } from "@/entities/recipe-comments/recipe-comment.entity"
import { ProductEntity } from "@/entities/products/product.entity"
import Link from "next/link"

interface RecipePostCardProps {
  id: string
}

export function RecipePostCard({ id }: RecipePostCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { getRecipeById, getRecipes, toggleRecipeLike } = useRecipe()
  const { getRecipeComments, createRecipeComment } = useRecipeComment()
  
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comment, setComment] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Fetch recipe data
  const {
    data: recipeData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const result = await getRecipeById(id)
      return result.recipeDetail as Recipe
    },
    enabled: !!id,
  })

  // Fetch recipe comments
  const {
    data: commentsData,
    isLoading: isLoadingComments,
  } = useQuery({
    queryKey: ['recipe-comments', id, page, limit],
    queryFn: async () => {
      const result = await getRecipeComments({ 
        recipeId: id, 
        page, 
        limit 
      })
      return result
    },
    enabled: !!id,
  })

  // Fetch recipes list to find next/previous recipe
  const {
    data: recipesListData,
  } = useQuery({
    queryKey: ['recipes-list', 'navigation'],
    queryFn: async () => {
      const result = await getRecipes({
        page: 1,
        limit: 10, // Get large number to find next/previous
        status: 'approved',
        isActive: true,
        sortBy: 'createdAt',
      })
      // Handle different response structures
      if (result?.data && 'docs' in result.data) {
        return (result.data as any).docs
      } else if (Array.isArray(result?.data)) {
        return result.data
      } else if (Array.isArray(result)) {
        return result
      }
      return []
    },
    enabled: !!id,
  })

  // Find next and previous recipe IDs
  const recipesList: Recipe[] = recipesListData || []
  const currentIndex = recipesList.findIndex((recipe) => recipe.id === id)
  const nextRecipe = currentIndex >= 0 && currentIndex < recipesList.length - 1 
    ? recipesList[currentIndex + 1] 
    : null
  const previousRecipe = currentIndex > 0 
    ? recipesList[currentIndex - 1] 
    : null
  const isLastRecipe = currentIndex === recipesList.length - 1

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await createRecipeComment({
        recipeId: id,
        content,
      })
    },
    onSuccess: () => {
      // Refetch comments after successful creation
      queryClient.invalidateQueries({ queryKey: ['recipe-comments', id] })
      setComment("") // Clear comment input
    },
  })

  // Toggle like mutation - API returns full recipe with likedByMe, likes (views unchanged)
  const likeMutation = useMutation({
    mutationFn: async () => {
      return await toggleRecipeLike(id)
    },
    onSuccess: (data: { likedByMe?: boolean; likes?: number }) => {
      // Update from API response: likedByMe và likes (views không đổi)
      setIsLiked(data?.likedByMe ?? !isLiked)
      setLikeCount(typeof data?.likes === 'number' ? data.likes : (isLiked ? likeCount - 1 : likeCount + 1))
      queryClient.invalidateQueries({ queryKey: ['recipe', id] })
    },
    onError: () => {
      setIsLiked(isLiked)
      setLikeCount(likeCount)
    },
  })

  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [likeCount, setLikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  
  // Extract comments array from response
  const comments: RecipeComment[] = commentsData?.data || commentsData || []

  // Get product if available
  const product = (recipeData as any)?.product || null

  // Parse data from recipe
  const title = recipeData?.title || ""
  const author = {
    name: recipeData?.authorName || recipeData?.author?.name || "익명",
    initials: (recipeData?.authorName || recipeData?.author?.name || "A").charAt(0).toUpperCase(),
  }
  const date = recipeData?.dateOfWriting 
    ? format(new Date(recipeData.dateOfWriting), "yyyy-MM-dd")
    : recipeData?.createdAt
    ? format(new Date(recipeData.createdAt), "yyyy-MM-dd")
    : ""
  
  // Get first thumbnail if thumbnailUrl is an array
  let mainImage = "/placeholder.svg"
  if (recipeData?.thumbnailUrl) {
    if (Array.isArray(recipeData.thumbnailUrl) && recipeData.thumbnailUrl.length > 0) {
      mainImage = recipeData.thumbnailUrl[0]
    } else if (typeof recipeData.thumbnailUrl === 'string') {
      mainImage = recipeData.thumbnailUrl
    }
  }
  
  const ingredients = recipeData?.ingredients || []
  
  // Parse cooking method from content
  const steps = recipeData?.content 
    ? recipeData.content.split('\n').filter(step => step.trim().length > 0)
    : []

  useEffect(() => {
    if (!recipeData) return
    if (recipeData.thumbnailUrl) {
      if (Array.isArray(recipeData.thumbnailUrl) && recipeData.thumbnailUrl.length > 1) {
        setGalleryImages(recipeData.thumbnailUrl.slice(1))
      } else {
        setGalleryImages([])
      }
    }
    // views = 조회수 (không đổi khi like), likes = 좋아요, likedByMe = đã like chưa
    setViewCount((recipeData as any)?.views ?? 0)
    setLikeCount((recipeData as any)?.likes ?? 0)
    setIsLiked((recipeData as any)?.likedByMe ?? false)
  }, [recipeData])

  const handleLike = () => {
    if (likeMutation.isPending) return
    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
    // Call API
    likeMutation.mutate()
  }

  const handlePostComment = async () => {
    if (!comment.trim()) return
    createCommentMutation.mutate(comment)
  }

  const handleNextPost = () => {
    if (isLastRecipe && previousRecipe) {
      // If last recipe, go to previous
      router.push(`/community/main/${previousRecipe.id}`)
    } else if (nextRecipe) {
      // Go to next recipe
      router.push(`/community/main/${nextRecipe.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !recipeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">레시피를 찾을 수 없습니다</h2>
          <Button onClick={() => router.push('/contents')}>목록으로</Button>
        </div>
      </div>
    )
  }

  const featuredProduct = product ? {
    name: product.productName || "정보 없음",
    price: product.salePrice || product.productPrice || 0,
    currency: "원",
    image: product.imageRegistrationThumbnail || "/placeholder.svg",
  } : null

  return (
    <Card className="max-w-2xl mx-auto bg-card border border-border shadow-sm my-10">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-[#F15A29]">
              <AvatarFallback className="bg-[#F15A29] text-card text-sm font-medium">{author.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground text-sm">{author.name}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
          {/* <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-muted rounded-md transition-colors" aria-label="Edit recipe">
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-muted rounded-md transition-colors" aria-label="Delete recipe">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div> */}
        </div>

        {/* Title */}
        <h2 className="font-semibold text-foreground text-base mb-3">{title}</h2>

        {/* Main Image */}
        <div className="rounded-lg overflow-hidden mb-3">
          <img src={mainImage || "/placeholder.svg"} alt={title} className="w-full h-56 object-cover" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className="flex items-center gap-1 p-1 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Like recipe"
          >
            {likeMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#F15A29]" />
            ) : (
              <Heart
                className={`h-5 w-5 transition-colors ${isLiked ? "fill-[#F15A29] text-[#F15A29]" : "text-foreground"}`}
              />
            )}
          </button>
          {/* <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label="Bookmark recipe"
          >
            <Bookmark
              className={`h-5 w-5 transition-colors ${
                isBookmarked ? "fill-foreground text-foreground" : "text-foreground"
              }`}
            />
          </button> */}
        </div>

        {/* Stats: 조회수 (views), 좋아요 (likes), 댓글 (comments) */}
        <p className="text-sm text-foreground mb-4">
          <span className="font-semibold">{viewCount}</span> 조회수 · <span className="font-semibold">{likeCount}</span> 좋아요 · <span className="font-semibold">{comments.length}</span> 댓글
        </p>

        {/* Ingredients */}
        {/* <div className="bg-muted rounded-lg p-3 mb-3">
          <h3 className="font-medium text-foreground text-sm mb-2 flex items-center gap-1">🍳 Ingredients</h3>
          <ul className="text-sm text-muted-foreground space-y-0.5">
            {ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div> */}

        {/* Recipe Steps */}
        <div className="bg-white rounded-lg p-3 mb-4">
          <h3 className="font-medium text-foreground text-sm mb-2 flex items-center gap-1">👨‍🍳 레시피</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            {steps.map((step, index) => (
              <li key={index}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div className="flex gap-2 mb-4">
            {galleryImages.map((image, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img src={image || "/placeholder.svg"} alt={`Gallery ${index + 1}`} className="w-20 h-20 object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Featured Product */}
        {featuredProduct && (
          <div className="mb-4">
            <p className="text-sm text-[#F15A29] mb-2">
              이번 주 사용된 제품은 무엇인가요?
            </p>
            <div className="border border-border rounded-lg p-3 flex items-center gap-3">
              <div className="rounded-lg overflow-hidden shrink-0">
                <img
                  src={featuredProduct.image || "/placeholder.svg"}
                  alt={featuredProduct.name}
                  className="w-14 h-14 object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{featuredProduct.name}</p>
                <p className="text-[#F15A29] font-semibold">{featuredProduct.price.toLocaleString()}</p>
                <p className="text-[#F15A29] text-sm">{featuredProduct.currency}</p>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="mb-4 space-y-3">
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((commentItem) => (
              <div key={commentItem.id} className="flex gap-3">
                <Avatar className="h-8 w-8 bg-[#F15A29]">
                  <AvatarFallback className="bg-[#F15A29] text-card text-xs font-medium">
                    {commentItem.author?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {commentItem.author?.name || "익명"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(commentItem.createdAt), "yyyy-MM-dd")}
                    </p>
                  </div>
                  <p className="text-sm text-foreground">{commentItem.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">아직 댓글이 없습니다</p>
          )}
        </div>

        {/* Comment Input */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-muted-foreground">나</span>
          <Input
            placeholder="댓글을 입력해주세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handlePostComment()
              }
            }}
            className="flex-1 bg-gray-100 border-0 text-sm"
            disabled={createCommentMutation.isPending}
          />
        </div>

        {/* Post Comment Button */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            className="flex-1 bg-[#F15A29] hover:bg-[#d94d20] text-card"
            onClick={handlePostComment}
            disabled={createCommentMutation.isPending || !comment.trim()}
          >
            {createCommentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                게시 중...
              </>
            ) : (
              "댓글 작성"
            )}
          </Button>
          <button className="p-2 border border-border rounded-md hover:bg-muted transition-colors" aria-label="Share recipe">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 text-sm bg-transparent"
            onClick={handleNextPost}
            disabled={!nextRecipe && !previousRecipe}
          >
            {isLastRecipe ? (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전 게시글
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mr-1" />
                다음 게시글
              </>
            )}
          </Button>
          <Link href="/contents">
            <Button variant="outline" className="flex-1 text-sm bg-transparent">
              <List className="h-4 w-4 mr-1" />
              목록
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
