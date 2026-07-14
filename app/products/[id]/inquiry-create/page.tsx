"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useProduct } from "@/hooks/use-product/product.hook"
import { useProductInquiry } from "@/hooks/use-product-inquiry/product-inquiry.hook"
import { CreateProductInquiryDto } from "@/hooks/use-product-inquiry/product-inquiry.dto"
import { ProductEntity } from "@/entities/products/product.entity"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"

export default function InquiryCreatePage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const { getProductById } = useProduct()
  const { createProductInquiry } = useProductInquiry()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [inquiryTitle, setInquiryTitle] = useState<string>("")
  const [inquiryContent, setInquiryContent] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch product info
  const { data: product, isLoading } = useQuery<ProductEntity>({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  })

  // Get product image
  const productImage = useMemo(() => {
    if (!product?.imageRegistrationThumbnail) return "/placeholder.svg"
    
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(product.imageRegistrationThumbnail)
      const url = Array.isArray(parsed) ? parsed[0] : parsed
      return url || "/placeholder.svg"
    } catch {
      // If not JSON, check if it's a single URL or comma-separated list
      const trimmed = product.imageRegistrationThumbnail.trim()
      
      // If it's a valid URL, return it directly
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        // Check if it's comma-separated URLs
        const parts = trimmed.split(",").map((img: string) => img.trim()).filter(Boolean)
        const allAreUrls = parts.every(part => part.startsWith('http://') || part.startsWith('https://'))
        
        if (allAreUrls && parts.length > 1) {
          return parts[0] // Return first URL
        } else {
          return trimmed // Single URL
        }
      }
      
      return "/placeholder.svg"
    }
  }, [product?.imageRegistrationThumbnail])

  // Handle form submission
  const handleSubmitInquiry = async () => {
    if (!inquiryTitle.trim()) {
      toast({
        title: "제목 필수",
        description: "문의 제목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!inquiryContent.trim()) {
      toast({
        title: "내용 필수",
        description: "제출하기 전에 문의 내용을 작성해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dto: CreateProductInquiryDto = {
        productId,
        authorId: "", // Backend will extract from JWT token
        title: inquiryTitle,
        content: inquiryContent,
      }

      await createProductInquiry(dto)
      
      toast({
        title: "문의 등록 완료",
        description: "문의가 성공적으로 등록되었습니다.",
      })

      // Navigate back to product detail page
      router.push(`/products/${productId}`)
      
      // Invalidate queries to refresh the inquiry list
      queryClient.invalidateQueries({ queryKey: ["product-inquiries", productId] })
      queryClient.invalidateQueries({ queryKey: ["product-inquiry-count", productId] })
    } catch (error: any) {
      toast({
        title: "오류",
        description: error?.message || "문의 제출에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">상품을 찾을 수 없습니다</h2>
          <p className="text-muted-foreground">상품 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Orange bar at top */}
      <div className="w-full h-1 bg-[#FF6B4A]"></div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">글 작성</h1>
        </div>

        <div className="space-y-6">
          {/* Product Selection Section */}
          <div className="space-y-2">
            <Label className="text-base font-medium">제품 선택</Label>
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                  {productImage && productImage !== "/placeholder.svg" ? (
                    <img
                      src={productImage}
                      alt={product.productName || "Product"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base mb-1 line-clamp-2">
                    {product.productName || "Product Name"}
                  </h3>
                  {product.salePrice && (
                    <p className="text-lg font-semibold text-[#FF6B4A]">
                      {product.salePrice.toLocaleString("ko-KR")}원
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <Link 
                      href={`/products/${productId}`}
                      className="text-muted-foreground hover:text-[#FF6B4A] underline"
                    >
                      상품 상세 보기
                    </Link>
                    {/* <span className="text-muted-foreground hover:text-[#FF6B4A] underline cursor-pointer">
                      상품정보고시 선택
                    </span> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="inquiry-title" className="text-base font-medium">제목</Label>
            <Input
              id="inquiry-title"
              placeholder="제목을 입력해주세요"
              value={inquiryTitle}
              onChange={(e) => setInquiryTitle(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Content Textarea with Character Counter */}
          <div className="space-y-2">
            <Label htmlFor="inquiry-content" className="text-base font-medium">내용</Label>
            <div className="relative">
              <Textarea
                id="inquiry-content"
                placeholder="문의 내용을 입력하세요"
                value={inquiryContent}
                onChange={(e) => setInquiryContent(e.target.value)}
                rows={12}
                className="resize-none pr-20"
              />
              <div className="absolute bottom-3 right-3 text-sm text-muted-foreground">
                문자: {inquiryContent.length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="min-w-[100px] bg-gray-100 hover:bg-gray-200"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitInquiry}
              disabled={isSubmitting || !inquiryTitle.trim() || !inquiryContent.trim()}
              className="bg-[#FF6B4A] hover:bg-[#FF5A39] text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  제출 중...
                </>
              ) : (
                "등록"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
