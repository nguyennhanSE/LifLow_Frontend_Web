'use client'

import { use, useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Eye, EyeOff, Check, X, Trash2, Edit, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useRecipe } from '@/hooks/use-recipe/recipt.hook'
import { useProduct } from '@/hooks/use-product/product.hook'
import { Recipe, ERecipeCategory } from '@/entities/recipes/recipe.entity'
import { UpdateRecipeDto } from '@/hooks/use-recipe/recipe.dto'
import { ProductEntity } from '@/entities/products/product.entity'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

export default function AdminCommunityIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { 
    getRecipeForAdmin, 
    activateRecipe, 
    deactivateRecipe, 
    deleteRecipe, 
    approveRecipe, 
    rejectRecipe,
    getRecipeDashboard,
    updateRecipe
  } = useRecipe()
  const { getProducts } = useProduct()

  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<UpdateRecipeDto>({
    title: '',
    category: '',
    content: '',
    ingredients: [],
    productId: '',
  })
  const [thumbnailFiles, setThumbnailFiles] = useState<File[]>([])
  const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(null)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [debouncedProductQuery, setDebouncedProductQuery] = useState('')
  const productBottomRef = useRef<HTMLDivElement>(null)
  const [hasUserScrolled, setHasUserScrolled] = useState(false)

  // Fetch recipe data
  const {
    data: recipeData,
    isLoading: isLoadingRecipe,
    isError: isErrorRecipe,
    refetch: refetchRecipe,
  } = useQuery({
    queryKey: ['recipe', resolvedParams.id],
    queryFn: async () => {
      const result = await getRecipeForAdmin(resolvedParams.id)
      return result.recipeDetail as Recipe
    },
    enabled: !!resolvedParams.id,
  })

  // Fetch dashboard for refetch
  const { refetch: refetchDashboard } = useQuery({
    queryKey: ['recipe-dashboard'],
    queryFn: async () => {
      return await getRecipeDashboard()
    },
    enabled: false,
  })

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
    const el = productBottomRef.current
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
  }, [productDialogOpen, productBottomRef, hasUserScrolled, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await deleteRecipe(resolvedParams.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-dashboard'] })
      router.push('/admin/community')
    },
    onError: (error) => {
      console.error('Failed to delete recipe:', error)
      alert('레시피 삭제에 실패했습니다. 다시 시도해주세요.')
    },
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      return await approveRecipe(resolvedParams.id)
    },
    onSuccess: async () => {
      await refetchRecipe()
      await refetchDashboard()
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
    onError: (error) => {
      console.error('Failed to approve recipe:', error)
      alert('레시피 승인에 실패했습니다. 다시 시도해주세요.')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      return await rejectRecipe(resolvedParams.id)
    },
    onSuccess: async () => {
      await refetchRecipe()
      await refetchDashboard()
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
    onError: (error) => {
      console.error('Failed to reject recipe:', error)
      alert('레시피 반려에 실패했습니다. 다시 시도해주세요.')
    },
  })

  // Activate/Deactivate mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (isActive) {
        return await deactivateRecipe(resolvedParams.id)
      } else {
        return await activateRecipe(resolvedParams.id)
      }
    },
    onSuccess: async () => {
      await refetchRecipe()
      await refetchDashboard()
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
    onError: (error) => {
      console.error('Failed to toggle recipe status:', error)
      alert('레시피 상태 변경에 실패했습니다. 다시 시도해주세요.')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (recipe: UpdateRecipeDto) => {
      return await updateRecipe(resolvedParams.id, recipe, thumbnailFiles.length > 0 ? thumbnailFiles : undefined)
    },
    onSuccess: async () => {
      await refetchRecipe()
      await refetchDashboard()
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', resolvedParams.id] })
      setIsEditMode(false)
      setThumbnailFiles([])
      setThumbnailPreviews([])
      alert('레시피가 성공적으로 수정되었습니다.')
    },
    onError: (error) => {
      console.error('Failed to update recipe:', error)
      alert('레시피 수정에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleDelete = () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  const handleApprove = () => {
    if (confirm('이 레시피를 승인하시겠습니까?')) {
      approveMutation.mutate()
    }
  }

  const handleReject = () => {
    if (confirm('이 레시피를 반려하시겠습니까?')) {
      rejectMutation.mutate()
    }
  }

  const handleToggleActive = () => {
    if (recipeData?.isActive) {
      if (confirm('이 레시피를 비활성화하시겠습니까?')) {
        toggleActiveMutation.mutate(true)
      }
    } else {
      if (confirm('이 레시피를 활성화하시겠습니까?')) {
        toggleActiveMutation.mutate(false)
      }
    }
  }

  const handleOpenEditMode = () => {
    if (recipeData) {
      const product = (recipeData as any).product || (recipeData as any).products || null
      setEditFormData({
        title: recipeData.title || '',
        category: recipeData.category || '',
        content: recipeData.content || '',
        ingredients: recipeData.ingredients || [],
        productId: product?.id || '',
      })
      // Set selected product
      setSelectedProduct(product || null)
      // Set preview images from existing thumbnails
      const existingImages = Array.isArray(recipeData.thumbnailUrl)
        ? recipeData.thumbnailUrl.filter((url): url is string => typeof url === 'string' && url.length > 0)
        : typeof recipeData.thumbnailUrl === 'string' && recipeData.thumbnailUrl
        ? [recipeData.thumbnailUrl]
        : []
      setThumbnailPreviews(existingImages)
      setThumbnailFiles([])
      setIsEditMode(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setThumbnailFiles([])
    setThumbnailPreviews([])
  }

  const handleEditFormChange = (field: keyof UpdateRecipeDto, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddIngredient = () => {
    setEditFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), ''],
    }))
  }

  const handleRemoveIngredient = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleIngredientChange = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.map((item, i) => i === index ? value : item) || [],
    }))
  }

  const handleSubmitEdit = () => {
    if (!editFormData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!editFormData.category) {
      alert('카테고리를 선택해주세요.')
      return
    }
    // Update productId from selected product
    const updatedData = {
      ...editFormData,
      productId: selectedProduct?.id || '',
    }
    updateMutation.mutate(updatedData)
  }

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
    if (files.length > 0) {
      // Add new files to existing ones
      setThumbnailFiles(prev => [...prev, ...files])
      // Create preview URLs for new files
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setThumbnailPreviews(prev => [...prev, ...newPreviews])
      // Reset input to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveThumbnail = (index: number) => {
    // Check if this is an existing image (from original data) or a new file
    const existingImages = Array.isArray(recipeData?.thumbnailUrl)
      ? recipeData.thumbnailUrl.filter((url): url is string => typeof url === 'string' && url.length > 0)
      : typeof recipeData?.thumbnailUrl === 'string' && recipeData.thumbnailUrl
      ? [recipeData.thumbnailUrl]
      : []
    
    const existingCount = existingImages.length
    
    if (index < existingCount) {
      // Removing an existing image - we'll need to track this differently
      // For now, just remove from previews
      const newPreviews = thumbnailPreviews.filter((_, i) => i !== index)
      setThumbnailPreviews(newPreviews)
    } else {
      // Removing a newly added file
      const fileIndex = index - existingCount
      const newPreviews = thumbnailPreviews.filter((_, i) => i !== index)
      const newFiles = thumbnailFiles.filter((_, i) => i !== fileIndex)
      
      // Revoke the object URL to free memory
      URL.revokeObjectURL(thumbnailPreviews[index])
      
      setThumbnailPreviews(newPreviews)
      setThumbnailFiles(newFiles)
    }
  }

  const isLoading = isLoadingRecipe
  const isError = isErrorRecipe

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    )
  }

  if (isError || !recipeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('key628', '레시피를 찾을 수 없습니다')}</h2>
          <Button onClick={() => router.push('/admin/community')}>{t('key629', '목록으로')}</Button>
        </div>
      </div>
    )
  }

  // Handle thumbnailUrl - get all images
  const allImages: string[] = Array.isArray(recipeData.thumbnailUrl)
    ? recipeData.thumbnailUrl.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : typeof recipeData.thumbnailUrl === 'string' && recipeData.thumbnailUrl
    ? [recipeData.thumbnailUrl]
    : ['/placeholder.svg']
  
  const mainImage = allImages[0] || '/placeholder.svg'
  const additionalImages = allImages.slice(1)

  const authorName = recipeData.authorName || recipeData.author?.name || 'N/A'
  const category = recipeData.category || 'N/A'
  const createdAt = recipeData.dateOfWriting 
    ? format(new Date(recipeData.dateOfWriting), 'yyyy-MM-dd')
    : recipeData.createdAt
    ? format(new Date(recipeData.createdAt), 'yyyy-MM-dd')
    : 'N/A'

  const status = recipeData.status === 'approved' || recipeData.status === 'active' || recipeData.isActive
    ? '승인됨'
    : recipeData.status === 'pending'
    ? '승인 대기'
    : recipeData.status === 'rejected'
    ? '반려됨'
    : '비활성'

  const statusColor = recipeData.status === 'approved' || recipeData.status === 'active' || recipeData.isActive
    ? 'bg-green-50 text-green-600 border-green-200'
    : recipeData.status === 'pending'
    ? 'bg-orange-50 text-orange-600 border-orange-200'
    : recipeData.status === 'rejected'
    ? 'bg-red-50 text-red-600 border-red-200'
    : 'bg-gray-50 text-gray-600 border-gray-200'

  const exposureStatus = recipeData.isActive ? '노출' : '숨김'
  const exposureColor = recipeData.isActive 
    ? 'bg-green-50 text-green-600 border-green-200'
    : 'bg-gray-50 text-gray-600 border-gray-200'

  // Parse cooking method from content (assuming it's formatted as steps)
  const cookingSteps = recipeData.content 
    ? recipeData.content.split('\n').filter(step => step.trim().length > 0)
    : []

  // Get product if available (it's a single object, not an array)
  const product = (recipeData as any).product || (recipeData as any).products || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Link 
            href="/admin/community" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('key629', '목록으로')}</span>
          </Link>
        </div>
        <div>
            <h1 className="text-3xl font-bold mb-2">{t('key723', '레시피 상세')}</h1>
            <p className="text-gray-600">
              {t('key724', '레시피 내용을 확인하고 승인/반려 또는 삭제할 수 있습니다')}
            </p>
        </div>
      </div>


      {/* Content */}
      <div className="space-y-6">


        {/* Main Card */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {!isEditMode ? (
            <>
              {/* Hero Image */}
              <div className="w-full h-100 relative">
                <img 
                  src={mainImage} 
                  alt={recipeData.title || 'Recipe'} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Additional Images Gallery */}
              {additionalImages.length > 0 && (
                <div className="p-4 bg-gray-50 border-t">
                  <div className="grid grid-cols-4 gap-4">
                    {additionalImages.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={imageUrl}
                          alt={t('valImageVal2', '{{val}} - Image {{val2}}', { val: recipeData.title || 'Recipe', val2: index + 2 })}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                {/* Title */}
                <h2 className="text-2xl font-bold mb-8">{recipeData.title || 'N/A'}</h2>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode - Images Section */}
              <div className="p-8 space-y-6">
                {/* Thumbnail Upload */}
                <div className="space-y-2">
                  <Label>{t('key328', '이미지')}</Label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="thumbnail-upload" className="sr-only">
                          {t('key551', '이미지 업로드')}
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleThumbnailChange}
                          className="hidden"
                          id="thumbnail-upload"
                          aria-label={t('key551', '이미지 업로드')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer"
                        >
                          {t('key27', '이미지 선택')}
                        </Button>
                        {thumbnailFiles.length > 0 && (
                          <span className="text-sm text-muted-foreground">{t('length7', '{{length}}개 파일 선택됨', { length: thumbnailFiles.length })}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('key725', '여러 이미지를 선택할 수 있습니다')}
                      </p>
                    </div>
                    
                    {/* Image Previews */}
                    {thumbnailPreviews.length > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        {thumbnailPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                            <img
                              src={preview}
                              alt={t('previewVal', 'Preview {{val}}', { val: index + 1 })}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveThumbnail(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">{t('key726', '제목 *')}</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                    placeholder={t('key727', '레시피 제목을 입력하세요')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Content - Shared between view and edit mode */}
          <div className={isEditMode ? "px-8 pb-8 space-y-6" : "p-8"}>

            {!isEditMode ? (
              <>
                {/* Metadata Grid - 3 columns as per image */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-8">
                  {/* Column 1 */}
                  <div className="space-y-6">
                    {/* Author */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key221', '작성자')}</div>
                      <div className="font-medium">{authorName}</div>
                    </div>
                    {/* Views */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key503', '조회수')}</div>
                      <div className="font-medium">{(recipeData.views || 0).toLocaleString('en-US')}</div>
                    </div>
                    {/* Status */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key336', '상태')}</div>
                      <span className={`inline-block px-3 py-1 text-sm rounded border ${statusColor}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-6">
                    {/* Category */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key332', '카테고리')}</div>
                      <span className={`inline-block px-3 py-1 text-sm rounded border ${
                        category === ERecipeCategory.RECIPE
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : category === ERecipeCategory.REVIEWS
                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                          : 'bg-pink-50 text-pink-600 border-pink-200'
                      }`}>
                        {category}
                      </span>
                    </div>
                    {/* Likes */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key728', '좋아요')}</div>
                      <div className="font-medium">{(recipeData as { numberOfLikes?: number }).numberOfLikes ?? 0}</div>
                    </div>
                    {/* Exposure Status */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key652', '노출 상태')}</div>
                      <span className={`inline-block px-3 py-1 text-sm rounded border ${exposureColor}`}>
                        {exposureStatus}
                      </span>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-6">
                    {/* Created Date */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key222', '작성일')}</div>
                      <div className="font-medium">{createdAt}</div>
                    </div>
                    {/* Comments */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">{t('key632', '댓글')}</div>
                      <div className="font-medium">{(recipeData as { numberOfComments?: number }).numberOfComments ?? 0}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Edit Mode - Category */}
                <div className="space-y-2">
                  <Label htmlFor="edit-category">{t('key729', '카테고리 *')}</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => handleEditFormChange('category', value)}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder={t('key730', '카테고리를 선택하세요')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ERecipeCategory.RECIPE}>{t('recipe', 'RECIPE')}</SelectItem>
                      <SelectItem value={ERecipeCategory.REVIEWS}>{t('reviews', 'REVIEWS')}</SelectItem>
                      <SelectItem value={ERecipeCategory.DAILY_LIFE}>DAILY_LIFE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Ingredients Section */}
            {!isEditMode ? (
              recipeData.ingredients && recipeData.ingredients.length > 0 && (
                <div className="mb-8">
                  <div className="text-sm text-gray-600 mb-2">{t('key731', '재료')}</div>
                  <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-sm rounded border border-orange-200 mb-4">
                    {t('recipe2', 'Recipe')}
                  </span>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-2 text-gray-700">
                      {recipeData.ingredients.map((ingredient, index) => (
                        <div key={index}>{ingredient}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('key731', '재료')}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredient}
                  >
                    {t('key732', '재료 추가')}
                  </Button>
                </div>
                <div className="space-y-2">
                  {editFormData.ingredients?.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        placeholder={t('val4', '재료 {{val}}', { val: index + 1 })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {(!editFormData.ingredients || editFormData.ingredients.length === 0) && (
                    <p className="text-sm text-muted-foreground">{t('key733', '재료가 없습니다. 위의 버튼을 클릭하여 추가하세요.')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Product Section */}
            {!isEditMode ? (
              product && typeof product === 'object' && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4">{t('key734', '사용된 제품')}</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {product.imageRegistrationThumbnail && (
                      <div className="mb-3">
                        <img 
                          src={product.imageRegistrationThumbnail} 
                          alt={product.productName || 'Product'} 
                          className="w-full h-100 object-contain rounded"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {product.productName || 'N/A'}
                      </h4>
                      {product.salePrice && (
                        <div className="text-base font-bold text-gray-900">
                          {product.salePrice.toLocaleString('ko-KR')}원
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Label>{t('key735', '사용한 상품 (선택사항)')}</Label>
                <div className="space-y-2">
                  {selectedProduct && (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <div className="relative w-12 h-12 shrink-0 rounded-md border bg-background overflow-hidden">
                        {selectedProduct.imageRegistrationThumbnail ? (
                          <img
                            src={selectedProduct.imageRegistrationThumbnail}
                            alt={selectedProduct.productName || 'Product'}
                            className="w-full h-full object-cover"
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
            )}

            {/* Cooking Method */}
            {!isEditMode ? (
              cookingSteps.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4">{t('key737', '요리 방법')}</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-3 text-gray-700">
                      {cookingSteps.map((step, index) => (
                        <div key={index}>
                          {step.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-content">{t('key737', '요리 방법')}</Label>
                <Textarea
                  id="edit-content"
                  value={editFormData.content}
                  onChange={(e) => handleEditFormChange('content', e.target.value)}
                  placeholder={t('key738', '요리 방법을 입력하세요 (각 단계는 새 줄로 구분)')}
                  rows={8}
                  className="resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              {!isEditMode ? (
                <>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleOpenEditMode}
                      className="bg-black text-white hover:bg-gray-800 flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('key288', '수정')}
                    </Button>
                  </div>
                  {recipeData.status === 'pending' ? (
                    <div className="grid grid-cols-3 gap-3">
                      {/* Pending: Show approve, reject, delete buttons in order */}
                      <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 text-white hover:bg-green-700 w-full"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {t('key739', '승인')}
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={rejectMutation.isPending}
                        className="bg-red-600 text-white hover:bg-red-700 w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {t('key740', '반려')}
                      </Button>
                      {recipeData.status === 'pending' && <Button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        variant="destructive"
                        className="bg-[#ff5833] hover:bg-[#ff4520] w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('key741', '삭제')}
                      </Button>}
                    </div>
                  ) : (
                    <>
                      {/* Approved or Rejected: Only show delete button */}

                    </>
                  )}
                </>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    {t('key212', '취소')}
                  </Button>
                  <Button
                    onClick={handleSubmitEdit}
                    disabled={updateMutation.isPending}
                    className="bg-black text-white hover:bg-gray-800 flex-1"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        {t('key582', '저장 중...')}
                      </>
                    ) : (
                      '저장'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                              <img
                                src={product.imageRegistrationThumbnail}
                                alt={product.productName || 'Product'}
                                className="w-full h-full object-cover"
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
              <div ref={productBottomRef} className="h-4" />
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
