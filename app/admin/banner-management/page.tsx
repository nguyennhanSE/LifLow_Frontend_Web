'use client'

import { useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainProductsTab } from './components/main-products-tab'
import { CategoryTab } from './components/category-tab'
import { FooterTab } from './components/footer-tab'
import { ContentHeroTab } from './components/content-hero-tab'
import { SpecialBannerTab } from './components/special-banner-tab'
import { products, initialCategoryBanners, type CategoryBanner } from './components/types'
import { BannerEntity, EBannerType } from '@/entities/banner/banner.entity'
import { useBanner } from '@/hooks/use-banner/banner.hook'

export default function AdminBannerManagementPage() {
  const [selectedProduct, setSelectedProduct] = useState(products[0])
  const [badgeText, setBadgeText] = useState('for new members only')
  const [mainText, setMainText] = useState(
    "If this is your first time at Jjuwangsan Garden, don't hesitate and take it with you.",
  )
  const [ctaUrl, setCtaUrl] = useState('/products/1')
  // 1.Main products banners
  const [initialBanner, setInitialBanner] = useState<BannerEntity | null>(null)
  // 2.Category banners
  const [categories, setCategories] = useState<BannerEntity[]>([])

  const [footerBanner1Url, setFooterBanner1Url] = useState('/')
  const [footerBanner2Url, setFooterBanner2Url] = useState('/')
  const [footerBanner3Url, setFooterBanner3Url] = useState('/')

  const {getBannersByType} = useBanner();


  // Fetch main products banners
  useEffect(() => {
    const fetchMainProductsBanners = async () => {
      await getBannersByType(EBannerType.MAIN_PRODUCTS).then((banners) => {
        setInitialBanner(banners[0])
      })
    }
    fetchMainProductsBanners()
  }, [getBannersByType, setInitialBanner])
  // Fetch category banners
  useEffect(() => {
    const fetchCategoryBanners = async () => {
        await getBannersByType(EBannerType.CATEGORY).then((banners) => {
        setCategories(banners)
      })
    }
    fetchCategoryBanners()
  }, [getBannersByType, setCategories])
  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-xl font-semibold text-foreground">배너 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          쭈왕몰의 모든 배너를 관리합니다.
        </p>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="main-products" className="w-full" id="banner-management-tabs">
        <TabsList className="flex h-auto w-full justify-start gap-2 rounded-full bg-gray-100 p-1">
          <TabsTrigger
            value="main-products"
            className="rounded-full px-6 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600"
          >
            메인 상품
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="rounded-full px-6 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600"
          >
            카테고리
          </TabsTrigger>
          <TabsTrigger
            value="footer"
            className="rounded-full px-6 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600"
          >
            푸터
          </TabsTrigger>
          <TabsTrigger
            value="content-hero"
            className="rounded-full px-6 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600"
          >
            콘텐츠 Hero
          </TabsTrigger>
          <TabsTrigger
            value="special"
            className="rounded-full px-6 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600"
          >
            이번주특가
          </TabsTrigger>
        </TabsList>

        {/* Main Products Tab */}
        <TabsContent value="main-products" className="mt-0 bg-white">
          <MainProductsTab
            initialBanner={initialBanner}
          />
        </TabsContent>

        {/* Category Tab */}
        <TabsContent value="category" className="mt-0 bg-white">
          <CategoryTab categories={categories} />
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="mt-0 bg-white">
          <FooterTab
            footerBanner1Url={footerBanner1Url}
            footerBanner2Url={footerBanner2Url}
            footerBanner3Url={footerBanner3Url}
            onChangeBanner1Url={setFooterBanner1Url}
            onChangeBanner2Url={setFooterBanner2Url}
            onChangeBanner3Url={setFooterBanner3Url}
          />
        </TabsContent>

        {/* Content Hero Tab */}
        <TabsContent value="content-hero" className="mt-0 bg-white">
          <ContentHeroTab />
        </TabsContent>

        {/* This week's special price Tab */}
        <TabsContent value="special" className="mt-0 bg-white">
          <SpecialBannerTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
