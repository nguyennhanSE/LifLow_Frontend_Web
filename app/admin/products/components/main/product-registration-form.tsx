"use client"

import { useState } from "react"
import { ChevronLeft, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProduct } from "@/hooks/use-product/product.hook"
import { CreateProductDto, ProductBadge, CreateProductSpecialOfferDto } from "@/hooks/use-product/product.dto"
import { useProductBadges } from "@/hooks/use-product-badges/product-badges.hook"
import { CategorySelect } from "../category-select"
import { ImageUploadSection } from "../image-upload-section"
import { PriceDiscountSection } from "../price-discount-section"
import { StockDeliverySection } from "../stock-delivery-section"
import { ProductDescriptionSection } from "../product-description-section"
import { ProductStatusSection } from "../product-status-section"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTranslation, Trans } from 'react-i18next'

export function ProductRegistrationForm({ isMounted }: { isMounted: boolean }) {
  const { t } = useTranslation()
  const { createProduct } = useProduct()
  const { createProductBadge } = useProductBadges()
  const router = useRouter()
  
  // Form data state matching CreateProductDto
  const [formData, setFormData] = useState<Partial<CreateProductDto>>({
    productName: "",
    productCode: "",
    category: "",
    manufacturer: "",
    storageMethod: "",
    consumerPrice: undefined,
    supplyPrice: undefined,
    productPrice: undefined,
    salePrice: undefined,
    discountRate: 0,
    discountStartDate: undefined,
    discountEndDate: undefined,
    origin: undefined,
    deliveryMethod: "",
    deliveryFeeInput: "",
    productBriefDescription: "",
    seoDescription: "",
    // seoKeywords: "",
    saleStatus: "Y",
  })
  
  const [stockManagement, setStockManagement] = useState(false)
  const [sameDayDelivery, setSameDayDelivery] = useState(false)
  const [hotDeal, setHotDeal] = useState(false)
  const [weeklySpecial, setWeeklySpecial] = useState(false)
  const [newProduct, setNewProduct] = useState(false)
  const [bestProduct, setBestProduct] = useState(false)
  const [discountRate, setDiscountRate] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [originInput, setOriginInput] = useState<string>("")
  const [displayStatus, setDisplayStatus] = useState<"Y" | "N">("Y")
  
  // Image states
  const [imageRegistrationThumbnail, setImageRegistrationThumbnail] = useState<File | null>(null)
  const [imageRegistrationDetail, setImageRegistrationDetail] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])

  const handleSubmit = async () => {
    // console.log(formData, 'formData');
    // console.log(imageRegistrationThumbnail, 'imageRegistrationThumbnail');
    // // console.log(imageRegistrationDetail, 'imageRegistrationDetail');
    // console.log(formData.productBadges, 'formData.productBadges');
    // return;
    if (!formData.productCode || !formData.productName || !formData.salePrice) {
      toast.error("Required fields are missing")
      return;
    }
    
    setIsSubmitting(true)
    try {
      // Prepare submit data with origin handling
      // Note: origin in DTO is number, but we're storing as string in UI
      // If originInput is a valid number, convert it; otherwise leave undefined
      // NOTE: we intentionally send `displayStatus` as "Y" | "N" per requirement.
      const submitData = {
        ...(formData as any),
        origin:
          originInput.trim() !== "" && !isNaN(Number(originInput))
            ? Number(originInput)
            : undefined,
        displayStatus,
      } as any
      
      const response = await createProduct(
        submitData, 
        imageRegistrationDetail ? imageRegistrationDetail : undefined, 
        imageRegistrationThumbnail ? imageRegistrationThumbnail : undefined,
        additionalImages.length > 0 ? additionalImages : undefined
      )
      
      // Product badges are now included in submitData.productBadges
      // No need to create badges separately
      
      toast.success("상품 등록 완료")
      router.push('/admin/products')
    } catch (error) {
      console.error("Error creating product:", error)
      window.alert("상품 등록 실패")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* Header */}
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={() => router.push('/admin/products')} variant="ghost" size="icon" className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('key791', '상품 등록')}</h1>
          <p className="text-sm text-muted-foreground">{t('key792', '새로운 상품을 등록합니다')}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">{t('key7', '기본 정보')}</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productName"><Trans i18nKey="spanClassnametextdestructivespan3">상품명 <span className="text-destructive">*</span></Trans></Label>
                  <Input
                    id="productName"
                    placeholder={t('10kg', '예: 유기농 쌀 10kg')}
                    className="bg-white"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, productName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCode">{t('key667', '상품코드')}</Label>
                  <Input
                    id="productCode"
                    placeholder={t('rice001', '예: RICE-001')}
                    className="bg-white"
                    value={formData.productCode || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, productCode: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <CategorySelect
                  label="카테고리"
                  value={formData.category || ""}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, category: value }))
                  }}
                  placeholder="선택"
                  required
                  isMounted={isMounted}
                />
                <div className="space-y-2">
                  <Label htmlFor="storageMethod">
                    {t('key668', '보관 방법')}
                  </Label>
                  <Select
                    value={formData.storageMethod || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, storageMethod: value }))
                    }
                  >
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frozen">{t('key669', '냉동')}</SelectItem>
                      <SelectItem value="refrigerated">{t('key670', '냉장')}</SelectItem>
                      <SelectItem value="room_temperature">{t('key671', '실온')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">{t('key333', '제조사')}</Label>
                  <Input
                    id="manufacturer"
                    placeholder={t('key672', '예: (주)푸릇식품')}
                    className="bg-white"
                    value={formData.manufacturer || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Management */}
        <ImageUploadSection
          thumbnail={imageRegistrationThumbnail}
          onThumbnailChange={(file: File | null) => setImageRegistrationThumbnail(file)}
          additionalImages={additionalImages}
          onAdditionalImagesChange={(files) => setAdditionalImages(files)}
        />

        {/* Price and Discount */}
        <PriceDiscountSection
          consumerPrice={formData.consumerPrice}
          salePrice={formData.salePrice}
          discountRate={discountRate}
          discountStartDate={formData.discountStartDate}
          discountEndDate={formData.discountEndDate}
          onConsumerPriceChange={(value) => setFormData((prev) => ({ ...prev, consumerPrice: value }))}
          onSalePriceChange={(value) => setFormData((prev) => ({ ...prev, salePrice: value }))}
          onDiscountStartDateChange={(value) => setFormData((prev) => ({ ...prev, discountStartDate: value }))}
          onDiscountEndDateChange={(value) => setFormData((prev) => ({ ...prev, discountEndDate: value }))}
          onDiscountRateChange={(rate) => {
            setDiscountRate(rate)
            setFormData((prev) => ({ ...prev, discountRate: rate }))
          }}
        />

        {/* Stock and Delivery */}
        <StockDeliverySection
          deliveryMethod={formData.deliveryMethod || ""}
          deliveryFeeInput={formData.deliveryFeeInput || ""}
          origin={originInput}
          stockManagement={stockManagement}
          sameDayDelivery={sameDayDelivery}
          onDeliveryMethodChange={(value) => setFormData((prev) => ({ ...prev, deliveryMethod: value }))}
          onDeliveryFeeInputChange={(value) => setFormData((prev) => ({ ...prev, deliveryFeeInput: value }))}
          onOriginChange={(value) => {
            setOriginInput(value)
            // For now, we'll store origin as string in a separate state
            // and handle conversion in submit if needed
            // Note: DTO expects origin as number, but UI allows text input
            // You may need to update DTO or handle conversion in submit handler
          }}
          onStockManagementChange={setStockManagement}
          onSameDayDeliveryChange={setSameDayDelivery}
        />

        {/* Product Options */}
        {/* <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Product Options</h2>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add options
              </Button>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">There are no registered options</p>
          </CardContent>
        </Card> */}

        {/* Product Description */}
        <ProductDescriptionSection
          productBriefDescription={formData.productBriefDescription || ""}
          seoDescription={formData.seoDescription || ""}
          // seoKeywords={formData.seoKeywords || ""}
          imageRegistrationDetail={imageRegistrationDetail}
          onProductBriefDescriptionChange={(value) => setFormData((prev) => ({ ...prev, productBriefDescription: value }))}
          onSeoDescriptionChange={(value) => setFormData((prev) => ({ ...prev, seoDescription: value }))}
          // onSeoKeywordsChange={(value) => setFormData((prev) => ({ ...prev, seoKeywords: value }))}
          onImageRegistrationDetailChange={(file: File | null) => setImageRegistrationDetail(file)}
        />

        {/* Tags and Status */}
        <ProductStatusSection
          saleStatus={formData.saleStatus || "Y"}
          displayStatus={displayStatus}
          hotDeal={hotDeal}
          newProduct={newProduct}
          weeklySpecial={weeklySpecial}
          bestProduct={bestProduct}
          consumerPrice={formData.consumerPrice}
          salePrice={formData.salePrice}
          onSaleStatusChange={(value) => setFormData((prev) => ({ ...prev, saleStatus: value }))}
          onDisplayStatusChange={setDisplayStatus}
          onHotDealChange={setHotDeal}
          onNewProductChange={setNewProduct}
          onWeeklySpecialChange={setWeeklySpecial}
          onBestProductChange={setBestProduct}
          onProductBadgesChange={(badges) => {
            setFormData((prev) => ({ ...prev, productBadges: badges }))
          }}
          onSpecialOfferChange={(specialOffer) => {
            setFormData((prev) => ({ ...prev, specialOffer: specialOffer }))
          }}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="lg">
            {t('key212', '취소')}
          </Button>
          <Button
            size="lg"
            className="bg-foreground text-background"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('key793', '등록 중...')}
              </>
            ) : (
              "상품 등록"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

