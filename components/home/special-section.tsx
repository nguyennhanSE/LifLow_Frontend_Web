"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, Star, Loader2, SearchIcon, PackageOpen, Snowflake } from "lucide-react"
import { useProduct } from "@/hooks/use-product/product.hook"
import { ProductEntity } from "@/entities/products/product.entity"
import { createProductNavigationHandler } from "@/lib/utils"
import { useBanner } from "@/hooks/use-banner/banner.hook"
import { EBannerType } from "@/entities/banner/banner.entity"
import { Button } from "@/components/ui/button"

interface SpecialProduct {
  id: string
  image: string
  title: string
  rating: number
  reviewCount: number
  originalPrice: number
  discount: number
  finalPrice: number
  timeRemaining: number // in seconds
  storageType: string
  salePrice: number
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

// Map ProductEntity from API to display format
function mapProductToSpecialProduct(product: ProductEntity): SpecialProduct {
  const now = new Date()
  const specialOffer = product.productSpecialOffer
  
  // Calculate time remaining from endDate
  let timeRemaining = 0
  if (specialOffer?.endDate) {
    const endDate = new Date(specialOffer.endDate)
    const diff = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000))
    timeRemaining = diff
  }

  // Get original price (consumerPrice or productPrice)
  const originalPrice = product.consumerPrice ?? 0
  
  // Get discount amount
  const discount = specialOffer?.discountAmount || 0
  
  // Get final price (specialPriceApplied or calculated)
  const finalPrice = product.salePrice ?? 0

  // Determine storage type: prefer product.storageMethod (API canonical), then parse additionalItem03StorageMethod
  const rawFromApi = (product.storageMethod ?? product.additionalItem03StorageMethod)?.toLowerCase() || ""
  const storageType: "refrigerated" | "room_temperature" | "frozen" =
    rawFromApi === "refrigerated" || rawFromApi === "room_temperature" || rawFromApi === "frozen"
      ? rawFromApi
      : rawFromApi.includes("frozen") || rawFromApi.includes("freeze")
        ? "frozen"
        : rawFromApi.includes("refrigerated") || rawFromApi.includes("cold")
          ? "refrigerated"
          : rawFromApi.includes("room") || rawFromApi.includes("temperature")
            ? "room_temperature"
            : "room_temperature"

  // Get image (prefer thumbnail, fallback to detail, then placeholder)
  const image = product.imageRegistrationThumbnail || 
                product.imageRegistrationDetail || 
                "/placeholder.svg"

  return {
    id: product.id || "",
    image,
    title: product.productName || "",
    rating: product.productReviews?.averageRating || 0,
    reviewCount: product.productReviews?.total || 0,
    originalPrice,
    discount,
    finalPrice,
    timeRemaining,
    storageType,
    salePrice: product.salePrice || 0,
  }
}

export default function SpecialSection() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("less-time")
  const [activeFilter, setActiveFilter] = useState<"in-progress" | "ended">("in-progress")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  const { getSpecialOffers } = useProduct()
  const { getBannersByType } = useBanner()

  // Fetch banner
  const {
    data: bannerData,
    isLoading: isLoadingBanner,
  } = useQuery({
    queryKey: ["banner", "SPECIAL_PRICE"],
    queryFn: async () => {
      const result = await getBannersByType(EBannerType.SPECIAL_PRICE)
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
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = {
      page: 1,
      limit: 100, // Get all special offers
    }

    // Add isOutDated when viewing ended offers
    if (activeFilter === "ended") {
      params.isOutDated = true
    }

    // Add search query
    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim()
    }

    // Add sort parameters
    if (sortBy === "less-time") {
      params.sortBy = "endDate"
      params.sortOrder = "asc"
    } else if (sortBy === "most-discount") {
      params.sortBy = "discountAmount"
      params.sortOrder = "desc"
    } else if (sortBy === "highest-rated") {
      // Note: Rating might not be available, so this might not work as expected
      params.sortBy = "productName"
      params.sortOrder = "asc"
    }

    return params
  }, [debouncedSearchTerm, sortBy, activeFilter])

  // Fetch special offers
  const {
    data: specialOffersResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["special-offers", queryParams],
    queryFn: async () => {
      const result = await getSpecialOffers(queryParams)
      
      // Extract products from response
      let products: ProductEntity[] = []
      if (result?.data?.docs) {
        products = result.data.docs
      } else if (Array.isArray(result?.data)) {
        products = result.data
      } else if (Array.isArray(result)) {
        products = result
      }

      return {
        products,
        inProgress: result?.inProgress ?? 0,
        isOutDated: result?.isOutDated ?? 0,
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const products = specialOffersResponse?.products || []
  const inProgressCount = specialOffersResponse?.inProgress ?? 0
  const isOutDatedCount = specialOffersResponse?.isOutDated ?? 0

  // Map to display format and sort
  const mappedProducts = useMemo(() => {
    const mapped = products.map(mapProductToSpecialProduct)
    
    // Apply sorting
    if (sortBy === "less-time") {
      return mapped.sort((a: SpecialProduct, b: SpecialProduct) => a.timeRemaining - b.timeRemaining)
    } else if (sortBy === "most-discount") {
      return mapped.sort((a: SpecialProduct, b: SpecialProduct) => b.discount - a.discount)
    } else if (sortBy === "highest-rated") {
      return mapped.sort((a: SpecialProduct, b: SpecialProduct) => b.rating - a.rating)
    }
    return mapped
  }, [products, sortBy])

  const formatTimeRemaining = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) {
      return `${days}일 ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} 남음`
    }
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} 남음`
  }


  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Gradient - Fallback if no banner */}
      {!isLoadingBanner && !bannerData && (
        <div className="bg-gradient-to-r from-[#ff6900] via-[#ff5833] to-[#ff5c5c] px-6 py-16 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">
            <span className="mr-2">🔥</span>
            이번주 특가
          </h1>
          <p className="text-lg text-white/90">매주 새로운 특가 상품을 만나보세요!</p>
        </div>
      )}

      {/* Banner Section - Full Width */}
      {!isLoadingBanner && bannerData && (
          <div className="mb-8 overflow-hidden rounded-none">
            <div className="relative w-full h-[300px] md:h-[350px]">
              {/* Banner Image */}
              {bannerData.imageUrl ? (
                <ImgWithLoader
                  src={bannerData.imageUrl}
                  alt={bannerData.title || "Banner"}
                  className="h-full w-full object-cover rounded-none"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-[#EFF6FF] to-[#ECFEFF] flex items-center justify-center rounded-none">
                  <p className="text-lg font-semibold text-gray-400">Banner Pic</p>
                </div>
              )}
              
              {/* Content Overlay - Center */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 bg-black/30">
                <div className="max-w-3xl">
                  {bannerData.title && (
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                      {bannerData.title}
                    </h2>
                  )}

                  {bannerData.mainText && (
                    <p className="text-white text-base md:text-lg">
                      {bannerData.mainText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="mx-auto w-full sm:w-[90%] px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex gap-4 shrink-0">
            <button
              onClick={() => setActiveFilter("in-progress")}
              className={`text-sm whitespace-nowrap ${activeFilter === "in-progress" ? "font-semibold text-gray-900" : "text-gray-600"}`}
            >
              진행중 ({inProgressCount})
            </button>
            <button
              onClick={() => setActiveFilter("ended")}
              className={`text-sm whitespace-nowrap ${activeFilter === "ended" ? "font-semibold text-gray-900" : "text-gray-600"}`}
            >
              종료 ({isOutDatedCount})
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative flex-1 min-w-0">
              <Input
                type="text"
                placeholder="상품명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white pr-10"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 sm:w-40 shrink-0 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="less-time">남은시간 적은순</SelectItem>
                <SelectItem value="most-discount">할인율 높은순</SelectItem>
                <SelectItem value="highest-rated">평점 높은순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff6900]" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">특가 상품을 불러오는 중 오류가 발생했습니다: {error?.message || "알 수 없는 오류"}</p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !isError && (
          <>
            {mappedProducts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">특가 상품이 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                {mappedProducts.map((product: SpecialProduct) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden py-0 border-0 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
                    onClick={createProductNavigationHandler(router, product.id)}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[1/1] overflow-hidden">
                      <ImgWithLoader
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />

                      {/* Countdown Timer Badge */}
                      {product.timeRemaining > 0 && (
                        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#ff6900] px-3 py-1 text-xs font-medium text-white shadow-lg">
                          <Clock className="h-3 w-3" />
                          {formatTimeRemaining(product.timeRemaining)}
                        </div>
                      )}

                      {/* Storage Type Badge */}
                      {/* <div
                        className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
                          product.storageType=== "refrigerated"
                            ? "bg-[#dcfce7] text-[#008236]"
                            : product.storageType === "frozen"
                              ? "bg-[#e0f2fe] text-[#0369a1]"
                              : "bg-[#fef3e2] text-[#e17100]"
                        }`}
                      >
                        {product.storageType === "refrigerated" ? (
                          <>
                            <Snowflake className="h-3.5 w-3.5" />
                            <span>냉장</span>
                          </>
                        ) : product.storageType === "frozen" ? (
                          <>
                            <Snowflake className="h-3.5 w-3.5" />
                            <span>냉동</span>
                          </>
                        ) : (
                          <>
                            <PackageOpen className="h-3.5 w-3.5" />
                            <span>상온</span>
                          </>
                        )}
                      </div> */}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Title */}
                      <h3 className="mb-2 text-base font-semibold text-gray-900">{product.title}</h3>

                      {/* Rating */}
                      {(product.rating > 0 || product.reviewCount > 0) && (
                        <div className="mb-3 flex items-center gap-1">
                          {product.rating > 0 && (
                            <>
                              <span className="text-yellow-500 text-sm">★</span>
                              <span className="text-sm font-medium text-gray-900">{product.rating.toFixed(1)}</span>
                            </>
                          )}
                          {product.reviewCount > 0 && (
                            <span className="text-sm text-gray-500">({product.reviewCount})</span>
                          )}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {product.originalPrice > 0 && (
                            <span className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString()}</span>
                          )}
                          {product.discount > 0 && (
                            <span className="rounded bg-[#ff5c5c] px-2 py-0.5 text-xs font-bold text-white">
                              {product.discount.toLocaleString()}원↓
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-gray-900">{product.finalPrice.toLocaleString()}</span>
                          <span className="text-sm text-gray-600">원</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
