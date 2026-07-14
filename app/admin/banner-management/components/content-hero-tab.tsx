'use client'

import { ImageIcon, Info, Save, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BannerEntity, EBannerStatus, EBannerType } from '@/entities/banner/banner.entity'
import { useBanner } from '@/hooks/use-banner/banner.hook'
import { UpdateBannerDto } from '@/hooks/use-banner/banner.dto'
import { useTranslation } from 'react-i18next'

export function ContentHeroTab() {
  const { t } = useTranslation()
  const { getBannersByType, updateBanner, updateBannerImageById } = useBanner()
  const [banner, setBanner] = useState<BannerEntity | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroCtaText, setHeroCtaText] = useState('')
  const [heroCtaUrl, setHeroCtaUrl] = useState('')

  // Fetch banner on mount
  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true)
      try {
        const fetchedBanner = await getBannersByType(EBannerType.CONTENT_HERO)
        if (fetchedBanner) {
          setBanner(fetchedBanner[0])
          setHeroTitle(fetchedBanner[0].title || '')
          setHeroSubtitle(fetchedBanner[0].mainText || '')
          setHeroCtaText(fetchedBanner[0].ctaButtonText || '')
          setHeroCtaUrl(fetchedBanner[0].ctaButtonUrl || '')
        }
      } catch (error) {
        console.error('Error fetching content hero banner:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanner()
  }, [getBannersByType])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleImageSelect = (file: File | null) => {
    if (!file) return

    setSelectedImage(file)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const handleSave = async () => {
    if (!banner) return

    setIsSaving(true)
    try {
      // Update banner data
      const updateDto: UpdateBannerDto = {
        type: EBannerType.CONTENT_HERO,
        status: banner.status || EBannerStatus.ACTIVE,
        title: heroTitle || undefined,
        mainText: heroSubtitle || undefined,
        ctaButtonText: heroCtaText || undefined,
        ctaButtonUrl: heroCtaUrl || undefined,
        displayOrder: banner.displayOrder ?? undefined,
        startDate: banner.startDate ? new Date(banner.startDate).toISOString() : undefined,
        endDate: banner.endDate ? new Date(banner.endDate).toISOString() : undefined,
      }

      await updateBanner(banner.id, updateDto)

      // Upload image if selected
      if (selectedImage) {
        await updateBannerImageById(banner.id, selectedImage)
        // Clear selected image after successful upload
        setSelectedImage(null)
        if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview)
        }
        setImagePreview(null)
      }
    } catch (error) {
      console.error('Error saving content hero banner:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get image URL (preview or existing)
  const getImageUrl = () => {
    if (imagePreview) return imagePreview
    if (banner?.imageUrl) return banner.imageUrl
    return '/images/attachments-gen-images-public-korean-fruits.jpg'
  }
  return (
    <div className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-foreground" />
        <h2 className="text-base font-medium text-foreground">
          {t('heroSection', '콘텐츠 페이지 Hero Section 설정')}
        </h2>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-foreground-200 bg-foreground-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-foreground-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground-900">
              {t('1200600px', '권장 사이즈:배너 이미지 1200×600px')}
            </p>
            <p className="text-sm text-foreground-700">
              {t('heroSection2', '콘텐츠 페이지 상단에 표시되는 Hero Section입니다.')}
            </p>
          </div>
        </div>
      </div>

      {/* Form and Preview Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('key764', '배너 불러오는 중...')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Side - Form */}
          <div className="space-y-6">
            {/* Upload Background */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('key768', '배경 이미지 업로드')}</Label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  handleImageSelect(file)
                }}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 block"
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  {getImageUrl() && getImageUrl() !== '/images/attachments-gen-images-public-korean-fruits.jpg' ? (
                    <div className="relative w-full">
                      <img
                        src={getImageUrl()}
                        alt={t('key769', '배너 미리보기')}
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {t('key770', '클릭하여 업로드 또는 드래그 앤 드롭')}
                      </p>
                    </>
                  )}
                </div>
              </label>
              {selectedImage && (
                <p className="text-xs text-muted-foreground">{t('name2', '선택됨: {{name}}', { name: selectedImage.name })}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="hero-title" className="text-sm font-medium">
                {t('key502', '제목')}
              </Label>
              <Input
                id="hero-title"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="bg-muted/30"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle" className="text-sm font-medium">
                {t('key771', '부제목')}
              </Label>
              <Input
                id="hero-subtitle"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="bg-muted/30"
              />
            </div>

            {/* CTA Button Text */}
            <div className="space-y-2">
              <Label htmlFor="hero-cta-text" className="text-sm font-medium">
                {t('cta', 'CTA 버튼 텍스트')}
              </Label>
              <Input
                id="hero-cta-text"
                value={heroCtaText}
                onChange={(e) => setHeroCtaText(e.target.value)}
                className="bg-muted/30"
              />
            </div>

            {/* CTA Button Redirect URL */}
            <div className="space-y-2">
              <Label htmlFor="hero-cta-url" className="text-sm font-medium">
                {t('ctaUrl', 'CTA 버튼 이동 URL')}
              </Label>
              <Input
                id="hero-cta-url"
                value={heroCtaUrl}
                onChange={(e) => setHeroCtaUrl(e.target.value)}
                className="bg-muted/30"
              />
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('key763', '미리보기')}</Label>
            <div className="rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 p-6">
              <div className="overflow-hidden rounded-lg shadow-lg">
                <div className="relative aspect-[2/1]">
                  <img
                    src={getImageUrl()}
                    alt={t('hero2', 'Hero 배경')}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
                    <h2 className="mb-3 text-balance text-3xl font-bold">{heroTitle || '쏘잉을 콘텐츠'}</h2>
                    <p className="mb-6 text-base opacity-90">{heroSubtitle || t('key772', '신선한 식재료와 레시피를 만나보세요')}</p>
                    <Button className="bg-white px-8 font-medium text-foreground hover:bg-white/90">
                      {heroCtaText || '더 알아보기'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || !banner}
          className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('key582', '저장 중...') : '저장'}
        </Button>
      </div>
    </div>
  )
}

