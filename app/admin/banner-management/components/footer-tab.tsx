'use client'

import { ImageIcon, Info, Save, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BannerEntity, EBannerType } from '@/entities/banner/banner.entity'
import { useBanner } from '@/hooks/use-banner/banner.hook'
import { ECategoryType } from '@/hooks/use-banner/banner.dto'
import { useTranslation } from 'react-i18next'

type FooterTabProps = {
  footerBanner1Url: string
  footerBanner2Url: string
  footerBanner3Url: string
  onChangeBanner1Url: (value: string) => void
  onChangeBanner2Url: (value: string) => void
  onChangeBanner3Url: (value: string) => void
}

export function FooterTab({
  footerBanner1Url,
  footerBanner2Url,
  footerBanner3Url,
  onChangeBanner1Url,
  onChangeBanner2Url,
  onChangeBanner3Url,
}: FooterTabProps) {
  const { t } = useTranslation()
  const { getBannerByCategory, getBannersByType, updateBannerImageById, updateBanner } = useBanner()
  const [banners, setBanners] = useState<BannerEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Record<number, File | null>>({})
  const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({})

  // Sync CTA URLs from banners array to parent state (so input shows API data)
  const syncCtaUrlsToParent = (arr: BannerEntity[]) => {
    onChangeBanner1Url(arr[0]?.ctaButtonUrl ?? '/')
    onChangeBanner2Url(arr[1]?.ctaButtonUrl ?? '/')
    onChangeBanner3Url(arr[2]?.ctaButtonUrl ?? '/')
  }

  // Fetch footer banners on mount
  useEffect(() => {
    const fetchFooterBanners = async () => {
      setLoading(true)
      try {
        try {
          const banner = await getBannersByType(EBannerType.FOOTER)
          if (banner && banner.length > 0) {
            const arr = [banner[0], banner[1], banner[2]]
            setBanners(arr)
            syncCtaUrlsToParent(arr)
          } else {
            const footerBanners = await getBannersByType(EBannerType.FOOTER)
            if (footerBanners && footerBanners.length > 0) {
              const bannersToShow = [...footerBanners.slice(0, 3)]
              while (bannersToShow.length < 3) {
                bannersToShow.push({ id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity)
              }
              setBanners(bannersToShow)
              syncCtaUrlsToParent(bannersToShow)
            } else {
              const empty = [
                { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
                { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
                { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
              ]
              setBanners(empty)
              syncCtaUrlsToParent(empty)
            }
          }
        } catch (error) {
          try {
            const footerBanners = await getBannersByType(EBannerType.FOOTER)
            if (footerBanners && footerBanners.length > 0) {
              const bannersToShow = [...footerBanners.slice(0, 3)]
              while (bannersToShow.length < 3) {
                bannersToShow.push({ id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity)
              }
              setBanners(bannersToShow)
              syncCtaUrlsToParent(bannersToShow)
            } else {
              const empty = [
                { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
                { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
                { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
              ]
              setBanners(empty)
              syncCtaUrlsToParent(empty)
            }
          } catch (typeError) {
            console.error('Error fetching footer banners:', typeError)
            const empty = [
              { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
              { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
              { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
            ]
            setBanners(empty)
            syncCtaUrlsToParent(empty)
          }
        }
      } catch (error) {
        console.error('Error fetching footer banners:', error)
        const empty = [
          { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
          { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
          { id: '', imageUrl: null, ctaButtonUrl: null } as BannerEntity,
        ]
        setBanners(empty)
        syncCtaUrlsToParent(empty)
      } finally {
        setLoading(false)
      }
    }

    fetchFooterBanners()
  }, [getBannerByCategory, getBannersByType, onChangeBanner1Url, onChangeBanner2Url, onChangeBanner3Url])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imagePreviews])

  const handleImageSelect = (index: number, file: File | null) => {
    if (!file) return

    setSelectedImages((prev) => ({
      ...prev,
      [index]: file,
    }))

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setImagePreviews((prev) => ({
      ...prev,
      [index]: previewUrl,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const promises: Promise<unknown>[] = []

      // 1. Upload images for banners that have a new image selected
      banners.forEach((banner, index) => {
        const imageFile = selectedImages[index]
        if (imageFile && banner.id) {
          promises.push(updateBannerImageById(banner.id, imageFile))
        }
      })

      // 2. Update CTA URL for each banner that has an id
      banners.forEach((banner, index) => {
        if (banner.id) {
          const ctaUrl = getBannerCtaUrl(index)
          promises.push(
            updateBanner(banner.id, {
              type: banner.type,
              status: banner.status,
              ctaButtonUrl: ctaUrl || undefined,
            })
          )
        }
      })

      await Promise.all(promises)

      setSelectedImages({})
      setImagePreviews({})
    } catch (error) {
      console.error('Error saving footer banners:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get image URL for each banner (preview or existing)
  const getBannerImageUrl = (index: number) => {
    if (imagePreviews[index]) return imagePreviews[index]
    if (banners[index]?.imageUrl) return banners[index].imageUrl
    return null
  }

  // Get CTA URL for each banner
  const getBannerCtaUrl = (index: number) => {
    if (index === 0) return footerBanner1Url
    if (index === 1) return footerBanner2Url
    if (index === 2) return footerBanner3Url
    return ''
  }

  // Handle CTA URL change
  const handleCtaUrlChange = (index: number, value: string) => {
    if (index === 0) onChangeBanner1Url(value)
    else if (index === 1) onChangeBanner2Url(value)
    else if (index === 2) onChangeBanner3Url(value)
  }
  return (
    <div className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-foreground" />
        <h2 className="text-base font-medium text-foreground">
          {t('315', '푸터 위 배너 설정 (3개)')}
        </h2>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-foreground-200 bg-foreground-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-foreground-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground-900">
              {t('800400px', '권장 사이즈:배너 이미지 800×400px')}
            </p>
            <p className="text-sm text-foreground-700">
              {t('316', '푸터 영역 위에 표시되는 3개의 배너 이미지입니다.')}
            </p>
          </div>
        </div>
      </div>

      {/* Three Banners Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('key764', '배너 불러오는 중...')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((index) => {
            const imageUrl = getBannerImageUrl(index)
            const ctaUrl = getBannerCtaUrl(index)

            return (
              <div key={index} className="space-y-4">
                <Label className="text-sm font-medium">{t('key765', '배너')} {index + 1} {t('key551', '이미지 업로드')}</Label>
                <input
                  type="file"
                  id={`image-upload-${index}`}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    handleImageSelect(index, file)
                  }}
                />
                <label
                  htmlFor={`image-upload-${index}`}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 block"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    {imageUrl ? (
                      <div className="relative w-full">
                        <img
                          src={imageUrl}
                          alt={t('val5', '배너 {{val}} 미리보기', { val: index + 1 })}
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{t('key551', '이미지 업로드')}</p>
                      </>
                    )}
                  </div>
                </label>
                {selectedImages[index] && (
                  <p className="text-xs text-muted-foreground">
                    {t('key766', '선택됨:')} {selectedImages[index]?.name}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor={`banner${index + 1}-url`} className="text-sm font-medium">
                    {t('key765', '배너')} {index + 1} {t('ctaUrl2', 'CTA URL')}
                  </Label>
                  <Input
                    id={`banner${index + 1}-url`}
                    value={ctaUrl}
                    onChange={(e) => handleCtaUrlChange(index, e.target.value)}
                    placeholder="/"
                    className="bg-muted/30"
                  />
                </div>
                {/* {imageUrl && (
                  <div className="aspect-[2/1] overflow-hidden rounded-lg">
                    <img
                      src={imageUrl}
                      alt={`Banner ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )} */}
              </div>
            )
          })}
        </div>
      )}

      {/* Full Preview */}
      <div className="space-y-3 pt-4">
        <Label className="text-sm font-medium">{t('key767', '전체 미리보기')}</Label>
        <div className="rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => {
              const imageUrl = getBannerImageUrl(index)
              return (
                <div key={index} className="aspect-[2/1] overflow-hidden rounded-lg shadow-lg">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t('val6', '배너 {{val}}', { val: index + 1 })}
                      className="h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <p className="text-sm text-muted-foreground">{t('key320', '이미지 없음')}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('key582', '저장 중...') : '저장'}
        </Button>
      </div>
    </div>
  )
}

