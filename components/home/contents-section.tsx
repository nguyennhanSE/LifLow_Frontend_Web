"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bookmark, Heart, Search, ChevronLeft, ChevronRight, Loader2, Search as SearchIcon } from "lucide-react"
import { useRecipe } from "@/hooks/use-recipe/recipt.hook"
import { Recipe } from "@/entities/recipes/recipe.entity"
import { useBanner } from "@/hooks/use-banner/banner.hook"
import { EBannerType } from "@/entities/banner/banner.entity"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation, Trans } from 'react-i18next'

type Category = "all" | "RECIPE" | "REVIEWS" | "DAILY_LIFE"

interface RecipeItem {
  id: string
  image: string
  category: string
  title: string
  description: string
  author: string
  date: string
  likes: number
}

function ImgWithLoader({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative h-full w-full">
      {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${className || ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  )
}

// Map Recipe from API to display format
function mapRecipeToDisplay(recipe: Recipe): RecipeItem {
  const dateOfWriting = recipe.dateOfWriting 
    ? new Date(recipe.dateOfWriting) 
    : recipe.createdAt 
    ? new Date(recipe.createdAt) 
    : new Date()
  
  const formattedDate = format(dateOfWriting, "yy.MM.dd")
  
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
    image: thumbnailUrl,
    category: recipe.category || "RECIPE",
    title: recipe.title || "",
    description: recipe.content || "",
    author: recipe.authorName || recipe.author?.name || "Anonymous",
    date: formattedDate,
    likes,
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

export function ContentsSection() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<Category>("all")
  const [searchField, setSearchField] = useState("title")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const limit = 12
  const router = useRouter()
  const { getRecipes } = useRecipe()
  const { getBannersByType } = useBanner()

  // Fetch banner
  const {
    data: bannerData,
    isLoading: isLoadingBanner,
  } = useQuery({
    queryKey: ["banner", "CONTENT_HERO"],
    queryFn: async () => {
      const result = await getBannersByType(EBannerType.CONTENT_HERO)
      // Return first active banner if array, or the banner itself
      if (Array.isArray(result)) {
        return result.find((banner) => banner.status === "ACTIVE") || result[0] || null
      }
      return result || null
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit,
      status: "approved",
      isActive: true,
    }

    // Add category filter
    if (activeCategory !== "all") {
      params.category = activeCategory
    }

    // Add search query
    if (debouncedSearchTerm.trim()) {
      params.q = debouncedSearchTerm.trim()
    }

    return params
  }, [activeCategory, debouncedSearchTerm, currentPage])

  // Fetch recipes
  const {
    data: recipesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recipes", "contents", queryParams],
    queryFn: async () => {
      const result = await getRecipes(queryParams)
      
      // Handle different response structures
      if (result?.data && 'docs' in result.data) {
        return {
          recipes: result.data.docs,
          totalPages: (result.data as any).totalPages || 1,
          currentPage: (result.data as any).page || 1,
        }
      } else if (Array.isArray(result?.data)) {
        return {
          recipes: result.data,
          totalPages: 1,
          currentPage: 1,
        }
      } else if (Array.isArray(result)) {
        return {
          recipes: result,
          totalPages: 1,
          currentPage: 1,
        }
      }
      return {
        recipes: [],
        totalPages: 1,
        currentPage: 1,
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const recipes = recipesResponse?.recipes || []
  const totalPages = recipesResponse?.totalPages || 1
  const mappedRecipes = (recipes as Recipe[]).map(mapRecipeToDisplay)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category)
    setCurrentPage(1) // Reset to first page when category changes
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="mx-auto w-full">
        {/* Banner Section */}
        {!isLoadingBanner && bannerData && (
          <Card className="mb-8 overflow-hidden border-0 bg-linear-to-b from-[#EFF6FF] to-[#ECFEFF]">
            <div className="flex flex-col md:flex-row mx-auto w-[80%]">
              {/* Left: Banner Image */}
              {/* linear gradient background */}
              <div className="flex-1 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                {bannerData.imageUrl ? (
                  <ImgWithLoader
                    src={bannerData.imageUrl}
                    alt={bannerData.title || "Banner"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <p className="text-lg font-semibold">{t('bannerPic', 'Banner Pic')}</p>
                  </div>
                )}
              </div>

              {/* Right: Content */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-linear-to-b  from-[#FFF7ED] to-[#FEF2F2]">
                {bannerData.badgeText && (
                  <p className="text-sm font-semibold text-orange-500 uppercase mb-2">
                    {bannerData.badgeText}
                  </p>
                )}
                
                {bannerData.title && (
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <SearchIcon className="h-6 w-6 text-orange-500" />
                    {bannerData.title}
                  </h2>
                )}

                {bannerData.mainText && (
                  <p className="text-gray-600 mb-4 text-base md:text-lg">
                    {bannerData.mainText}
                  </p>
                )}

                {/* Points incentive - can be part of mainText or separate */}
                <p className="text-orange-500 mb-6 flex items-center gap-1 text-sm md:text-base"><Trans i18nKey="spanClassnametextlgspan500"><span className="text-lg">✨</span>
                   레시피 승인 시 500 포인트 적립</Trans></p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-[60%]">
                    <Button onClick={() => router.push(bannerData.ctaButtonUrl)} className="flex-1 bg-[#ff5833] text-white hover:bg-[#e04422] rounded-xs">
                      {bannerData.ctaButtonText}
                    </Button>
                  <Button onClick={() => router.push("/notice")} variant="outline" className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xs">
                    {t('key129', '레시피 공지 보기')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 mx-auto w-full sm:w-[90%] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Button
                variant={activeCategory === "all" ? "default" : "ghost"}
                onClick={() => handleCategoryChange("all")}
                className={`shrink-0 ${activeCategory === "all" ? "bg-orange-500 text-white hover:bg-orange-600" : "hover:bg-gray-100 border border-[#2d2d2d]"}`}
              >
                {t('key15', '전체')}
              </Button>
              <Button
                variant={activeCategory === "RECIPE" ? "default" : "ghost"}
                onClick={() => handleCategoryChange("RECIPE")}
                className={`shrink-0 ${activeCategory === "RECIPE" ? "bg-orange-500 text-white hover:bg-orange-600" : "hover:bg-gray-100 border border-[#2d2d2d]"}`}
              >
                {t('key130', '레시피')}
              </Button>
              <Button
                variant={activeCategory === "REVIEWS" ? "default" : "ghost"}
                onClick={() => handleCategoryChange("REVIEWS")}
                className={`shrink-0 ${activeCategory === "REVIEWS" ? "bg-orange-500 text-white hover:bg-orange-600" : "hover:bg-gray-100 border border-[#2d2d2d]"}`}
              >
                {t('key131', '후기')}
              </Button>
              <Button
                variant={activeCategory === "DAILY_LIFE" ? "default" : "ghost"}
                onClick={() => handleCategoryChange("DAILY_LIFE")}
                className={`shrink-0 ${activeCategory === "DAILY_LIFE" ? "bg-orange-500 text-white hover:bg-orange-600" : "hover:bg-gray-100 border border-[#2d2d2d]"}`}
              >
                {t('key132', '일상')}
              </Button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 min-w-0">
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-24 sm:w-32 shrink-0 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">{t('key133', '제목')}</SelectItem>
                  <SelectItem value="author">{t('key134', '작성자')}</SelectItem>
                  <SelectItem value="content">{t('key135', '내용')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder={t('key136', '검색어를 입력하세요...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white pr-10"
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">{t('key137', '레시피를 불러오는 중 오류가 발생했습니다:')} {error?.message || t('key37', '알 수 없는 오류')}</p>
          </div>
        )}

        {/* Recipe Grid */}
        {!isLoading && !isError && (
          <>
            {mappedRecipes.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">{t('key25', '검색 결과가 없습니다')}</p>
              </div>
            ) : (
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mx-auto w-[90%]">
                {mappedRecipes.map((item: RecipeItem) => (
                  <Link key={item.id} href={`/community/main/${item.id}`}>
                    <Card className="overflow-hidden py-0 border-0 shadow-sm transition-shadow hover:shadow-md cursor-pointer">
                    {/* Image */}
                    <div className="relative aspect-4/4 overflow-hidden">
                      <ImgWithLoader src={item.image || "/placeholder.svg"} alt={item.title} className="h-full w-full object-cover" />
                      {/* <button 
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-gray-100"
                        aria-label="Bookmark recipe"
                      >
                        <Bookmark className="h-4 w-4 text-gray-600" />
                      </button> */}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Category Badge */}
                      <div className="mb-2 flex items-center gap-3">
                        {/* <svg
                          className="h-3 w-3 text-orange-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 7h-9M14 17H5M21 12h-8M9 7H4" />
                        </svg> */}
                        {t('key99', '🥄')}
                        {/* tranlate category to Korean */}
                        <span className="text-xs text-orange-500">{translateCategoryToKorean(item.category)}</span>
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-base font-semibold text-gray-900">{item.title}</h3>

                      {/* Description */}
                      <p className="mb-4 line-clamp-2 text-sm text-gray-600">{item.description}</p>

                      {/* Author & Likes */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-green-500 text-xs text-white">
                              {item.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-900">{item.author}</span>
                            <span className="text-xs text-gray-400">{item.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-600">{item.likes}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('key138', '이전')}
            </Button>
            {getPageNumbers().map((page, index) => (
              <Button
                key={index}
                variant={page === currentPage ? "default" : "ghost"}
                size="sm"
                className={page === currentPage ? "bg-orange-500 hover:bg-orange-600" : ""}
                onClick={() => typeof page === "number" && handlePageChange(page)}
                disabled={typeof page === "string"}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t('key139', '다음')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
