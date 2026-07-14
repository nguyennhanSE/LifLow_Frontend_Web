"use client"

import { useRef, useMemo } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation, Trans } from 'react-i18next'

interface ImageUploadSectionProps {
  thumbnail: File | null
  onThumbnailChange: (file: File | null) => void
  additionalImages: File[]
  onAdditionalImagesChange: (files: File[]) => void
  existingThumbnailUrl?: string | null
  existingDetailImageUrl?: string | null
  existingAdditionalImageUrls?: string[]
  onRemoveExistingThumbnail?: () => void
  onRemoveExistingDetail?: () => void
  onRemoveExistingAdditional?: (index: number) => void
}

export function ImageUploadSection({
  thumbnail,
  onThumbnailChange,
  additionalImages,
  onAdditionalImagesChange,
  existingThumbnailUrl,
  existingDetailImageUrl,
  existingAdditionalImageUrls = [],
  onRemoveExistingThumbnail,
  onRemoveExistingDetail,
  onRemoveExistingAdditional,
}: ImageUploadSectionProps) {
  const { t } = useTranslation()
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const additionalImageInputRef = useRef<HTMLInputElement>(null)

  // Create object URLs for preview
  const thumbnailPreviewUrl = useMemo(() => {
    if (thumbnail) {
      return URL.createObjectURL(thumbnail)
    }
    return null
  }, [thumbnail])

  const additionalImagePreviewUrls = useMemo(() => {
    return additionalImages.map((file) => URL.createObjectURL(file))
  }, [additionalImages])

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onThumbnailChange(file)
    }
    // Reset input to allow selecting the same file again
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""
    }
  }

  const handleAdditionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && additionalImages.length < 14) {
      onAdditionalImagesChange([...additionalImages, file])
    }
    // Reset input to allow selecting the same file again
    if (additionalImageInputRef.current) {
      additionalImageInputRef.current.value = ""
    }
  }

  const removeAdditionalImage = (index: number) => {
    onAdditionalImagesChange(additionalImages.filter((_, i) => i !== index))
  }

  const removeThumbnail = () => {
    onThumbnailChange(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 text-lg font-semibold">{t('key661', '이미지 관리')}</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label><Trans i18nKey="spanClassnametextdestructivespan2">대표 이미지 <span className="text-destructive">*</span></Trans></Label>
            <div className="flex gap-4">
              <div className="relative">
                {thumbnail && thumbnailPreviewUrl ? (
                  <div className="relative h-24 w-24">
                    <img
                      src={thumbnailPreviewUrl}
                      alt={t('thumbnailPreview', 'Thumbnail preview')}
                      className="h-full w-full rounded-lg border-2 border-dashed object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={removeThumbnail}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : existingThumbnailUrl ? (
                  <div className="relative h-24 w-24">
                    <img
                      src={existingThumbnailUrl}
                      alt={t('existingThumbnail', 'Existing thumbnail')}
                      className="h-full w-full rounded-lg border-2 border-dashed object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.svg'
                      }}
                    />
                    {onRemoveExistingThumbnail && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                        onClick={onRemoveExistingThumbnail}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="h-24 w-24 border-2 border-dashed bg-white"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </Button>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                  aria-label={t('uploadRepresentativeImage', 'Upload representative image')}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm font-medium">
                    {thumbnail?.name || (existingThumbnailUrl ? "기존 이미지" : "선택된 파일 없음")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {thumbnail ? t('valKb', '{{val}} KB', { val: (thumbnail.size / 1024).toFixed(2) }) : t('800800px', '권장 크기: 800 × 800px')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('144', '추가 이미지 (최대 14개)')}</Label>
            <div className="flex flex-wrap gap-4">
              {/* Existing additional images */}
              {existingAdditionalImageUrls.map((url, index) => (
                <div key={`existing-${index}`} className="relative h-24 w-24">
                  <img
                    src={url}
                    alt={t('existingAdditionalImageVal', 'Existing additional image {{val}}', { val: index + 1 })}
                    className="h-full w-full rounded-lg border-2 border-dashed object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                    }}
                  />
                  {onRemoveExistingAdditional && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={() => onRemoveExistingAdditional(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {/* New uploaded images */}
              {additionalImages.map((image, index) => (
                <div key={`new-${index}`} className="relative h-24 w-24">
                  <img
                    src={additionalImagePreviewUrls[index]}
                    alt={t('additionalImageVal', 'Additional image {{val}}', { val: index + 1 })}
                    className="h-full w-full rounded-lg border-2 border-dashed object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={() => removeAdditionalImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(existingAdditionalImageUrls.length + additionalImages.length) < 14 && (
                <Button
                  variant="outline"
                  className="h-24 w-24 border-2 border-dashed bg-white"
                  onClick={() => additionalImageInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </Button>
              )}
              <input
                ref={additionalImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAdditionalImageUpload}
                aria-label={t('uploadAdditionalImage', 'Upload additional image')}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
