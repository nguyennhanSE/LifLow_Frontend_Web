"use client"

import { useEffect, useRef, useMemo } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useRecipe } from "@/hooks/use-recipe/recipt.hook"
import { Recipe } from "@/entities/recipes/recipe.entity"
import Link from "next/link"

interface RecipeDisplay {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  author: string
  views: number
  likes: number
  category?: string
}

// Map Recipe to display format
function mapRecipeToDisplay(recipe: Recipe): RecipeDisplay {
  // Get first thumbnail if thumbnailUrl is an array
  let thumbnailUrl = "/placeholder.svg"
  if (recipe.thumbnailUrl) {
    if (Array.isArray(recipe.thumbnailUrl) && recipe.thumbnailUrl.length > 0) {
      thumbnailUrl = recipe.thumbnailUrl[0]
    } else if (typeof recipe.thumbnailUrl === 'string') {
      thumbnailUrl = recipe.thumbnailUrl
    }
  }

  const recipeWithLikes = recipe as Recipe & { numberOfLikes?: number; likes?: number }
  const likes = recipeWithLikes.numberOfLikes ?? recipeWithLikes.likes ?? 0

  return {
    id: recipe.id || "",
    title: recipe.title || "",
    description: recipe.content || "",
    thumbnailUrl,
    author: recipe.authorName || recipe.author?.name || "Anonymous",
    views: recipe.views || 0,
    likes,
    category: recipe.category,
  }
}

const translateCategoryToKorean = (category: string) => {
  switch (category) {
    case "RECIPE":
      return "레시피"
    case "REVIEWS":
      return "후기"
    case "DAILY_LIFE":
      return "일상"
    default:
      return category
  }
}

export function RecipesSection() {
  const { getRecipes } = useRecipe()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const limit = 10

  const {
    data: recipesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<Recipe[]>({
    queryKey: ['recipes', 'home'],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number
      const page = offset / limit + 1
      const result = await getRecipes({
        page,
        limit,
        status: 'approved',
        isActive: true,
      })

      // getRecipes returns { data: Recipe[], pagination }
      if (Array.isArray(result?.data)) {
        return result.data as Recipe[]
      }
      return []
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
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  })

  // Flatten pages data and map to display format
  const recipes = useMemo(() => {
    if (!recipesData?.pages) return []
    return recipesData.pages.flat().map(mapRecipeToDisplay)
  }, [recipesData])

  // Handle horizontal scroll to fetch next page
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer
      // When scrolled near the end (within 200px), fetch next page
      if (scrollWidth - scrollLeft - clientWidth < 200 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Scroll navigation handlers
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
      // Also trigger fetch if near the end
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      if (scrollWidth - scrollLeft - clientWidth < 400 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  return (
    <section className="bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">🔍 쭈왕 레시피</h2>
            <p className="text-sm text-muted-foreground">
              쭈왕 상품으로 만드는 맛있는 레시피를 공유해보세요 (레시피 승인 시 500 포인트!)
            </p>
          </div>
          {recipes.length > 4 && (
            <Link href="/contents">
              <Button variant="outline">전체보기</Button>
            </Link>
          )}
        </div>

        <div className="relative">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF5833]" />
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center py-12 text-red-400">
              레시피를 불러오는데 실패했습니다
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex justify-center items-center py-12 text-gray-400">
              레시피가 없습니다
            </div>
          ) : (
            <>
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
              >
                {recipes.map((recipe) => (
                  <Link key={recipe.id} href={`/community/main/${recipe.id}`}>
                    <Card
                      className="shrink-0 py-0 w-[360px] overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-[280px] md:h-[360px] bg-muted">
                        <img
                          src={recipe.thumbnailUrl || "/placeholder.svg"}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="px-4 pb-4">
                      <div className="mb-2 flex items-center gap-3">
                        🥄
                        <span className="text-xs text-orange-500">{translateCategoryToKorean(recipe.category || "")}</span>
                      </div>
                        <h3 className="font-semibold text-base mb-2 text-foreground line-clamp-2">{recipe.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{recipe.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                            {recipe.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{recipe.author}</p>
                            <p className="text-xs text-muted-foreground">25.10.28</p>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <span className="text-red-500 text-sm">♥</span>
                            <span className="text-xs text-muted-foreground">{recipe.likes.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {isFetchingNextPage && (
                  <div className="shrink-0 w-[360px] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF5833]" />
                  </div>
                )}
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-black rounded-full shadow-md border border-gray-200"
                onClick={handleScrollLeft}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-black rounded-full shadow-md border border-gray-200"
                onClick={handleScrollRight}
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/community/create">
            <Button className="bg-[#FF5833] hover:bg-[#E64A2E] text-white px-8">레시피 작성하기</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
