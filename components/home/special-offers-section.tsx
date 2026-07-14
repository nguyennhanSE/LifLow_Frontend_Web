"use client"

import { useEffect, useRef, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Flame, Loader2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useProduct } from "@/hooks/use-product/product.hook"
import { ProductEntity } from "@/entities/products/product.entity"
import { createProductNavigationHandler } from "@/lib/utils"

interface SpecialOfferDisplay {
  id: string
  name: string
  category: string
  rating?: number
  reviews?: number
  originalPrice: number
  discountedPrice: number
  discount: number
  image: string
  badge: string | null
  timeRemaining: number // in seconds
  storageType: "room" | "refrigerated"
  productBadges?: {
    isHotDeal: boolean
    isNewProduct: boolean
    isBestSeller: boolean
  } | null
}

// Map ProductEntity to display format
function mapProductToDisplay(product: ProductEntity): SpecialOfferDisplay {
  const now = new Date()
  const specialOffer = product.productSpecialOffer
  
  // Calculate time remaining from endDate
  let timeRemaining = 0
  if (specialOffer?.endDate) {
    const endDate = new Date(specialOffer.endDate)
    const diff = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000))
    timeRemaining = diff
  }

  // Determine storage type from additionalItem03StorageMethod
  const storageMethod = product.additionalItem03StorageMethod?.toLowerCase() || ""
  const storageType: "room" | "refrigerated" = 
    storageMethod.includes("refrigerated") || storageMethod.includes("cold") 
      ? "refrigerated" 
      : "room"

  const originalPrice = product.consumerPrice || product.productPrice || 0
  const specialPrice = product.productSpecialOffer?.specialPriceApplied || product.salePrice || product.productPrice || 0
  const discountAmount = product.productSpecialOffer?.discountAmount || 0
  const discountPercentage = originalPrice > 0 
    ? Math.round((discountAmount / originalPrice) * 100) 
    : 0

  // Get productBadges - handle both object and array formats
  let productBadges = null
  if (product.productBadges) {
    if (typeof product.productBadges === 'object' && !Array.isArray(product.productBadges)) {
      productBadges = {
        isHotDeal: product.productBadges.isHotDeal || false,
        isNewProduct: product.productBadges.isNewProduct || false,
        isBestSeller: product.productBadges.isBestSeller || false,
      }
    }
  }

  return {
    id: product.id,
    name: product.productName || "",
    category: product.category?.name || product.brand || "",
    rating: product.productReviews?.averageRating || 0,
    reviews: product.productReviews?.total || 0,
    originalPrice,
    discountedPrice: specialPrice,
    discount: discountPercentage,
    image: product.imageRegistrationThumbnail || "/placeholder.svg",
    badge: product.productSpecialOffer?.status ? "Hot" : null,
    timeRemaining,
    storageType,
    productBadges,
  }
}

export function SpecialOffersSection() {
  const router = useRouter()
  const { getSpecialOffers } = useProduct()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const limit = 10

  const {
    data: specialOffersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ProductEntity[]>({
    queryKey: ['special-offers'],
    queryFn: async ({ pageParam = 0 }) => {
      const page = (pageParam as number) / limit + 1
      const result = await getSpecialOffers({
        page,
        limit,
      })

      // Handle different response structures
      if (result?.data?.docs) {
        return result.data.docs
      } else if (Array.isArray(result?.data)) {
        return result.data
      } else if (Array.isArray(result)) {
        return result
      } else {
        return []
      }
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
  const specialOffers = useMemo(() => {
    if (!specialOffersData?.pages) return []
    return specialOffersData.pages.flat().map(mapProductToDisplay)
  }, [specialOffersData])

  // State for real-time countdown updates
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Recalculate time remaining based on current time
  const specialOffersWithUpdatedTime = useMemo(() => {
    return specialOffers.map(offer => {
      if (offer.timeRemaining <= 0) return offer
      
      // Find the original product to get endDate
      const originalProduct = specialOffersData?.pages
        .flat()
        .find(p => p.id === offer.id)
      
      if (originalProduct?.productSpecialOffer?.endDate) {
        const endDate = new Date(originalProduct.productSpecialOffer.endDate)
        const diff = Math.max(0, Math.floor((endDate.getTime() - currentTime.getTime()) / 1000))
        return { ...offer, timeRemaining: diff }
      }
      
      return offer
    })
  }, [specialOffers, currentTime, specialOffersData])

  // Format time remaining
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
    <section className="bg-white text-black py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-[#FF5833]" />
              <h2 className="text-2xl font-bold">이번주 특가</h2>
            </div>
            <p className="text-sm text-gray-600">지금 가장 인기있는 특가 상품을 만나보세요</p>
          </div>
          <Button 
            variant="outline" 
            className="border-gray-300 text-black hover:bg-gray-50"
            onClick={() => router.push('/special')}
          >
            전체보기
          </Button>
        </div>

        <div className="relative">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF5833]" />
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center py-12 text-red-400">
              특가 상품을 불러오는데 실패했습니다
            </div>
          ) : specialOffers.length === 0 ? (
            <div className="flex justify-center items-center py-12 text-gray-400">
              특가 상품이 없습니다
            </div>
          ) : (
            <>
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
              >
                {specialOffersWithUpdatedTime.map((offer) => (
                  <Card
                    key={offer.id}
                    className="shrink-0 py-0 w-[70%] sm:w-[45%] md:w-[30%] lg:w-[calc((100%-3rem)/4)] bg-white border border-gray-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={createProductNavigationHandler(router, offer.id)}
                  >
                    <div className="relative h-[280px] md:h-[300px]">
                      {/* Countdown Timer Badge */}
                      {offer.timeRemaining > 0 && (
                        <div className="absolute top-3 left-3 flex gap-2 z-10">
                          <Badge className="bg-[#FF5833] text-white text-xs border-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeRemaining(offer.timeRemaining)}
                          </Badge>
                        </div>
                      )}
                      {/* Storage Type and Special Badge */}
                      <div className="absolute bottom-3 left-3 flex gap-2 z-10 flex-wrap">
                        <Badge className="bg-[#FF5833] text-white text-xs border-0">
                          🔥 이번주 특가
                        </Badge>
                        {/* Product Badges (Hot Deal, New, Best) */}
                        {offer.productBadges && (
                          <>
                            {offer.productBadges.isHotDeal && (
                              <Badge className="bg-orange-100 text-orange-500 border border-orange-500">핫딜</Badge>
                            )}
                            {offer.productBadges.isNewProduct && (
                              <Badge className="bg-blue-100 text-blue-500 border border-blue-500">신상품</Badge>
                            )}
                            {offer.productBadges.isBestSeller && (
                              <Badge className="bg-purple-100 text-purple-500 border border-purple-500">BEST</Badge>
                            )}
                          </>
                        )}
                      </div>
                      <img
                        src={offer.image || "/placeholder.svg"}
                        alt={offer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 text-foreground line-clamp-2">{offer.name}</h3>
                      {((offer.rating !== undefined && offer.rating > 0) || (offer.reviews !== undefined && offer.reviews > 0)) && (
                        <div className="flex items-center gap-1 mb-3">
                          {offer.rating !== undefined && offer.rating > 0 && (
                            <>
                              <span className="text-yellow-500 text-sm">★</span>
                              <span className="text-sm font-medium text-foreground">{offer.rating.toFixed(1)}</span>
                            </>
                          )}
                          {offer.reviews !== undefined && offer.reviews > 0 && (
                            <span className="text-xs text-gray-500">({offer.reviews})</span>
                          )}
                        </div>
                      )}
                      {offer.originalPrice > offer.discountedPrice && (
                        <div className="text-sm text-gray-400 line-through mb-1">
                          {offer.originalPrice.toLocaleString()}원
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {offer.discount > 0 && (
                          <Badge className="bg-[#FF5833] text-white text-xs border-0">{offer.discount}%</Badge>
                        )}
                        <span className="text-xl font-bold text-[#FF5833]">{offer.discountedPrice.toLocaleString()}원</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {isFetchingNextPage && (
                  <div className="shrink-0 w-[70%] sm:w-[45%] md:w-[30%] lg:w-[calc((100%-3rem)/4)] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF5833]" />
                  </div>
                )}
              </div>

              {specialOffersWithUpdatedTime.length > 4 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full shadow-md border border-gray-200"
                    onClick={handleScrollLeft}
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full shadow-md border border-gray-200"
                    onClick={handleScrollRight}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
