"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ShoppingCart } from "lucide-react"
import { useProduct } from "@/hooks/use-product/product.hook"
import { ProductEntity } from "@/entities/products/product.entity"
import { Spinner } from "@/components/ui/spinner"
import { useCart } from "@/hooks/use-cart/cart.hook"
import { ProductReview } from "./components/product-review"
import ProductInquiry from "./components/product-inquiry"
import { useProductReview } from "@/hooks/use-product-review/product-review.hook"
import { useProductInquiry } from "@/hooks/use-product-inquiry/product-inquiry.hook"
import { usePolicy } from "@/hooks/use-policy/policy.hook"
import { PolicyEntity } from "@/entities/policy/policy.entity"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const { getProductById } = useProduct()
  const { addItemToCart } = useCart()
  const { getProductReviewsCount } = useProductReview()
  const { getProductInquiryCount } = useProductInquiry()
  const { getActivePolicy } = usePolicy()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("details")
  const [mainImageLoaded, setMainImageLoaded] = useState(false)

  const { data: product, isLoading, isError } = useQuery<ProductEntity>({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  })

  // Fetch active policy
  const { data: policyData } = useQuery<PolicyEntity>({
    queryKey: ["active-policy"],
    queryFn: () => getActivePolicy(),
  })

  // Fetch reviews count
  const { data: reviewsCountData } = useQuery({
    queryKey: ["product-reviews-count", productId],
    queryFn: () => getProductReviewsCount(productId),
    enabled: !!productId,
  })

  // Fetch inquiries count
  const { data: inquiriesCountData } = useQuery({
    queryKey: ["product-inquiry-count", productId],
    queryFn: () => getProductInquiryCount(productId),
    enabled: !!productId,
  })

  // Ensure counts are always numbers
  const reviewsCount = typeof reviewsCountData === 'number' ? reviewsCountData : 0
  const inquiriesCount = typeof inquiriesCountData === 'number' ? inquiriesCountData : 0

  // Helper function to parse image URLs
  const parseImageUrls = (imageString: string | null | undefined): string[] => {
    if (!imageString) return []
    
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(imageString)
      return Array.isArray(parsed) ? parsed : [imageString]
    } catch {
      // If not JSON, check if it's a single URL or comma-separated list
      // A single URL should start with http/https and contain the full path
      // If splitting by comma results in parts that don't look like URLs, treat as single URL
      const parts = imageString.split(",").map((img: string) => img.trim()).filter(Boolean)
      
      // Check if all parts after splitting look like complete URLs (start with http/https)
      const allAreUrls = parts.every(part => part.startsWith('http://') || part.startsWith('https://'))
      
      // If all parts are URLs, return them; otherwise treat as single URL
      if (allAreUrls && parts.length > 1) {
        return parts
      } else {
        // Single URL, return as is (don't split)
        return [imageString.trim()]
      }
    }
  }

  // Parse image URLs from strings (assuming they might be comma-separated or JSON)
  const detailImages = useMemo(() => {
    return parseImageUrls(product?.imageRegistrationDetail)
  }, [product?.imageRegistrationDetail])

  const listImages = useMemo(() => {
    return parseImageUrls(product?.imageRegistrationList)
  }, [product?.imageRegistrationList])

  const smallListImages = useMemo(() => {
    return parseImageUrls(product?.imageRegistrationSmallList)
  }, [product?.imageRegistrationSmallList])

  const thumbnailImage = useMemo(() => {
    return parseImageUrls(product?.imageRegistrationThumbnail)
  }, [product?.imageRegistrationThumbnail])

  // Combine all images for thumbnails and main display
  // Priority: detailImages > listImages > smallListImages > thumbnailImage
  const allProductImages = useMemo(() => {
    // Remove duplicates while preserving order
    const imageSet = new Set<string>()
    const uniqueImages: string[] = []
    
    const addImages = (images: string[]) => {
      images.forEach(img => {
        if (img && !imageSet.has(img)) {
          imageSet.add(img)
          uniqueImages.push(img)
        }
      })
    }
    
    // Add images in priority order
    addImages(detailImages)
    addImages(listImages)
    addImages(smallListImages)
    addImages(thumbnailImage)
    
    return uniqueImages.length > 0 ? uniqueImages : ["/placeholder.svg"]
  }, [detailImages, listImages, smallListImages, thumbnailImage])

  // Use the same array for both main image and thumbnails to avoid index mismatch
  const productImages = allProductImages
  const thumbnails = allProductImages

  const minQuantity = product?.minOrderQuantity || 1
  const maxQuantity = product?.maxOrderQuantity || 999

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQuantity = prev + delta
      if (newQuantity < minQuantity) return minQuantity
      if (newQuantity > maxQuantity) return maxQuantity
      return newQuantity
    })
  }

  const totalPrice = product?.salePrice ? product.salePrice * quantity : 0

  const ImageWithLoader = ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
  }) => {
    const [loaded, setLoaded] = useState(false)
    return (
      <div className="relative">
        {!loaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoadingComplete={() => setLoaded(true)}
          className={`${className || ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Product Detail Section - 2 Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Section - Product Images */}
          <div>
            <div className="mb-4">
              <div className="relative aspect-square w-full">
                {!mainImageLoaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />}
                <Image
                  src={productImages[selectedImage] || "/placeholder.svg"}
                  alt={product.productName || "Product main image"}
                  width={600}
                  height={600}
                  onLoadingComplete={() => setMainImageLoaded(true)}
                  className={`w-full rounded-lg object-cover aspect-square transition-opacity duration-300 ${
                    mainImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </div>

            {thumbnails.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {thumbnails.map((thumb, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMainImageLoaded(false)
                      setSelectedImage(index)
                    }}
                    aria-label={`Select image ${index + 1}`}
                    className={`rounded-md border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-border"
                    }`}
                  >
                    <ImageWithLoader
                      src={thumb || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="rounded object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.productName || "Product Name"}</h1>
              {product.productSummaryDescription && (
                <p className="text-muted-foreground mb-4">{product.productSummaryDescription}</p>
              )}
            </div>

            <div className="space-y-3">
              {product.salePrice && (
                <div className="space-y-2">
                  {/* Consumer Price and Discount */}
                  {product.consumerPrice && product.consumerPrice > product.salePrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-muted-foreground line-through">
                        {product.consumerPrice.toLocaleString("ko-KR")}원
                      </span>
                      <span className="bg-[#FF6B4A] text-white text-sm font-bold px-2 py-1 rounded">
                        {Math.round(((product.consumerPrice - product.salePrice) / product.consumerPrice) * 100)}%
                      </span>
                    </div>
                  )}
                  {/* Sale Price */}
                  <div className="text-3xl font-bold text-[#FF6B4A]">
                    {product.salePrice.toLocaleString("ko-KR")}원
                  </div>
                </div>
              )}

              {(
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>배송비:</span>
                  <span>{product.deliveryFeeInput || 0}원</span>
                </div>
              )}

              {/* {(
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>원산지:</span>
                  <span>{product.origin || "미지정"}</span>
                </div>
              )}

              {(
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>상품 전체중량:</span>
                  <span>{product.productTotalWeight || 0}kg</span>
                </div>
              )}

              {(product.minOrderQuantity || product.maxOrderQuantity) && (
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>주문수량:</span>
                  <div className="flex items-center gap-2"> 
                    <span className="text-primary">{product.minOrderQuantity || 1}개 이상</span>
                    <span className="text-primary">~</span>
                    <span className="text-primary">{product.maxOrderQuantity || 0}개 이하</span>
                    </div>
                </div>
              )} */}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 py-4 border-t border-b">
              <span className="text-sm font-medium">수량:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= minQuantity}
                  aria-label="Decrease quantity"
                >
                  -
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || minQuantity
                    if (val >= minQuantity && val <= maxQuantity) {
                      setQuantity(val)
                    }
                  }}
                  min={minQuantity}
                  max={maxQuantity}
                  className="w-16 text-center border rounded-md px-2 py-1"
                  aria-label="Product quantity"
                  placeholder={minQuantity.toString()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Total Price */}
            <div className="text-2xl font-bold">
              총 상품금액: {totalPrice.toLocaleString("ko-KR")}원
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {(product?.saleStatus === 'N' || product?.origin === 0) ? (
                <Button variant="outline" className="flex-1 cursor-not-allowed" disabled>
                  Sold Out
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => addItemToCart({ productId, quantity })}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    장바구니
                  </Button>
                  <Button
                    className="flex-1 bg-[#FF6B4A] hover:bg-[#FF5A39] text-white"
                    onClick={() => {
                      if (!product) return
                      const thumbnail = Array.isArray(thumbnailImage) && thumbnailImage[0]
                        ? thumbnailImage[0]
                        : (product.imageRegistrationThumbnail ?? "")
                      const orderItem = {
                        cartItemId: "",
                        productId: product.id,
                        product: {
                          id: product.id,
                          productName: product.productName ?? "",
                          productCode: product.productCode ?? "",
                          salePrice: product.salePrice ?? 0,
                          imageRegistrationThumbnail: thumbnail,
                        },
                        quantity,
                        salePrice: product.salePrice ?? 0,
                        cartId: "",
                        deliveryInputFee: Number(product.deliveryFeeInput) || 0,
                      }
                      localStorage.setItem(
                        "pendingOrderItems",
                        JSON.stringify({ items: [orderItem], directPay: true })
                      )
                      router.push("/orders/create")
                    }}
                  >
                    구매하기
                  </Button>
                </>
              )}
            </div>

            {/* <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium">
              <Image width={20} height={20} src="/kakao.png" alt="Easy purchase" />
              Easy purchase
            </Button> */}
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">상품 상세</TabsTrigger>
            <TabsTrigger value="reviews">상품 리뷰 ({typeof reviewsCount === 'number' ? reviewsCount : 0})</TabsTrigger>
            <TabsTrigger value="inquiry">상품 문의 ({typeof inquiriesCount === 'number' ? inquiriesCount : 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="space-y-6">
              {productImages.length > 0 ? (
                productImages.map((img, index) => (
                  <ImageWithLoader
                    key={index}
                    src={img || "/placeholder.svg"}
                    alt={`Product detail ${index + 1}`}
                    width={800}
                    height={600}
                    className="w-full rounded-lg object-cover"
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground">제품 이미지가 없습니다</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ProductReview />
          </TabsContent>

          <TabsContent value="inquiry" className="mt-6">
            <ProductInquiry />
          </TabsContent>
        </Tabs>

        {/* Product Information Section - Only show when details tab is active */}
        {activeTab === "details" && (
          <div className="space-y-4">
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:bg-accent">
                <span className="font-medium">상품 결제 안내</span>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-x border-b border-border p-4">
                <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-line">
                  {(policyData?.paymentInformation ?? product.productPaymentGuide) ? (
                    policyData?.paymentInformation ?? product.productPaymentGuide
                  ) : (
                    <p className="text-muted-foreground">결제 안내 정보가 없습니다</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:bg-accent">
                <span className="font-medium">배송 안내</span>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-x border-b border-border p-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  {product.deliveryMethod && (
                    <p>
                      <span className="font-medium text-foreground">배송 방법: </span>
                      {product.deliveryMethod}
                    </p>
                  )}
                  {product.deliveryInfo && (
                    <p>
                      <span className="font-medium text-foreground">배송 정보: </span>
                      {product.deliveryInfo}
                    </p>
                  )}
                  {(policyData?.deliveryInformation ?? product.productDeliveryGuide) ? (
                    <div className="whitespace-pre-line mt-2">{policyData?.deliveryInformation ?? product.productDeliveryGuide}</div>
                  ) : (
                    <p className="text-muted-foreground mt-2">배송 안내 정보가 없습니다</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:bg-accent">
                <span className="font-medium">교환/반품 안내</span>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-x border-b border-border p-4">
                <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-line">
                  {(policyData?.exchangeInformation ?? product.exchangeReturnGuide) ? (
                    policyData?.exchangeInformation ?? product.exchangeReturnGuide
                  ) : (
                    <p className="text-muted-foreground">교환/반품 안내 정보가 없습니다</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left hover:bg-accent">
                <span className="font-medium">서비스 문의/안내</span>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-x border-b border-border p-4">
                <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-line">
                  {product.serviceInquiryGuide ? (
                    product.serviceInquiryGuide
                  ) : (
                    <p className="text-muted-foreground">서비스 문의 안내 정보가 없습니다</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  )
}

