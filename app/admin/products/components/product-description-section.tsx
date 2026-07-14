"use client"

import { useRef, useMemo } from "react"
import { Upload, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from 'react-i18next'

interface ProductDescriptionSectionProps {
  productBriefDescription: string
  seoDescription: string
  // seoKeywords: string
  imageRegistrationDetail: File | null
  existingDetailImageUrl?: string | null
  onProductBriefDescriptionChange: (value: string) => void
  onSeoDescriptionChange: (value: string) => void
  // onSeoKeywordsChange: (value: string) => void
  onImageRegistrationDetailChange: (file: File | null) => void
  onRemoveExistingDetail?: () => void
}

export function ProductDescriptionSection({
  productBriefDescription,
  seoDescription,
  // seoKeywords,
  imageRegistrationDetail,
  existingDetailImageUrl,
  onProductBriefDescriptionChange,
  onSeoDescriptionChange,
  // onSeoKeywordsChange,
  onImageRegistrationDetailChange,
  onRemoveExistingDetail,
}: ProductDescriptionSectionProps) {
  const { t } = useTranslation()
  const detailImageInputRef = useRef<HTMLInputElement>(null)

  // Create object URL for preview
  const detailImagePreviewUrl = useMemo(() => {
    if (imageRegistrationDetail) {
      return URL.createObjectURL(imageRegistrationDetail)
    }
    return null
  }, [imageRegistrationDetail])

  const handleDetailImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageRegistrationDetailChange(file)
    }
    // Reset input to allow selecting the same file again
    if (detailImageInputRef.current) {
      detailImageInputRef.current.value = ""
    }
  }

  const removeDetailImage = () => {
    onImageRegistrationDetailChange(null)
    if (detailImageInputRef.current) {
      detailImageInputRef.current.value = ""
    }
  }
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">{t('key653', '상품 설명')}</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shortDescription">{t('key654', '간단 설명')}</Label>
              <Textarea
                id="shortDescription"
                placeholder={t('key655', '상품에 대해 간단히 설명해주세요')}
                className="min-h-32 bg-white"
                value={productBriefDescription || ""}
                onChange={(e) => onProductBriefDescriptionChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">{t('key656', '상세 설명')}</Label>
              <Textarea
                id="seoDescription"
                placeholder={t('seo', 'SEO 설명을 입력해주세요 ')}
                className="min-h-24 bg-white"
                value={seoDescription || ""}
                onChange={(e) => onSeoDescriptionChange(e.target.value)}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="seoKeywords">SEO Keywords</Label>
              <Input
                id="seoKeywords"
                placeholder="Enter SEO keywords separated by commas"
                className="bg-white"
                value={seoKeywords || ""}
                onChange={(e) => onSeoKeywordsChange(e.target.value)}
              />
            </div> */}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">{t('key657', '상세 이미지')}</h2>
          <div className="space-y-2">
            <div className="flex gap-4">
              <div className="relative">
                {imageRegistrationDetail && detailImagePreviewUrl ? (
                  <div className="relative h-24 w-24">
                    <img
                      src={detailImagePreviewUrl}
                      alt={t('detailImagePreview', 'Detail image preview')}
                      className="h-full w-full rounded-lg border-2 border-dashed object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={removeDetailImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : existingDetailImageUrl ? (
                  <div className="relative h-24 w-24">
                    <img
                      src={existingDetailImageUrl}
                      alt={t('existingDetailImage', 'Existing detail image')}
                      className="h-full w-full rounded-lg border-2 border-dashed object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.svg'
                      }}
                    />
                    {onRemoveExistingDetail && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                        onClick={onRemoveExistingDetail}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="h-24 w-24 border-2 border-dashed bg-white"
                    onClick={() => detailImageInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </Button>
                )}
                <input
                  ref={detailImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDetailImageUpload}
                  aria-label={t('uploadDetailImage', 'Upload detail image')}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm font-medium">
                    {imageRegistrationDetail?.name || (existingDetailImageUrl ? "기존 이미지" : "선택된 파일 없음")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {imageRegistrationDetail ? t('valKb', '{{val}} KB', { val: (imageRegistrationDetail.size / 1024).toFixed(2) }) : t('800800px', '권장 크기: 800 × 800px')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

