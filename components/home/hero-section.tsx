"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Heart, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useBanner } from "@/hooks/use-banner/banner.hook"
import { EBannerType, BannerEntity } from "@/entities/banner/banner.entity"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import Link from "next/link"
import "./modify.css"
import { useTranslation } from 'react-i18next'

export function HeroSection() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(true)
  const [heroImageLoaded, setHeroImageLoaded] = useState(false)
  const { getBannersByType } = useBanner()

  // Fetch banners with type MAIN_PRODUCTS
  const { data: banners, isLoading, isError } = useQuery<BannerEntity[]>({
    queryKey: ["banners", EBannerType.MAIN_PRODUCTS],
    queryFn: () => getBannersByType(EBannerType.MAIN_PRODUCTS),
  })

  // Get first active banner or first banner
  const banner = useMemo(() => {
    if (!banners || banners.length === 0) return null
    const activeBanner = banners.find(b => b.status === 'ACTIVE')
    return activeBanner || banners[0]
  }, [banners])

  const product = banner?.product

  // Get banner images - use imageUrl from all banners
  const bannerImages = useMemo(() => {
    if (!banners || banners.length === 0) return []
    return banners
      .filter(b => b.imageUrl)
      .slice(0, 6)
      .map(b => b.imageUrl!)
  }, [banners])

  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (!product?.consumerPrice || !product?.salePrice) return 0
    return Math.round(((product.consumerPrice - product.salePrice) / product.consumerPrice) * 100)
  }, [product?.consumerPrice, product?.salePrice])

  // Get background image URL
  const backgroundImageUrl = banner?.mobileImageUrl || "/korean-food-products.jpg"
  const productImageUrl = banner?.imageUrl || banner?.product?.imageRegistrationThumbnail

  // Reset loaded state when image URL changes
  useEffect(() => {
    setHeroImageLoaded(false)
  }, [productImageUrl])

  if (isLoading) {
    return (
      <section className="relative h-[600px] overflow-hidden flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </section>
    )
  }

  if (isError || !banner) {
    return (
      <section className="relative h-[600px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(/korean-food-products.jpg)",
            filter: "blur(4px) brightness(0.7)",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <p>{t('key126', '배너를 불러올 수 없습니다.')}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          filter: "brightness(0.7)",
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto pl-4 h-full">
        {/* Text at top - Full width */}
        <div className="text-left mb-8 pt-8 relative z-10 mx-auto w-full">
          <h1 className="text-5xl font-medium text-white mb-4 text-left drop-shadow-lg">
            {banner.title ? (
              <span className="text-white">{banner.title}</span>
            ) : (
              <>
                <span className="text-white">{t('juwangs', 'Juwang\'s')} </span>
                <span className="text-[#FF6B4A]">{t('theBest', 'The best')}</span>
                <span className="text-white"> {t('ifSo', 'if so')}</span>
              </>
            )}
          </h1>
          {/* {banner.mainText && (
            <p className="text-white text-xl flex items-center justify-center gap-2 drop-shadow-lg">
              {banner.mainText} <ThumbsUp className="w-6 h-6" />
            </p>
          )} */}
        </div>

        {/* Two equal columns */}
        <div className="flex gap-0 h-[calc(100%-15vh)]">
          {/* Left side - Product images */}
          <div className="flex-[0_0_45%] flex items-center justify-center relative">
            {bannerImages.length > 0 && (
              <div className="relative flex items-end justify-center z-10 w-full h-full">
                {/* Background image filling the entire div */}
                {bannerImages[0] && (
                  <>
                    {!heroImageLoaded && (
                      <div
                        className="absolute inset-0 bg-gray-200 animate-pulse left-border"
                        aria-hidden
                      />
                    )}
                    <Image
                      src={productImageUrl || "/placeholder.svg"}
                      alt={t('background', 'Background')}
                      fill
                      className={`object-cover w-full h-full left-border transition-opacity duration-300 ${heroImageLoaded ? "opacity-100" : "opacity-0"}`}
                      sizes="(max-width: 768px) 100vw, 45vw"
                      loading="lazy"
                      onLoad={() => setHeroImageLoaded(true)}
                      onError={() => setHeroImageLoaded(true)}
                    />
                  </>
                )}
                {/* Bottom row - 5 products */}
                {/* <div className="relative flex items-end gap-2 z-10">
                  {bannerImages.slice(0, 5).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-32 h-40 md:w-40 md:h-52 lg:w-48 lg:h-60 rounded-lg overflow-hidden shadow-lg"
                      style={{
                        transform: idx === 2 ? 'translateY(-20px)' : 'none',
                        zIndex: idx === 2 ? 10 : 5 - idx,
                      }}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={banner?.title || "Banner"}
                        fill
                        className="object-cover w-full h-full"
                        sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                      />
                    </div>
                  ))}
                </div> */}
                
                {/* Top row - 1 product in center (if we have 6+ images) */}
                {bannerImages.length >= 6 && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 md:w-40 md:h-52 lg:w-48 lg:h-60 rounded-lg overflow-hidden shadow-lg z-20"
                  >
                    <Image
                      src={bannerImages[5] || "/placeholder.svg"}
                      alt={banner?.title || "Banner"}
                      fill
                      className="object-cover w-full h-full"
                      sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Product card */}
          {showModal && product && (
            <div className="flex-1 flex justify-start items-center w-full">
              <Card className="w-[90%] h-full p-6 bg-white shadow-2xl flex flex-col right-border">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-[#FF6B4A] font-medium">
                    {banner.badgeText || "신규회원 전용"}
                  </span>
                  {/* <Heart className="w-5 h-5 text-muted-foreground" fill="none" strokeWidth={1.5} /> */}
                </div>

                <h3 className="text-base font-semibold mb-2 text-foreground line-clamp-2">
                  {product.productName || "Product Name"}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-yellow-500 text-sm">★</span>
                  <span className="text-sm font-medium">{product.productReviews?.averageRating || 0}</span>
                  <span className="text-xs text-muted-foreground">{t('key127', '(리뷰')} {product.productReviews?.total || 0}{t('key128', '건)')}</span>
                </div>

                <div className="mb-4 flex-1">
                  {Boolean(
                    product.productSpecialOffer?.status ||
                      (product as { productDiscount?: unknown })?.productDiscount
                  ) &&
                    product.consumerPrice &&
                    product.salePrice && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs text-muted-foreground line-through">
                          {product.consumerPrice.toLocaleString("ko-KR")}원
                        </span>
                        {discountPercentage > 0 && (
                          <span className="text-xs bg-[#FF6B4A] text-white px-2 py-0.5 rounded-md">{t('discountpercentage', '{{discountPercentage}}%', { discountPercentage })}</span>
                        )}
                      </div>
                    )}
                  <div className="text-2xl font-bold text-[#FF6B4A]">
                    {product.salePrice?.toLocaleString("ko-KR") || "0"}원
                  </div>
                </div>

                <Link href={`/products/${product.id}` || "#"} className="mt-auto">
                  <Button 
                    className="w-full bg-[#FF6B4A] hover:bg-[#FF5A39] text-white rounded-md" 
                    onClick={() => setShowModal(false)}
                  >
                    {banner.ctaButtonText || "구매하러 가기"}
                  </Button>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
