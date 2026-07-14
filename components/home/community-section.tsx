"use client"

import { useState, useEffect } from "react"
import { useBanner } from "@/hooks/use-banner/banner.hook"
import { EBannerType } from "@/entities/banner/banner.entity"
import { Loader2 } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface Banner {
  id: string
  imageUrl: string
  ctaButtonUrl?: string | null
}

export function CommunitySection() {
  const { t } = useTranslation()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const { getBannersByType } = useBanner()

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const data = await getBannersByType(EBannerType.FOOTER)
        setBanners(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching banners:", error)
        setBanners([])
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [getBannersByType])

  if (loading) {
    return (
      <section className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5833]" />
          </div>
        </div>
      </section>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <section className="bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="space-y-4">
          {/* First row: 2 images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners[0] && (
              <div className="w-full h-[200px] rounded-lg overflow-hidden">
                {banners[0].ctaButtonUrl ? (
                  <a
                    href={banners[0].ctaButtonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <img
                      src={banners[0].imageUrl}
                      alt={t('banner1', 'Banner 1')}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ) : (
                  <img
                    src={banners[0].imageUrl}
                    alt={t('banner1', 'Banner 1')}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            {banners[1] && (
              <div className="w-full h-[200px] rounded-lg overflow-hidden">
                {banners[1].ctaButtonUrl ? (
                  <a
                    href={banners[1].ctaButtonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <img
                      src={banners[1].imageUrl}
                      alt={t('banner2', 'Banner 2')}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ) : (
                  <img
                    src={banners[1].imageUrl}
                    alt={t('banner2', 'Banner 2')}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </div>

          {/* Second row: 1 image */}
          {banners[2] && (
            <div className="w-full h-[250px] rounded-lg overflow-hidden">
              {banners[2].ctaButtonUrl ? (
                <a
                  href={banners[2].ctaButtonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <img
                    src={banners[2].imageUrl}
                    alt={t('banner3', 'Banner 3')}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <img
                  src={banners[2].imageUrl}
                  alt={t('banner3', 'Banner 3')}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
