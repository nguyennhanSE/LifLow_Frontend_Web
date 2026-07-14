'use client'

import { ImageIcon, Info, Save, Loader2 } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useProduct } from '@/hooks/use-product/product.hook'
import { useState, useMemo, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBanner } from '@/hooks/use-banner/banner.hook'
import { BannerEntity, EBannerStatus, EBannerType } from '@/entities/banner/banner.entity'
import { ProductEntity } from '@/entities/products/product.entity'
import { CreateBannerDto } from '@/hooks/use-banner/banner.dto'


export function MainProductsTab({ initialBanner }: { initialBanner: BannerEntity | null }) {
  const { getProducts } = useProduct()
  const { updateBanner} = useBanner()
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | undefined>(undefined)
  const [badgeText, setBadgeText] = useState('')
  const [title, setTitle] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  // Infinite query to fetch products - only enabled after mount to prevent SSR issues
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', 'list'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getProducts({
        page: pageParam,
        limit: 20,
      })
      return response
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.hasNextPage) {
        return lastPage.pagination.nextPage
      }
      if (lastPage?.hasNextPage) {
        return lastPage.nextPage
      }
      return undefined
    },
    initialPageParam: 1,
  })


  // Flatten and map products to only include id and productName
  const productOptions: ProductEntity[] = useMemo(() => {
    if (!data?.pages) return []
    
    return data.pages.flatMap((page: any) => {
      const products = page?.data || page?.products || page || []
      return products as ProductEntity[];
    })
  }, [data])

  const displayProduct: any = useMemo(() => {
    if (!selectedProduct) {
      return {type : 'initial', data : initialBanner, product : initialBanner?.product};
    }
    const foundProduct = productOptions.find(
      (p) => p.id.toString() === selectedProduct?.id.toString()
    )
    return {type : 'selected', data : initialBanner, product : foundProduct || selectedProduct}
  }, [productOptions, selectedProduct, initialBanner])

  useEffect(() => {
    if (displayProduct.type === 'initial' && initialBanner) {
      setBadgeText(initialBanner?.badgeText || '')
      setTitle(initialBanner?.title || '')
    }
  }, [displayProduct, initialBanner])

  // Reset image loading state when product changes
  useEffect(() => {
    setImageLoading(true)
    setImageLoaded(false)
  }, [displayProduct?.product?.imageRegistrationThumbnail, initialBanner?.imageUrl])

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageLoaded(true)
  }

  const handleSaveClick = async() => {
    try {
      setIsUpdating(true)
      const data : CreateBannerDto = {
        type : EBannerType.MAIN_PRODUCTS,
        status : EBannerStatus.ACTIVE,
        productId : displayProduct.product?.id,
        badgeText : badgeText,
        title : title,
        ctaButtonUrl : displayProduct.product?.ctaButtonUrl,
        imageUrl : displayProduct.product?.imageRegistrationThumbnail || displayProduct.product?.imageUrl,
        displayOrder : initialBanner?.displayOrder || 1,
      }
      console.log('data', data);
      await updateBanner(initialBanner?.id ?? '', data)
    } catch (error) {
      console.error('Failed to update banner:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // useEffect(() => {
  //   if (initialBanner) {
  //     console.log('initialBanner', initialBanner);
  //   }
  // },[initialBanner])

  return (
    <div className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-foreground" />
        <h2 className="text-base font-medium text-foreground">
          메인 화면 상품 노출 배너 설정
        </h2>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-foreground-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground-900">권장 사이즈</p>
            <p className="text-sm text-foreground-700">
              제는 이미지 800×800px 이상
            </p>
            <p className="mt-2 text-sm text-foreground-700">
              메인 페이지 상단에 표시되는 상품 배너입니다. 상품을 선택하면 해당 상품 정보가 자동으로 표시됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Form and Preview Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Side - Form */}
        <div className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product" className="text-sm font-medium">
              상품 선택
            </Label>
            {isLoading ? (
              <div className="flex h-10 items-center justify-center rounded-md border bg-muted/30">
                <span className="text-sm text-muted-foreground">상품 불러오는 중...</span>
              </div>
            ) : isError ? (
              <div className="flex h-10 items-center justify-center rounded-md border border-red-200 bg-red-50">
                <span className="text-sm text-red-600">상품 불러오기 오류</span>
              </div>
            ) : (
              <Select
                value={selectedProduct 
                  ? selectedProduct.id.toString() 
                  : (initialBanner?.product?.id?.toString() || initialBanner?.productId?.toString() || '')}
                onValueChange={(value) => {
                  const product = productOptions.find(p => p.id.toString() === value)
                  setSelectedProduct(product)
                }}
              >
                <SelectTrigger id="product" className="bg-muted/30 w-full">
                  <SelectValue placeholder="상품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.productName}
                    </SelectItem>
                  ))}
                  {hasNextPage && (
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? '로딩 중...' : '더 보기'}
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Badge Text */}
          <div className="space-y-2">
            <Label htmlFor="badge" className="text-sm font-medium">
              배치 텍스트
            </Label>
            <Input
              id="badge"
              value={badgeText || ''}
              onChange={(e) => setBadgeText(e.target.value)}
              className="bg-muted/30"
            />
          </div>

          {/* Title */} 
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              타이틀
            </Label>
            <Textarea
              id="title"
              value={title || ''}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[80px] resize-none bg-muted/30"
            />
          </div>

          {/* CTA Button URL */}
          <div className="space-y-2">
            <Label htmlFor="cta-url" className="text-sm font-medium">
              CTA 버튼 이동 URL
            </Label>
            <Input
              disabled={true}
              id="cta-url"
              value={displayProduct?.product?.ctaButtonUrl || initialBanner?.ctaButtonUrl || ''}
              className="bg-muted/30"
            />
          </div>

          {/* Product Information */}
          {(
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-foreground">
                선택된 상품 정보 (자동 적용)
              </p>
              <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">상품명:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedProduct ? selectedProduct.productName : initialBanner?.product?.productName || initialBanner?.productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">가격:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedProduct ? selectedProduct.salePrice : initialBanner?.product?.productPrice}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">브랜드:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedProduct ? selectedProduct.manufacturer : initialBanner?.product?.manufacturer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">설명:</span>
                  <span className="text-sm text-muted-foreground">
                    깊은 맛의 프리미엄 라면
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">미리보기</Label>
          <div className="rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="relative">
                {/* Background Image */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
                      <Spinner className="h-8 w-8 text-[#FF5833]" />
                    </div>
                  )}
                  <img
                    src={displayProduct?.product?.imageRegistrationThumbnail || initialBanner?.imageUrl || '/images/korean-ramen.jpg'}
                    alt="Product"
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 text-white z-20">
                  {/* Badge */}
                  {badgeText && (
                    <span className="mb-3 inline-block rounded-full bg-[#ff5733] px-3 py-1.5 text-xs font-medium drop-shadow-lg">
                      {badgeText.slice(0, 25)}
                    </span>
                  )}

                  {/* Product Title */}
                  {(displayProduct?.product?.productName || initialBanner?.productName) && (
                    <h3 className="mb-2 text-balance text-xl font-bold drop-shadow-lg">
                      {displayProduct?.product?.productName || initialBanner?.productName}
                    </h3>
                  )}

                  {/* Title */}
                  {/* {title && (
                    <p className="mb-4 line-clamp-2 text-sm text-white drop-shadow-md">{title}</p>
                  )} */}

                  {/* Price */}
                  {(displayProduct?.product?.salePrice || displayProduct?.product?.productPrice || initialBanner?.product?.productPrice) && (
                    <p className="mb-4 text-3xl font-bold text-[#ff5733] drop-shadow-lg">
                      {(displayProduct?.product?.salePrice || displayProduct?.product?.productPrice || initialBanner?.product?.productPrice)?.toLocaleString() || '15,900'}
                    </p>
                  )}

                  {/* CTA Button */}
                  <Button className="bg-[#ff5733] px-6 font-medium text-white hover:bg-[#e64a2e]">
                    구매하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button 
          onClick={handleSaveClick} 
          disabled={isUpdating}
          className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              저장
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

