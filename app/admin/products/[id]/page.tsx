"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProduct } from "@/hooks/use-product/product.hook"
import { UpdateProductDto, ProductBadge, CreateProductSpecialOfferDto } from "@/hooks/use-product/product.dto"
import { useProductBadges } from "@/hooks/use-product-badges/product-badges.hook"
import { CategorySelect } from "../components/category-select"
import { ImageUploadSection } from "../components/image-upload-section"
import { PriceDiscountSection } from "../components/price-discount-section"
import { StockDeliverySection } from "../components/stock-delivery-section"
import { ProductDescriptionSection } from "../components/product-description-section"
import { ProductStatusSection } from "../components/product-status-section"
import { toast } from "sonner"
import { ProductEntity } from "@/entities/products/product.entity"
import { Spinner } from "@/components/ui/spinner"

export default function AdminProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const { getProductById, updateProductById, deleteSpecialOffer } = useProduct()
  const { updateProductBadgeByProductId } = useProductBadges()
  const queryClient = useQueryClient()
  
  // Fetch product data
  const { data: product, isLoading, isError } = useQuery<ProductEntity>({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  })

  // Form data state (saleStatus used in UI, mapped to displayStatus on submit)
  const [formData, setFormData] = useState<Partial<Omit<UpdateProductDto, 'displayStatus'>> & { saleStatus?: string }>({
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
  const [isMounted, setIsMounted] = useState(false)
  const [displayStatus, setDisplayStatus] = useState<"Y" | "N">("Y")
  
  // Image states
  const [imageRegistrationThumbnail, setImageRegistrationThumbnail] = useState<File | null>(null)
  const [imageRegistrationDetail, setImageRegistrationDetail] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  
  // Existing image URLs for display
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null)
  const [existingDetailImageUrl, setExistingDetailImageUrl] = useState<string | null>(null)
  const [existingAdditionalImageUrls, setExistingAdditionalImageUrls] = useState<string[]>([])

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      // Get discount data from productDiscount
      const productDiscount = (product as any).productDiscount
      const discountStartDate = productDiscount?.discountStartDate 
        ? new Date(productDiscount.discountStartDate) 
        : undefined
      const discountEndDate = productDiscount?.discountEndDate 
        ? new Date(productDiscount.discountEndDate) 
        : undefined
      
      // Calculate discount rate from consumerPrice and salePrice instead of using productDiscount.discountRate
      let discountRate = 0
      if (product.consumerPrice && product.salePrice && product.consumerPrice > product.salePrice) {
        discountRate = Math.round(((product.consumerPrice - product.salePrice) / product.consumerPrice) * 100)
      } else {
        discountRate = productDiscount?.discountRate ?? 0
      }

      // Get category number - check both product.category and direct productCategoryNumber
      const categoryNumber = product.category?.productCategoryNumber 
        || (product as any).productCategoryNumber
        || null
      
      setFormData({
        productName: product.productName || "",
        productCode: product.productCode || "",
        category: categoryNumber ? String(categoryNumber) : "",
        manufacturer: product.manufacturer || "",
        storageMethod: product.storageMethod || "",
        consumerPrice: product.consumerPrice ?? undefined,
        supplyPrice: product.supplyPrice ?? undefined,
        productPrice: product.productPrice ?? undefined,
        salePrice: product.salePrice ?? undefined,
        discountRate: discountRate,
        discountStartDate: discountStartDate,
        discountEndDate: discountEndDate,
        origin: product.origin ?? undefined,
        deliveryMethod: product.deliveryMethod || "",
        deliveryFeeInput: product.deliveryFeeInput || "",
        productBriefDescription: product.productBriefDescription || "",
        seoDescription: product.seoDescription || "",
        saleStatus: product.saleStatus ?? product.displayStatus ?? "Y",
      })

      // displayStatus (노출 상태): "Y"=노출, "N"=숨김
      const rawDisplay = (product as any).displayStatus
      setDisplayStatus(
        rawDisplay === undefined || rawDisplay === null
          ? "Y"
          : String(rawDisplay) === "N" ||
              String(rawDisplay).toUpperCase() === "INACTIVE" ||
              String(rawDisplay) === "false"
            ? "N"
            : "Y"
      )
      
      // Set discount rate state
      setDiscountRate(discountRate)
      
      // Set product badges from productBadges entity
      const productBadges = (product as any).productBadges
      if (productBadges) {
        // Handle both object and array formats
        let badgesObject: ProductBadge
        if (typeof productBadges === 'object' && !Array.isArray(productBadges)) {
          // Already an object
          badgesObject = {
            isHotDeal: productBadges.isHotDeal || false,
            isNewProduct: productBadges.isNewProduct || false,
            isBestSeller: productBadges.isBestSeller || false,
          }
        } else if (Array.isArray(productBadges)) {
          // Legacy array format - convert to object
          const badges = productBadges.map((b: any) => {
            if (typeof b === 'string') return b
            return b.name || b.type || b
          })
          badgesObject = {
            isHotDeal: badges.includes('hotDeal') || badges.includes('isHotDeal'),
            isNewProduct: badges.includes('newProduct') || badges.includes('isNewProduct'),
            isBestSeller: badges.includes('bestSeller') || badges.includes('isBestSeller'),
          }
        } else {
          badgesObject = {
            isHotDeal: false,
            isNewProduct: false,
            isBestSeller: false,
          }
        }
        
        setHotDeal(badgesObject.isHotDeal)
        setNewProduct(badgesObject.isNewProduct)
        setBestProduct(badgesObject.isBestSeller)
        
        // Set productBadges in formData
        setFormData((prev) => ({
          ...prev,
          productBadges: badgesObject,
        }))
      }
      
      // Set specialOffer from productSpecialOffer entity
      const productSpecialOffer = product.productSpecialOffer
      if (productSpecialOffer && productSpecialOffer.status) {
        const specialOffer: CreateProductSpecialOfferDto = {
          status: productSpecialOffer.status,
          discountAmount: productSpecialOffer.discountAmount,
          specialPriceApplied: productSpecialOffer.specialPriceApplied,
          startDate: productSpecialOffer.startDate ? new Date(productSpecialOffer.startDate) : undefined,
          endDate: productSpecialOffer.endDate ? new Date(productSpecialOffer.endDate) : undefined,
        }
        
        setWeeklySpecial(true)
        setFormData((prev) => ({
          ...prev,
          specialOffer: specialOffer,
        }))
      } else {
        setWeeklySpecial(false)
        setFormData((prev) => ({
          ...prev,
          specialOffer: null,
        }))
      }
      
      // Set origin input
      if (product.origin !== null && product.origin !== undefined) {
        setOriginInput(String(product.origin))
      } else if (product.additionalItem04Origin) {
        setOriginInput(product.additionalItem04Origin)
      }
      
      // Set existing image URLs
      if (product.imageRegistrationThumbnail) {
        setExistingThumbnailUrl(product.imageRegistrationThumbnail)
      }
      if (product.imageRegistrationDetail) {
        setExistingDetailImageUrl(product.imageRegistrationDetail)
      }
      // Handle additionalImages - could be in imageRegistrationList or additionalImages field
      const additionalImagesData = (product as any).additionalImages || product.imageRegistrationList
      if (additionalImagesData) {
        if (Array.isArray(additionalImagesData)) {
          setExistingAdditionalImageUrls(additionalImagesData)
        } else if (typeof additionalImagesData === 'string') {
          try {
            const parsed = JSON.parse(additionalImagesData)
            if (Array.isArray(parsed)) {
              setExistingAdditionalImageUrls(parsed)
            } else if (typeof parsed === 'string') {
              const urls = parsed.split(',').map((url: string) => url.trim()).filter(Boolean)
              setExistingAdditionalImageUrls(urls)
            }
          } catch {
            // If not JSON, treat as comma-separated string
            const urls = additionalImagesData.split(',').map((url: string) => url.trim()).filter(Boolean)
            setExistingAdditionalImageUrls(urls)
          }
        }
      }
    }
  }, [product])

  // Fetch product badges
  useEffect(() => {
    if (product?.id) {
      // Fetch badges if needed - you may need to add a getProductBadges hook
      // For now, we'll assume badges are part of product entity or fetched separately
    }
  }, [product?.id])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { submitData: UpdateProductDto; thumbnail?: File; detail?: File; additional?: File[] }) => {
      return await updateProductById(
        productId,
        data.submitData,
        data.detail,
        data.thumbnail,
        data.additional
      )
    },
    onSuccess: () => {
      toast.success("상품 수정 완료")
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      router.push('/admin/products')
    },
    onError: (error: any) => {
      console.error("Error updating product:", error)
      toast.error(error?.message || "상품 수정 실패")
    },
  })

  const handleSubmit = async () => {
    if (!formData.productCode || !formData.productName || !formData.salePrice) {
      toast.error("Required fields are missing")
      return
    }
    
    setIsSubmitting(true)
    try {
    //   console.log(formData, 'formData')
    //   return;
      // Prepare submit data with origin handling
      // NOTE: we intentionally send `displayStatus` as "Y" | "N" per requirement.
      const submitData = {
        ...(formData as any),
        origin:
          originInput.trim() !== "" && !isNaN(Number(originInput))
            ? Number(originInput)
            : undefined,
        displayStatus,
      } as any
      
      updateMutation.mutate({
        submitData,
        thumbnail: imageRegistrationThumbnail || undefined,
        detail: imageRegistrationDetail || undefined,
        additional: additionalImages.length > 0 ? additionalImages : undefined,
      })
      
      // Product badges are now included in submitData.productBadges
      // No need to update badges separately
    } catch (error) {
      console.error("Error in handleSubmit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">상품을 불러올 수 없습니다.</p>
        <Button onClick={() => router.push('/admin/products')} variant="outline">
          목록으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* Header */}
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={() => router.push('/admin/products')} variant="ghost" size="icon" className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">상품 수정</h1>
          <p className="text-sm text-muted-foreground">상품 정보를 수정합니다</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productName">
                    상품명 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="productName"
                    placeholder="예: 유기농 쌀 10kg"
                    className="bg-white"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, productName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCode">상품코드</Label>
                  <Input
                    id="productCode"
                    placeholder="예: RICE-001"
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
                    보관 방법
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
                      <SelectItem value="frozen">냉동</SelectItem>
                      <SelectItem value="refrigerated">냉장</SelectItem>
                      <SelectItem value="room temperature">실온</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">제조사</Label>
                  <Input
                    id="manufacturer"
                    placeholder="예: (주)푸릇식품"
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
          existingThumbnailUrl={existingThumbnailUrl}
          existingAdditionalImageUrls={existingAdditionalImageUrls}
          onRemoveExistingThumbnail={() => setExistingThumbnailUrl(null)}
          onRemoveExistingAdditional={(index) => {
            setExistingAdditionalImageUrls(prev => prev.filter((_, i) => i !== index))
          }}
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
          }}
          onStockManagementChange={setStockManagement}
          onSameDayDeliveryChange={setSameDayDelivery}
        />

        {/* Product Description */}
        <ProductDescriptionSection
          productBriefDescription={formData.productBriefDescription || ""}
          seoDescription={formData.seoDescription || ""}
          imageRegistrationDetail={imageRegistrationDetail}
          existingDetailImageUrl={existingDetailImageUrl}
          onProductBriefDescriptionChange={(value) => setFormData((prev) => ({ ...prev, productBriefDescription: value }))}
          onSeoDescriptionChange={(value) => setFormData((prev) => ({ ...prev, seoDescription: value }))}
          onImageRegistrationDetailChange={(file: File | null) => setImageRegistrationDetail(file)}
          onRemoveExistingDetail={() => setExistingDetailImageUrl(null)}
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
          productId={productId}
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
          onTurnOffWeeklySpecial={async (id) => {
            try {
              // When currently has specialOffer, use dedicated DELETE endpoint
              if (weeklySpecial || formData.specialOffer) {
                await deleteSpecialOffer(id)
              } else {
                await updateProductById(id, {
                  specialOffer: { status: false },
                } as UpdateProductDto)
              }
              queryClient.invalidateQueries({ queryKey: ["product", id] })
              toast.success("이번주 특가가 해제되었습니다.")
            } catch {
              toast.error("이번주 특가 해제에 실패했습니다.")
              throw new Error("이번주 특가 해제에 실패했습니다.")
            }
          }}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="lg" onClick={() => router.push('/admin/products')}>
            취소
          </Button>
          <Button
            size="lg"
            className="bg-foreground text-background"
            onClick={handleSubmit}
            disabled={isSubmitting || updateMutation.isPending}
          >
            {isSubmitting || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                수정 중...
              </>
            ) : (
              "상품 수정"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
