'use client'

import { ImageIcon, Info, Save, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BannerEntity, EBannerStatus, EBannerType } from '@/entities/banner/banner.entity'
import { ECategoryType, ProductCategoryEntity } from '@/entities/product-category/product-category.entity'
import { useBanner } from '@/hooks/use-banner/banner.hook'
import { UpdateBannerDto } from '@/hooks/use-banner/banner.dto'
import { useCategory } from '@/hooks/use-category/category.hook'

type CategoryTypeOrAll = ECategoryType | 'ALL'

type CategoryTabProps = {
  categories: BannerEntity[]
}

type CategoryFormData = {
  title: string
  mainText: string
  ctaButtonText: string
  ctaButtonUrl: string
  imageUrl: string
}

export function CategoryTab({ categories }: CategoryTabProps) {
  const { updateBanner, updateBannerImageById } = useBanner()
  const { getCategories } = useCategory()
  const [formData, setFormData] = useState<Record<string, CategoryFormData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Record<string, File | null>>({})
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})
  const [productCategories, setProductCategories] = useState<ProductCategoryEntity[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const data = await getCategories({})
        const fetchedCategories = Array.isArray(data) ? data : data?.categories || data?.data || []
        setProductCategories(fetchedCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
        setProductCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [getCategories])

  // Get banner for a specific category
  // Support matching by either productCategoryNumber (old) or category enum (newer API)
  const getBannerForCategory = (params: { productCategoryNumber: string | null; category: CategoryTypeOrAll }): BannerEntity | null => {
    const { productCategoryNumber, category } = params
    const matchingBanners = categories.filter((banner) => {
      // 'ALL' banner is the one with category === null
      if (productCategoryNumber === null) {
        return banner.category === null
      }
      return banner.productCategoryNumber === productCategoryNumber || (category !== 'ALL' && banner.category === category)
    })
    return matchingBanners.length > 0 ? matchingBanners[0] : null
  }

  // Get all categories to display (including ALL)
  const getAllCategoriesToDisplay = (): Array<{ productCategoryNumber: string | null; name: CategoryTypeOrAll }> => {
    const result: Array<{ productCategoryNumber: string | null; name: CategoryTypeOrAll }> = [
      { productCategoryNumber: null, name: 'ALL' }
    ]
    
    // Add fetched categories
    productCategories.forEach((category) => {
      result.push({
        productCategoryNumber: category.productCategoryNumber,
        name: category.name
      })
    })
    
    return result
  }

  // Initialize form data from categories - use fetched categories
  useEffect(() => {
    if (categoriesLoading) return
    
    const initialData: Record<string, CategoryFormData> = {}
    const categoriesToDisplay = getAllCategoriesToDisplay()
    
    categoriesToDisplay.forEach((category) => {
      const key = category.productCategoryNumber || 'ALL'
      const banner = getBannerForCategory({ productCategoryNumber: category.productCategoryNumber, category: category.name })
      if (banner) {
        initialData[key] = {
          title: banner.title ?? '',
          mainText: banner.mainText ?? '',
          ctaButtonText: banner.ctaButtonText ?? '',
          ctaButtonUrl: banner.ctaButtonUrl ?? '',
          imageUrl: banner.imageUrl ?? '',
        }
      } else {
        // Empty data if no banner exists
        initialData[key] = {
          title: '',
          mainText: '',
          ctaButtonText: '',
          ctaButtonUrl: '',
          imageUrl: '',
        }
      }
    })
    
    setFormData(initialData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, productCategories, categoriesLoading])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imagePreviews])

  // const handleFieldChange = async (
  //   categoryType: ECategoryType,
  //   field: keyof CategoryFormData,
  //   value: string
  // ) => {
  //   // Update local state
  //   setFormData((prev) => ({
  //     ...prev,
  //     [categoryType]: {
  //       ...prev[categoryType],
  //       [field]: value,
  //     },
  //   }))

  //   // Find or create banner for this category
  //   const banner = getBannerForCategory(categoryType)
    
  //   // Get productCategoryNumber from the category type
  //   // We need to find it from the categories data or create a new one
  //   const categoryRelation = banner?.productCategoryBannerRelations?.[0]
  //   const productCategoryNumber = categoryRelation?.category?.productCategoryNumber || 
  //                                 categoryRelation?.product?.productCategoryNumber

  //   const updateDto: UpdateBannerDto = {
  //     type: EBannerType.CATEGORY,
  //     status: banner?.status || EBannerStatus.ACTIVE,
  //     productCategoryNumber: productCategoryNumber,
  //     title: field === 'title' ? value : formData[categoryType]?.title || banner?.title || undefined,
  //     mainText: field === 'mainText' ? value : formData[categoryType]?.mainText || banner?.mainText || undefined,
  //     ctaButtonText: field === 'ctaButtonText' ? value : formData[categoryType]?.ctaButtonText || banner?.ctaButtonText || undefined,
  //     ctaButtonUrl: field === 'ctaButtonUrl' ? value : formData[categoryType]?.ctaButtonUrl || banner?.ctaButtonUrl || undefined,
  //     imageUrl: field === 'imageUrl' ? value : formData[categoryType]?.imageUrl || banner?.imageUrl || undefined,
  //     displayOrder: banner?.displayOrder ?? undefined,
  //     startDate: banner?.startDate ? new Date(banner.startDate).toISOString() : undefined,
  //     endDate: banner?.endDate ? new Date(banner.endDate).toISOString() : undefined,
  //   }

  //   try {
  //     if (banner) {
  //       await updateBanner(banner.id, updateDto)
  //     }
  //     // If no banner exists, we might need to create one, but for now just update local state
  //   } catch (error) {
  //     console.error('Error updating banner:', error)
  //   }
  // }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      const categoriesToDisplay = getAllCategoriesToDisplay()
      
      // Update banner data for all categories
      const updatePromises = categoriesToDisplay.map(async (category) => {
        const key = category.productCategoryNumber || 'ALL'
        const data = formData[key]
        if (!data) return

        const banner = getBannerForCategory({ productCategoryNumber: category.productCategoryNumber, category: category.name })
        if (!banner) return // Skip if no banner exists

        const updateDto: UpdateBannerDto = {
          type: EBannerType.CATEGORY,
          status: banner.status || EBannerStatus.ACTIVE,
          category: category.name === 'ALL' ? null : category.name,
          title: data.title || undefined,
          mainText: data.mainText || undefined,
          ctaButtonText: data.ctaButtonText || undefined,
          ctaButtonUrl: data.ctaButtonUrl || undefined,
          imageUrl: data.imageUrl || undefined,
          displayOrder: banner.displayOrder ?? undefined,
          startDate: banner.startDate ? new Date(banner.startDate).toISOString() : undefined,
          endDate: banner.endDate ? new Date(banner.endDate).toISOString() : undefined,
        }

        return updateBanner(banner.id, updateDto)
      })

      // Upload images if any
      const imageUploadPromises = categoriesToDisplay.map(async (category) => {
        const key = category.productCategoryNumber || 'ALL'
        const banner = getBannerForCategory({ productCategoryNumber: category.productCategoryNumber, category: category.name })
        if (!banner) return

        const imageFile = selectedImages[key]
        if (!imageFile) return

        return updateBannerImageById(banner.id, imageFile)
      })

      // Execute all updates in parallel
      await Promise.all([...updatePromises, ...imageUploadPromises])

      // Clear selected images after successful upload
      setSelectedImages({})
      setImagePreviews({})
    } catch (error) {
      console.error('Error saving banners:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getCategoryName = (categoryType: CategoryTypeOrAll): string => {
    const labels: Record<CategoryTypeOrAll, string> = {
      ALL: '전체 카테고리',
      [ECategoryType.LIVESTOCK]: '축산 카테고리',
      [ECategoryType.CONVENIENCE_FOOD]: '간편식 카테고리',
      [ECategoryType.FISHERIES]: '수산 카테고리',
      [ECategoryType.SIDE_DISH]: '반찬 카테고리',
    }
    return labels[categoryType] || categoryType
  }

  const handleImageSelect = (key: string, file: File | null) => {
    if (!file) return

    setSelectedImages((prev) => ({
      ...prev,
      [key]: file,
    }))

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setImagePreviews((prev) => ({
      ...prev,
      [key]: previewUrl,
    }))
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-white p-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-foreground" />
        <h2 className="text-base font-medium text-foreground">
          마켓 카테고리별 세로형 배너 설정
        </h2>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-foreground-200 bg-foreground-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-foreground-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground-900">권장 사이즈:배너 이미지 400×600px</p>
            <p className="text-sm text-foreground-700">
              메인 페이지 마켓 영역의 좌측에 표시되는 세로형 배너입니다.
            </p>
          </div>
        </div>
      </div>

      {/* Category Banners */}
      {categoriesLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">카테고리 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {getAllCategoriesToDisplay().map((category) => {
            const key = category.productCategoryNumber || 'ALL'
            const banner = getBannerForCategory({ productCategoryNumber: category.productCategoryNumber, category: category.name })
            const currentData = formData[key] || {
              title: '',
              mainText: '',
              ctaButtonText: '',
              ctaButtonUrl: '',
              imageUrl: '',
            }
            const imageUrl = imagePreviews[key] || banner?.imageUrl || ''

            return (
              <div key={key} className="rounded-lg border border-border p-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Left Side - Form */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold">{getCategoryName(category.name)}</h3>
                      <p className="text-sm text-muted-foreground">카테고리</p>
                    </div>

                    {/* Upload Banner */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">배너 이미지 업로드</Label>
                      <input
                        type="file"
                        id={`image-upload-${key}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleImageSelect(key, file)
                        }}
                      />
                      <label
                        htmlFor={`image-upload-${key}`}
                        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 block"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                          {imageUrl ? (
                            <div className="relative w-full">
                              <img
                                src={imageUrl}
                                alt="배너 미리보기"
                                className="h-48 w-full rounded-lg object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                <Upload className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                클릭하여 업로드 또는 드래그 앤 드롭
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                      {selectedImages[key] && (
                        <p className="text-xs text-muted-foreground">
                          선택됨: {selectedImages[key]?.name}
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor={`title-${key}`} className="text-sm font-medium">
                        제목
                      </Label>
                      <Input
                        id={`title-${key}`}
                        value={currentData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              title: e.target.value,
                            },
                          }))
                        }
                        className="bg-muted/30"
                      />
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={`subtitle-${key}`}
                        className="text-sm font-medium"
                      >
                        부제목
                      </Label>
                      <Input
                        id={`subtitle-${key}`}
                        value={currentData.mainText}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              mainText: e.target.value,
                            },
                          }))
                        }
                        className="bg-muted/30"
                      />
                    </div>

                    {/* CTA Button Text */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={`cta-text-${key}`}
                        className="text-sm font-medium"
                      >
                        CTA 버튼 텍스트
                      </Label>
                      <Input
                        id={`cta-text-${key}`}
                        value={currentData.ctaButtonText}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              ctaButtonText: e.target.value,
                            },
                          }))
                        }
                        className="bg-muted/30"
                      />
                    </div>

                    {/* CTA Button Redirect URL */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={`cta-url-${key}`}
                        className="text-sm font-medium"
                      >
                        CTA 버튼 이동 URL
                      </Label>
                      <Input
                        id={`cta-url-${key}`}
                        value={currentData.ctaButtonUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              ctaButtonUrl: e.target.value,
                            },
                          }))
                        }
                        className="bg-muted/30"
                      />
                    </div>

                    {/* Background Color */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={`bg-color-${key}`}
                        className="text-sm font-medium"
                      >
                        배경색
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`bg-color-${key}`}
                          value={currentData.imageUrl}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                imageUrl: e.target.value,
                              },
                            }))
                          }
                          className="bg-muted/30"
                        />
                        <div
                          className="h-10 w-12 shrink-0 rounded border border-border"
                          style={{ backgroundColor: currentData.imageUrl || '#ffffff' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">미리보기</Label>
                    <div className="rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                      <div
                        className="aspect-[2/3] overflow-hidden rounded-lg shadow-lg relative"
                        style={{ backgroundColor: currentData.imageUrl || '#ffffff' }}
                      >
                        {/* Banner Image */}
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt="Banner"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        {/* Overlay Content */}
                        <div className="relative flex h-full flex-col justify-between p-6 text-white">
                          <div className="space-y-3">
                            <h3 className="text-balance text-2xl font-bold drop-shadow-lg">
                              {currentData.title || '제목'}
                            </h3>
                            <p className="text-sm opacity-90 drop-shadow-md">{currentData.mainText || '부제목'}</p>
                          </div>

                          <Button className="w-full bg-white text-foreground font-medium shadow-md hover:bg-white/90">
                            {currentData.ctaButtonText || '버튼 텍스트'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Save All Button */}
      <div className="pt-4">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex h-12 w-full items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-base font-medium text-white"
        >
          <Save className="h-4 w-4" />
          {isSaving ? '저장 중...' : '모든 카테고리 배너 저장'}
        </Button>
      </div>
    </div>
  )
}

