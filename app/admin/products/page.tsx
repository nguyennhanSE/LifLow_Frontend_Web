'use client'

import { useMemo, useState, useEffect, useRef, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { addDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'

// Custom hook for intersection observer with better performance
function useInView(options?: { threshold?: number; rootMargin?: string; triggerOnce?: boolean }) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!ref) return

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (options?.triggerOnce && observerRef.current) {
            observerRef.current.unobserve(ref)
          }
        } else if (!options?.triggerOnce) {
          setInView(false)
        }
      },
      {
        threshold: options?.threshold || 0.1,
        rootMargin: options?.rootMargin || '100px',
      }
    )

    observerRef.current.observe(ref)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [ref, options?.threshold, options?.rootMargin, options?.triggerOnce])

  return { ref: setRef, inView }
}

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import { useProduct } from '@/hooks/use-product/product.hook'
import { useCategory } from '@/hooks/use-category/category.hook'
import { ProductEntity } from '@/entities/products/product.entity'
import { Edit, Trash2, Plus } from 'lucide-react'
import { CreateProductSpecialOfferDto, UpdateProductDto } from '@/hooks/use-product/product.dto'
import { toast } from 'sonner'
import { DialogDescription } from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import { PaginationButton } from '@/components/common/PaginationButton'
import { ProductListQueryDto } from '@/hooks/use-product/product.dto'

type ProductStatus = '판매중' | '품절' | '숨김'

const statusOptions: ProductStatus[] = ['판매중', '품절', '숨김']

type WeeklyDealForm = {
  discountAmount: number
  startDate: Date
  endDate: Date
}

function formatCurrency(value: number) {
  return value.toLocaleString('ko-KR')
}

// Optimized Product Image Component with loading tracking
const ProductImage = memo(({ 
  src, 
  alt, 
  priority = false, 
  index = 0,
  onLoadStart,
  onLoadEnd
}: { 
  src: string
  alt: string
  priority?: boolean
  index?: number
  onLoadStart?: () => void
  onLoadEnd?: () => void
}) => {
  const { ref, inView } = useInView({
    threshold: 0.01,
    triggerOnce: true,
    rootMargin: '50px',
  })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const loadingStartedRef = useRef(false)

  // Only load image when in view or priority
  const shouldLoad = inView || priority

  // Track when image starts loading
  useEffect(() => {
    if (shouldLoad && !loadingStartedRef.current && src) {
      loadingStartedRef.current = true
      onLoadStart?.()
    }
  }, [shouldLoad, src, onLoadStart])

  const handleLoad = () => {
    setImageLoaded(true)
    onLoadEnd?.()
  }

  const handleError = () => {
    setImageError(true)
    onLoadEnd?.()
  }

  return (
    <div 
      ref={ref} 
      className="relative mx-auto size-12 overflow-hidden rounded-md border bg-muted"
    >
      {shouldLoad ? (
        <>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <Image
            src={src || '/placeholder.jpg'}
            alt={alt}
            fill
            sizes="48px"
            className={`object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            priority={priority && index < 3}
            loading={priority ? undefined : 'lazy'}
            quality={60}
            onLoad={handleLoad}
            onError={handleError}
          />
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground">
              이미지 없음
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-muted" />
      )}
    </div>
  )
})

ProductImage.displayName = 'ProductImage'

// Map ProductEntity to display format
function mapProductToDisplay(product: ProductEntity) {
  return {
    id: product.id || '',
    productCode: product.productCode || '',
    name: product.productName || '',
    imageUrl: product.imageRegistrationThumbnail || '/placeholder.jpg',
    category: product.category?.name || '',
    manufacturer: product.manufacturer || '',
    brand: product.brand || '',
    price: product.salePrice ?? 0,
    originalPrice: product.consumerPrice,
    stock: product.origin ?? 0, // Stock might need to be fetched separately
    status: (product.saleStatus === 'Y' ? '판매중' : product.saleStatus === 'N' ? '품절' : '숨김') as ProductStatus,
    isWeeklyDeal: product?.productSpecialOffer?.status || false,
    productSpecialOffer: product.productSpecialOffer,
  }
}

export default function AdminProductsPage() {
  const { getProducts, deleteProduct, updateProductById, deleteSpecialOffer, createSpecialOffer } = useProduct()
  const { getCategories } = useCategory()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedSaleStatus, setSelectedSaleStatus] = useState<string>('')
  const [debouncedSaleStatus, setDebouncedSaleStatus] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')
  const [debouncedCategory, setDebouncedCategory] = useState<string>('전체')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [dealForm, setDealForm] = useState<WeeklyDealForm>({
    discountAmount: 1000,
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  })
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [weeklyDealUpdatingId, setWeeklyDealUpdatingId] = useState<string | null>(null)
  const router = useRouter()
  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategories({})
      // Handle different response structures
      if (Array.isArray(result)) {
        return result
      } else if (result?.docs) {
        return result.docs
      } else if (result?.data) {
        return Array.isArray(result.data) ? result.data : result.data.docs || []
      }
      return []
    },
    refetchOnWindowFocus: false,
  })

  // Prepare category options with "전체" option and create mapping
  // Display: name (or description), Send: productCategoryNumber
  const { categoryOptions, categoryMapping } = useMemo(() => {
    const options = ['전체']
    const mapping: Record<string, string | number> = {}
    
    if (categoriesData && Array.isArray(categoriesData)) {
      categoriesData.forEach((category: any) => {
        // Use description if available, otherwise use name for display
        const displayName = category.description || category.name || ''
        const categoryNumber = category.productCategoryNumber
        
        if (displayName && categoryNumber !== undefined && !options.includes(displayName)) {
          options.push(displayName)
          // Map display name to productCategoryNumber for API query
          mapping[displayName] = categoryNumber
        }
      })
    }
    return { categoryOptions: options, categoryMapping: mapping }
  }, [categoriesData])

  // Paginated query for products
  const {
    data: productsResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', page, limit, debouncedQuery, debouncedSaleStatus, debouncedCategory, categoryMapping],
    queryFn: async () => {
      const params: ProductListQueryDto = { page, limit }
      if (debouncedQuery.trim()) params.search = debouncedQuery.trim()
      if (debouncedSaleStatus === 'Y' || debouncedSaleStatus === 'N') params.saleStatus = debouncedSaleStatus
      if (debouncedCategory && debouncedCategory !== '전체') {
        const categoryNumber = categoryMapping[debouncedCategory]
        if (categoryNumber !== undefined) params.category = String(categoryNumber)
      }
      return getProducts(params)
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    enabled: !isLoadingCategories,
  })

  const rawProducts = productsResult?.data ?? []
  const total = productsResult?.total ?? productsResult?.pagination?.total ?? (Array.isArray(rawProducts) ? rawProducts.length : 0)
  const totalPages = productsResult?.pagination?.totalPages ?? 1

  // Map current page data to display format
  const allProducts = useMemo(() => {
    const list = Array.isArray(rawProducts) ? rawProducts : []
    return list.map((p) => mapProductToDisplay(p as ProductEntity))
  }, [rawProducts])

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return undefined
    return allProducts.find((p) => p.id === selectedProductId)
  }, [selectedProductId, allProducts])

  // Debounce keyword query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(keyword.trim())
    }, 500)
    return () => clearTimeout(handler)
  }, [keyword])

  // Debounce category filter
  useEffect(() => {
    setDebouncedCategory(selectedCategory)
  }, [selectedCategory])

  // Debounce sale status filter
  useEffect(() => {
    setDebouncedSaleStatus(selectedSaleStatus)
  }, [selectedSaleStatus])

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, debouncedSaleStatus, debouncedCategory])

  const handleDeleteProduct = async (id: string) => {
    try {
      setDeletingProductId(id)
      await deleteProduct(id)
      toast.success('상품이 삭제되었습니다.')
      refetch()
    } catch (error: any) {
      toast.error(error?.message || '상품 삭제에 실패했습니다.')
    } finally {
      setDeletingProductId(null)
    }
  }

  const dealPrice = useMemo(() => {
    if (!selectedProduct) return 0
    const basePrice = selectedProduct.price
    return Math.max(basePrice - dealForm.discountAmount, 0)
  }, [selectedProduct, dealForm.discountAmount])

  const handleToggleProductSpecialOffer = async (id: string, dto: CreateProductSpecialOfferDto) => {
    try {
      const specialOffer: CreateProductSpecialOfferDto = {
        status: true,
        discountAmount: dto.discountAmount,
        specialPriceApplied: dealPrice,
        startDate: dto.startDate instanceof Date ? dto.startDate.toISOString() : dto.startDate,
        endDate: dto.endDate instanceof Date ? dto.endDate.toISOString() : dto.endDate,
      }
      await createSpecialOffer(id, specialOffer)
      setSelectedProductId(null)
      toast.success('이번주 특가 설정이 완료되었습니다.')
      refetch()
    } catch (error: any) {
      toast.error('이번주 특가 설정에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6 min-w-0">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">상품 관리</h2>
          <p className="text-muted-foreground text-sm">
            전체 {total}개의 상품
          </p>
        </div>

        <Button size="lg" className="bg-black text-white hover:bg-black/90" asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-5 w-5" />
            상품 추가
          </Link>
        </Button>
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="상품명, 브랜드로 검색"
              className="flex-1 min-w-0"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <div className="flex gap-2">
              <Select
                value={selectedSaleStatus || 'ALL'}
                onValueChange={(value) => setSelectedSaleStatus(value === 'ALL' ? '' : value)}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="판매 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="Y">판매중</SelectItem>
                  <SelectItem value="N">품절</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
                disabled={isLoadingCategories}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder={isLoadingCategories ? "로딩 중..." : "카테고리"} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">이미지</TableHead>
                <TableHead className="w-12 text-center">번호</TableHead>
                <TableHead className="w-24 text-center">상품번호</TableHead>
                <TableHead className="min-w-[180px]">상품명</TableHead>
                <TableHead className="min-w-[100px]">카테고리</TableHead>
                <TableHead className="min-w-[80px]">제조사</TableHead>
                <TableHead className="min-w-[80px]">판매가</TableHead>
                <TableHead className="w-16">재고</TableHead>
                <TableHead className="w-16">상태</TableHead>
                <TableHead className="min-w-[90px]">이번주 특가</TableHead>
                <TableHead className="w-20 text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-red-500">
                    오류가 발생했습니다: {error instanceof Error ? error.message : '알 수 없는 오류'}
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : allProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                allProducts.map((product, index) => (
                  <TableRow 
                    key={product.id}
                    className="product-table-row"
                  >
                    <TableCell className="text-center">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        priority={index < 3}
                        index={index}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="text-center">{product.productCode}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.manufacturer || product.brand}</TableCell>
                    <TableCell>
                      {(() => {
                        const hasSpecialOffer = !!product.productSpecialOffer?.status
                        const hasDiscount =
                          typeof product.originalPrice === "number" &&
                          product.originalPrice > (product.price ?? 0)

                        if (hasSpecialOffer || hasDiscount) {
                          return (
                            <div className="flex flex-col text-sm">
                              <span className="font-semibold">
                                {formatCurrency(product.price)}원
                              </span>
                              {typeof product.originalPrice === "number" && product.originalPrice > 0 && (
                                <span className="text-muted-foreground line-through text-xs">
                                  {formatCurrency(product.originalPrice)}원
                                </span>
                              )}
                            </div>
                          )
                        }

                        return (
                          <span className="font-semibold text-sm">
                            {formatCurrency(product.price)}원
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {product.stock}
                      <span className="text-muted-foreground text-xs">개</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{product.status}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {product.isWeeklyDeal && product.productSpecialOffer?.specialPriceApplied && (
                          <span className="text-destructive font-semibold">
                            {formatCurrency(product.productSpecialOffer.specialPriceApplied)}원
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <Dialog
                            open={selectedProductId === product.id}
                            onOpenChange={(open) =>
                              setSelectedProductId(open ? product.id : null)
                            }
                          >
                            <div className="relative inline-flex items-center">
                              {(weeklyDealUpdatingId === product.id) && (
                                <span className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 rounded-md">
                                  <Spinner className="size-5" />
                                </span>
                              )}
                              <Switch
                                checked={product.isWeeklyDeal}
                                disabled={weeklyDealUpdatingId === product.id}
                                onCheckedChange={async (checked) => {
                                  if (checked) {
                                    // Turning on: Open dialog
                                    setSelectedProductId(product.id)
                                    // Reset form with default values
                                    setDealForm({
                                      discountAmount: 1000,
                                      startDate: new Date(),
                                      endDate: addDays(new Date(), 7),
                                    })
                                  } else {
                                    // Turning off: delete special offer when exists
                                    setWeeklyDealUpdatingId(product.id)
                                    try {
                                      if (product.productSpecialOffer?.status) {
                                        await deleteSpecialOffer(product.id)
                                      } else {
                                        await updateProductById(product.id, {
                                          specialOffer: { status: false },
                                        } as UpdateProductDto)
                                      }
                                      toast.success('이번주 특가가 해제되었습니다.')
                                      refetch()
                                    } catch (error) {
                                      toast.error('이번주 특가 해제에 실패했습니다.')
                                    } finally {
                                      setWeeklyDealUpdatingId(null)
                                    }
                                  }
                                }}
                              />
                            </div>
                            {selectedProduct && selectedProduct.id === product.id && (
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>이번주 특가 설정</DialogTitle>
                                  <DialogDescription className='text-muted-foreground text-sm'>특가 할인율과 기간을 설정합니다</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-5 py-2">
                                  {/* Product Info Card */}
                                  <div className="flex items-center gap-4 rounded-lg bg-gray-100 p-4">
                                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-gray-300">
                                      <Image
                                        src={selectedProduct.imageUrl}
                                        alt={selectedProduct.name}
                                        fill
                                        sizes="96px"
                                        className="object-contain"
                                        priority
                                        quality={80}
                                      />
                                    </div>
                                    <div>
                                      <p className="text-lg font-semibold mb-1">
                                        {selectedProduct.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        판매가: {formatCurrency(selectedProduct.price)}원
                                      </p>
                                    </div>
                                  </div>

                                  {/* Discount Input */}
                                  <div className="space-y-2">
                                    <Label htmlFor="discountAmount" className="text-sm font-semibold">
                                      특가 할인금액 (원)
                                    </Label>
                                    <Input
                                      id="discountAmount"
                                      type="number"
                                      value={dealForm.discountAmount}
                                      onChange={(e) =>
                                        setDealForm((prev) => ({
                                          ...prev,
                                          discountAmount: Number(
                                            e.target.value || 0,
                                          ),
                                        }))
                                      }
                                      className="text-base"
                                    />
                                  </div>

                                  {/* Price Summary */}
                                  <div className="rounded-lg bg-orange-50 p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-700">정가</span>
                                      <span className="text-gray-500 line-through">
                                        {formatCurrency(
                                          selectedProduct.price ?? 0,
                                        )}
                                        원
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-orange-600">
                                      <span>할인금액</span>
                                      <span>
                                        -
                                        {formatCurrency(
                                          dealForm.discountAmount || 0,
                                        )}
                                        원
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                      <span className="text-sm font-semibold">특가 적용 가격</span>
                                      <span className="text-xl font-bold text-orange-600">
                                        {formatCurrency(
                                          Math.max(dealPrice, 0),
                                        )}
                                        원
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>특가 시작 시간</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-full justify-between text-left font-normal"
                                          >
                                            {format(
                                              dealForm.startDate,
                                              'yyyy.MM.dd (EEE)',
                                              { locale: ko },
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0">
                                          <Calendar
                                            mode="single"
                                            disabled
                                            selected={dealForm.startDate}
                                            onSelect={(date) =>
                                              date &&
                                                setDealForm((prev) => ({
                                                  ...prev,
                                                  startDate: date,
                                                }))
                                            }
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>특가 종료 시간</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-full justify-between text-left font-normal"
                                          >
                                            {format(
                                              dealForm.endDate,
                                              'yyyy.MM.dd (EEE)',
                                              { locale: ko },
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0">
                                          <Calendar
                                            mode="single"
                                            selected={dealForm.endDate}
                                            onSelect={(date) =>
                                              date &&
                                                setDealForm((prev) => ({
                                                  ...prev,
                                                  endDate: date,
                                                }))
                                            }
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    className="bg-black text-white hover:bg-black/90"
                                    type="button"
                                    onClick={() =>
                                      handleToggleProductSpecialOffer(
                                        selectedProduct.id,
                                        dealForm,
                                      )
                                    }
                                  >
                                    설정 완료
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button onClick={() => {router.push(`/admin/products/${product.id}`)}} variant="outline" size="icon-sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => setProductToDelete(product.id)} 
                          variant="outline" 
                          size="icon-sm"
                          disabled={deletingProductId === product.id}
                        >
                          {deletingProductId === product.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Delete product confirmation dialog */}
      <Dialog open={productToDelete !== null} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>상품 삭제</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={productToDelete !== null && deletingProductId === productToDelete}
              onClick={async () => {
                if (productToDelete) {
                  await handleDeleteProduct(productToDelete)
                  setProductToDelete(null)
                }
              }}
            >
              {productToDelete !== null && deletingProductId === productToDelete ? (
                <Spinner className="h-4 w-4" />
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {total > 0 && (
        <PaginationButton
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          className="py-4"
        />
      )}
    </div>
    
  )
}


