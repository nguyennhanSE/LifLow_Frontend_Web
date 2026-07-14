'use client'

import { ImageIcon, Info, Save, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BannerEntity, EBannerStatus, EBannerType } from '@/entities/banner/banner.entity'
import { useBanner } from '@/hooks/use-banner/banner.hook'
import { UpdateBannerDto } from '@/hooks/use-banner/banner.dto'

export function SpecialBannerTab() {
  const { getBannersByType, updateBanner, updateBannerImageById } = useBanner()
  const [banner, setBanner] = useState<BannerEntity | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [specialTitle, setSpecialTitle] = useState('')
  const [specialSubtitle, setSpecialSubtitle] = useState('')

  // Fetch banner on mount
  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true)
      try {
        const banners = await getBannersByType(EBannerType.SPECIAL_PRICE)
        if (banners && banners.length > 0) {
          const fetchedBanner = banners[0]
          setBanner(fetchedBanner)
          setSpecialTitle(fetchedBanner.title || '')
          setSpecialSubtitle(fetchedBanner.mainText || '')
        }
      } catch (error) {
        console.error('Error fetching special price banner:', error)
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
        type: EBannerType.SPECIAL_PRICE,
        status: banner.status || EBannerStatus.ACTIVE,
        title: specialTitle || undefined,
        mainText: specialSubtitle || undefined,
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
      console.error('Error saving special price banner:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get image URL (preview or existing)
  const getImageUrl = () => {
    if (imagePreview) return imagePreview
    if (banner?.imageUrl) return banner.imageUrl
    return '/images/attachments-gen-images-public-korean-chicken.jpg'
  }
  return (
    <div className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-foreground" />
        <h2 className="text-base font-medium text-foreground">
          Set this week's special offer top banner
        </h2>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              Recommended size: 1200×300px
            </p>
            <p className="text-sm text-blue-700">
              This is the banner image displayed at the top of the special price page this
              week.
            </p>
          </div>
        </div>
      </div>

      {/* Form and Preview Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading banner...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Side - Form */}
          <div className="space-y-6">
            {/* Upload Background */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload a background image</Label>
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
                  {getImageUrl() && getImageUrl() !== '/images/attachments-gen-images-public-korean-chicken.jpg' ? (
                    <div className="relative w-full">
                      <img
                        src={getImageUrl()}
                        alt="Banner preview"
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
                        Click to upload or drag and drop
                      </p>
                    </>
                  )}
                </div>
              </label>
              {selectedImage && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedImage.name}
                </p>
              )}
            </div>

            {/* Title Text */}
            <div className="space-y-2">
              <Label htmlFor="special-title" className="text-sm font-medium">
                Title text
              </Label>
              <Input
                id="special-title"
                value={specialTitle}
                onChange={(e) => setSpecialTitle(e.target.value)}
                className="bg-muted/30"
              />
            </div>

            {/* Subtitle Text */}
            <div className="space-y-2">
              <Label htmlFor="special-subtitle" className="text-sm font-medium">
                Subtitle text
              </Label>
              <Input
                id="special-subtitle"
                value={specialSubtitle}
                onChange={(e) => setSpecialSubtitle(e.target.value)}
                className="bg-muted/30"
              />
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 p-6">
              <div className="overflow-hidden rounded-lg shadow-lg">
                <div className="relative aspect-[4/1]">
                  <img
                    src={getImageUrl()}
                    alt="Special price banner"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-start justify-center p-8 text-white">
                    <h2 className="mb-2 text-balance text-2xl font-bold">{specialTitle || 'Title'}</h2>
                    <p className="text-sm opacity-90">{specialSubtitle || 'Subtitle'}</p>
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
          {isSaving ? 'Saving...' : 'save'}
        </Button>
      </div>
    </div>
  )
}

