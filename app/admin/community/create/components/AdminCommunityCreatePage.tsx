'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { useRecipe } from '@/hooks/use-recipe/recipt.hook'
import { useProduct } from '@/hooks/use-product/product.hook'
import { CreateRecipeDto } from '@/hooks/use-recipe/recipe.dto'
import { ERecipeCategory, getRecipeCategoryLabel } from '@/entities/recipes/recipe.entity'
import { ProductEntity } from '@/entities/products/product.entity'
import { Plus, X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function AdminCommunityCreatePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { createRecipe } = useRecipe()
  const { getProducts } = useProduct()
  
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('')
  const [detail, setDetail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(null)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [debouncedProductQuery, setDebouncedProductQuery] = useState('')
  const [thumbnails, setThumbnails] = useState<File[]>([])
  const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [hasUserScrolled, setHasUserScrolled] = useState(false)

  // Get category options from enum
  const categoryOptions = Object.values(ERecipeCategory)

  // Debounce product search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductQuery(productSearchQuery.trim())
    }, 500)
    return () => clearTimeout(handler)
  }, [productSearchQuery])

  // Infinite query for products in dialog
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingProducts,
  } = useInfiniteQuery<ProductEntity[]>({
    queryKey: ['products', 'dialog', debouncedProductQuery],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const page = (pageParam as number) / 10 + 1
        const params: any = {
          page,
          limit: 10,
        }

        if (debouncedProductQuery.trim()) {
          params.search = debouncedProductQuery.trim()
        }

        const result = await getProducts(params)
        
        if (result?.data?.docs) {
          return result.data.docs
        } else if (Array.isArray(result?.data)) {
          return result.data
        } else if (Array.isArray(result)) {
          return result
        } else {
          return []
        }
      } catch (err) {
        throw err
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined
      const lastLength = Array.isArray(lastPage) ? (lastPage.length ?? 0) : 0
      if (lastLength < 10) return undefined
      const safePages = Array.isArray(allPages) ? allPages : []
      const nextOffset = safePages.reduce(
        (sum, page) => sum + (Array.isArray(page) ? (page.length ?? 0) : 0),
        0,
      )
      return nextOffset
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    enabled: productDialogOpen, // Only fetch when dialog is open
  })

  // Flatten products data
  const allProducts = useMemo(() => {
    if (!productsData?.pages) return []
    return productsData.pages.flat()
  }, [productsData])

  // Infinite scroll for product dialog
  useEffect(() => {
    if (!productDialogOpen) return
    const onScroll = () => setHasUserScrolled(true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [productDialogOpen])

  useEffect(() => {
    if (!productDialogOpen) return
    const el = bottomRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasUserScrolled && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, { root: null, rootMargin: '0px', threshold: 0.25 })
    observer.observe(el)
    return () => {
      observer.unobserve(el)
      observer.disconnect()
    }
  }, [productDialogOpen, bottomRef, hasUserScrolled, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Create recipe mutation
  const createMutation = useMutation({
    mutationFn: async (recipeData: CreateRecipeDto) => {
      return await createRecipe(recipeData, thumbnails.length > 0 ? thumbnails : undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      router.push('/admin/community')
    },
    onError: (error) => {
      console.error('Failed to create recipe:', error)
      alert('레시피 작성에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleProductToggle = (product: ProductEntity) => {
    if (selectedProduct?.id === product.id) {
      // If clicking the same product, deselect it
      setSelectedProduct(null)
    } else {
      // Select new product (replaces previous selection)
      setSelectedProduct(product)
    }
  }

  const handleRemoveProduct = () => {
    setSelectedProduct(null)
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach((file) => {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} 파일 크기는 10MB 미만이어야 합니다`)
        return
      }
      validFiles.push(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === validFiles.length) {
          setThumbnailPreviews([...thumbnailPreviews, ...previews])
        }
      }
      reader.readAsDataURL(file)
    })

    setThumbnails([...thumbnails, ...validFiles])
  }

  const handleRemoveThumbnail = (index: number) => {
    setThumbnails(thumbnails.filter((_, i) => i !== index))
    setThumbnailPreviews(thumbnailPreviews.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    router.back()
  }

  const handleComplete = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요')
      return
    }

    if (!category) {
      alert('카테고리를 선택해주세요')
      return
    }

    const recipeData: CreateRecipeDto = {
      title: title.trim(),
      category,
      content: detail.trim() || undefined,
      productId: selectedProduct?.id || undefined,
    }

    createMutation.mutate(recipeData)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* <Header /> */}
      <main className="flex-1 container py-8">
        <Card className="max-w-4xl mx-auto bg-white">
          <CardHeader>
            <CardTitle>{t('key234', '레시피 작성')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title field */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('key502', '제목')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('key727', '레시피 제목을 입력하세요')}
              />
            </div>

            {/* Category field */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('key332', '카테고리')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder={t('key730', '카테고리를 선택하세요')} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getRecipeCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detail field */}
            <div className="space-y-2">
              <Label htmlFor="detail">{t('key536', '내용')}</Label>
              <Textarea
                id="detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={t('key794', '레시피 내용을 입력하세요')}
                className="min-h-[200px]"
              />
            </div>

            {/* Products used (optional) */}
            <div className="space-y-2">
              <Label>{t('key735', '사용한 상품 (선택사항)')}</Label>
              <div className="space-y-2">
                {selectedProduct && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <div className="relative w-12 h-12 shrink-0 rounded-md border bg-background overflow-hidden">
                      {selectedProduct.imageRegistrationThumbnail ? (
                        <Image
                          src={selectedProduct.imageRegistrationThumbnail}
                          alt={selectedProduct.productName || 'Product'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {t('key320', '이미지 없음')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {selectedProduct.productName || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedProduct.brand || '브랜드 없음'}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveProduct}
                      className="ml-1 hover:bg-muted rounded-full p-1"
                      title={t('key736', '상품 제거')}
                      aria-label={t('key736', '상품 제거')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setProductDialogOpen(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedProduct ? '상품 변경' : '상품 선택'}
                </Button>
              </div>
            </div>

            {/* Attach image/video */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">{t('key795', '이미지/동영상 첨부')}</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleThumbnailChange}
                className="cursor-pointer"
                disabled={thumbnails.length >= 5}
              />
              <p className="text-sm text-muted-foreground">{t('510mbLength5', '최대 5개 파일 업로드 가능 (파일당 최대 10MB) - {{length}}/5', { length: thumbnails.length })}</p>
              {thumbnailPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {thumbnailPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={t('val7', '미리보기 {{val}}', { val: index + 1 })}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleRemoveThumbnail(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('key796', '이미지 제거')}
                        aria-label={t('key796', '이미지 제거')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recipe Writing Guide */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                {t('key797', '레시피 작성 가이드')}
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>{t('key798', '레시피는 관리자 승인 후 포인트가 지급됩니다.')}</li>
                <li>{t('500', '승인 시 자동으로 500포인트가 지급됩니다')}</li>
                <li>{t('key799', '부적절한 내용은 거부될 수 있습니다')}</li>
                <li>{t('key800', '저작권을 침해하지 않는 내용만 게시해주세요.')}</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={createMutation.isPending}
              >
                {t('key212', '취소')}
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {t('key801', '작성 중...')}
                  </>
                ) : (
                  '작성 완료'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      {/* <Footer /> */}

      {/* Product Selection Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('key742', '상품 선택')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder={t('key743', '상품명으로 검색...')}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : allProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('key744', '상품이 없습니다.')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {allProducts.map((product) => {
                    const isSelected = selectedProduct?.id === product.id
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductToggle(product)}
                        className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-16 shrink-0 rounded-md border bg-muted overflow-hidden">
                            {product.imageRegistrationThumbnail ? (
                              <Image
                                src={product.imageRegistrationThumbnail}
                                alt={product.productName || 'Product'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                {t('key320', '이미지 없음')}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {product.productName || 'N/A'}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {product.brand || '브랜드 없음'}
                            </p>
                            <p className="text-sm font-semibold mt-1">
                              {product.salePrice?.toLocaleString('ko-KR') || product.productPrice?.toLocaleString('ko-KR') || '0'}원
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Spinner className="h-5 w-5" />
                  <p className="text-sm text-muted-foreground">{t('key745', '다음 페이지를 불러오는 중...')}</p>
                </div>
              )}
              {hasNextPage && !isFetchingNextPage && allProducts.length > 0 && (
                <div className="flex justify-center py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('key746', '더 많은 상품 보기')}
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="text-sm text-muted-foreground">
                {t('key747', '선택된 상품:')} {selectedProduct.productName || 'N/A'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
            >
              {t('key212', '취소')}
            </Button>
            <Button
              onClick={() => setProductDialogOpen(false)}
            >
              {t('key748', '확인')} {selectedProduct ? '(1)' : '(0)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

