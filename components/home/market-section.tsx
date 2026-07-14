"use client"

import { useState, useEffect, useRef, memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProductCategoryEntity, ECategoryType } from "@/entities/product-category/product-category.entity"
import { useProduct } from "@/hooks/use-product/product.hook"
import { ProductEntity } from "@/entities/products/product.entity"
import { ProductListQueryDto } from "@/hooks/use-product/product.dto"
import { useCategory } from "@/hooks/use-category/category.hook"
import { useBanner } from "@/hooks/use-banner/banner.hook"
import { createProductNavigationHandler } from "@/lib/utils"
import { BannerEntity } from "@/entities/banner/banner.entity"
import { useTranslation } from 'react-i18next'

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"

const getCategoryLabel = (categoryType: ECategoryType): string => {
  const labels: Record<ECategoryType, string> = {
    [ECategoryType.LIVESTOCK]: "축산",
    [ECategoryType.CONVENIENCE_FOOD]: "간편식",
    [ECategoryType.FISHERIES]: "수산",
    [ECategoryType.SIDE_DISH]: "반찬",
  }
  return labels[categoryType] || categoryType
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

const ProductCard = memo(function ProductCard({
  product,
  cardRef,
  onClick,
}: {
  product: ProductEntity
  cardRef?: React.Ref<HTMLDivElement>
  onClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card
      ref={cardRef}
      className="overflow-hidden py-0 group cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="relative h-[150px] md:h-[220px] bg-muted">
        {product.productSpecialOffer?.status && (
          <Badge className="absolute top-3 left-3 bg-[#FF5833] text-white border-0 z-10">{t('key44', '🔥 이번주 특가')}</Badge>
        )}
        {product.productBadges && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-10">
            {typeof product.productBadges === 'object' && !Array.isArray(product.productBadges) && (
              <>
                {product.productBadges.isHotDeal && (
                  <Badge className="bg-orange-100 text-orange-500 border border-orange-500">{t('key45', '핫딜')}</Badge>
                )}
                {product.productBadges.isNewProduct && (
                  <Badge className="bg-blue-100 text-blue-500 border border-blue-500">{t('key46', '신상품')}</Badge>
                )}
                {product.productBadges.isBestSeller && (
                  <Badge className="bg-purple-100 text-purple-500 border border-purple-500">{t('best', 'BEST')}</Badge>
                )}
              </>
            )}
          </div>
        )}
        <Image
          src={product.imageRegistrationThumbnail || product.imageRegistrationDetail || "/placeholder.svg"}
          alt={product.productName || "Product"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover transition-opacity duration-300"
        />
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">
          {product.brand || product.category?.name || "상품"}
        </p>
        <h3 className="font-semibold text-sm mb-2 text-foreground line-clamp-2">
          {product.productName || "상품명 없음"}
        </h3>
        {(Number(product.productReviews?.averageRating) > 0 || Number(product.productReviews?.total) > 0) && (
          <div className="flex items-center gap-1 mb-2">
            {Number(product.productReviews?.averageRating) > 0 && (
              <>
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-sm font-medium text-foreground">
                  {Number(product.productReviews?.averageRating).toFixed(1)}
                </span>
              </>
            )}
            {Number(product.productReviews?.total) > 0 && (
              <span className="text-xs text-muted-foreground">
                ({product.productReviews?.total})
              </span>
            )}
          </div>
        )}
        {product.productSpecialOffer?.status ? (
          <>
            {(product.consumerPrice || product.productPrice || 0) > (product.productSpecialOffer?.specialPriceApplied ?? product.salePrice ?? product.productPrice ?? 0) && (
              <div className="text-sm text-gray-400 line-through mb-1">
                {(product.consumerPrice || product.productPrice || 0).toLocaleString()}원
              </div>
            )}
            <div className="flex items-center gap-2">
              {(() => {
                const originalPrice = product.consumerPrice || product.productPrice || 0
                const discountAmount = product.productSpecialOffer?.discountAmount || 0
                const discountPct = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0
                return discountPct > 0 ? (
                  <Badge className="bg-[#FF5833] text-white text-xs border-0">{t('discountpct', '{{discountPct}}%', { discountPct })}</Badge>
                ) : null
              })()}
              <span className="text-xl font-bold text-[#FF5833]">
                {(product.productSpecialOffer?.specialPriceApplied ?? product.salePrice ?? product.productPrice ?? 0).toLocaleString()}원
              </span>
            </div>
          </>
        ) : (
          <div className="text-base font-bold text-foreground">
            {product.salePrice
              ? product.salePrice.toLocaleString()
              : product.productPrice
              ? product.productPrice.toLocaleString()
              : "0"}
            <span className="text-sm font-normal ml-1">원</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export function MarketSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeCategoryNumber, setActiveCategoryNumber] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductCategoryEntity[]>([])
  const [products, setProducts] = useState<ProductEntity[]>([])
  const [banner, setBanner] = useState<BannerEntity | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 350)
  const [bannerHeight, setBannerHeight] = useState<number>(640)
  const cardRef = useRef<HTMLDivElement>(null)
  const { getProducts } = useProduct()
  const { getCategories } = useCategory()
  const { getBannerByCategory } = useBanner()

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const data = await getCategories({})
        setCategories(Array.isArray(data) ? data : data?.categories || data?.data || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [getCategories])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const query: ProductListQueryDto = {
          category: activeCategoryNumber || undefined,
          search: debouncedSearch || undefined,
          displayStatus: "Y",
        }
        const data = await getProducts(query)
        setProducts(Array.isArray(data) ? data : data?.data || [])
      } catch (error) {
        console.error("Error fetching products:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [activeCategoryNumber, debouncedSearch, getProducts])

  useEffect(() => {
    const fetchBanner = async () => {
      if (activeCategoryNumber === null) {
        setBannerLoading(true)
        try {
          const b = await getBannerByCategory('ALL')
          setBanner(b || null)
        } catch (error) {
          console.error("Error fetching banner:", error)
          setBanner(null)
        } finally {
          setBannerLoading(false)
        }
        return
      }

      const selectedCategory = categories.find(cat => cat.productCategoryNumber === activeCategoryNumber)
      if (!selectedCategory) {
        setBanner(null)
        return
      }

      setBannerLoading(true)
      try {
        const b = await getBannerByCategory(selectedCategory.name)
        setBanner(b || null)
      } catch (error) {
        console.error("Error fetching banner:", error)
        setBanner(null)
      } finally {
        setBannerLoading(false)
      }
    }

    fetchBanner()
  }, [activeCategoryNumber, categories, getBannerByCategory])

  useEffect(() => {
    const node = cardRef.current
    if (!node) return

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height
      if (height && height > 0) {
        setBannerHeight(height * 2)
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [products.length > 0])

  const handleBannerCtaClick = useCallback(() => {
    const url = banner?.ctaButtonUrl
    if (!url) return
    if (/^https?:\/\//i.test(url)) {
      window.location.href = url
      return
    }
    router.push(url)
  }, [banner?.ctaButtonUrl, router])

  const handleProductClick = useCallback(
    (productId: string) => createProductNavigationHandler(router, productId),
    [router]
  )

  return (
    <section className="bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t('key101', '🛒 마켓')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('key102', '자신있게 소개하는 쭈왕몰 제품들을 확인해보세요')}</p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={activeCategoryNumber === null ? "default" : "outline"}
              className={activeCategoryNumber === null ? "bg-[#FF5833] hover:bg-[#E64A2E] text-white" : ""}
              onClick={() => setActiveCategoryNumber(null)}
            >
              {t('key15', '전체')}
            </Button>
            {categoriesLoading ? (
              <Button variant="outline" disabled>{t('key103', '카테고리 불러오는 중...')}</Button>
            ) : (
              categories.map((category) => (
                <Button
                  key={category.productCategoryNumber}
                  variant={activeCategoryNumber === category.productCategoryNumber ? "default" : "outline"}
                  className={activeCategoryNumber === category.productCategoryNumber ? "bg-[#FF5833] hover:bg-[#E64A2E] text-white" : ""}
                  onClick={() => setActiveCategoryNumber(category.productCategoryNumber)}
                >
                  {getCategoryLabel(category.name)}
                </Button>
              ))
            )}
            <div className="relative w-full sm:min-w-[20rem] sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t('key104', '상품명, 브랜드 검색...')} 
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 lg:items-start">
          {banner?.imageUrl && (
            <div className="lg:col-span-4">
              <div 
                className="relative overflow-hidden rounded-lg"
                style={{ height: `${bannerHeight + 16}px`, minHeight: '400px' }}
              >
                <Image
                  src={banner.imageUrl}
                  alt={t('categoryBanner', 'Category banner')}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
                {(banner.title || banner.mainText || (banner.ctaButtonText && banner.ctaButtonUrl)) && (
                  <>
                    <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/15 to-black/35" />

                    {(banner.title || banner.mainText) && (
                      <div className="absolute left-4 top-4 right-4">
                        {banner.title && (
                          <p className="text-white font-bold text-lg leading-snug drop-shadow">
                            {banner.title}
                          </p>
                        )}
                        {banner.mainText && (
                          <p className="mt-1 text-white/90 text-sm leading-snug drop-shadow line-clamp-3">
                            {banner.mainText}
                          </p>
                        )}
                      </div>
                    )}

                    {banner.ctaButtonText && banner.ctaButtonUrl && (
                      <div className="absolute left-4 right-4 bottom-4">
                        <Button
                          onClick={handleBannerCtaClick}
                          className="w-full bg-white text-foreground font-medium shadow-md hover:bg-white/90"
                        >
                          {banner.ctaButtonText}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className={banner?.imageUrl ? "lg:col-span-8" : "lg:col-span-12"}>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('key105', '상품 불러오는 중...')}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('key106', '상품이 없습니다.')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cardRef={index === 0 ? cardRef : undefined}
                    onClick={handleProductClick(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="link" 
            className="text-red-500"
            onClick={() => router.push('/market')}
          >
            {t('key107', '상품 페이지에서 더 많은 상품 보기 →')}
          </Button>
        </div>
      </div>
    </section>
  )
}
