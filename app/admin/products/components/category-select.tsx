"use client"

import { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useCategory } from "@/hooks/use-category/category.hook"
import { ProductCategoryEntity } from "@/entities/product-category/product-category.entity"
import { useTranslation } from 'react-i18next'

interface CategorySelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  isMounted: boolean
}

export function CategorySelect({
  label,
  value,
  onChange,
  placeholder = "선택",
  required = false,
  isMounted,
}: CategorySelectProps) {
  const { t } = useTranslation()
  const { getCategories } = useCategory()
  const [isClientMounted, setIsClientMounted] = useState(false)

  // Ensure component only renders on client to avoid hydration mismatch
  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  // Query for categories
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
  } = useQuery<ProductCategoryEntity[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategories({
        page: 1,
        limit: 20, // Fetch all categories with a large limit
      })
      console.log(result, 'result');
      // Handle different response structures
      if (Array.isArray(result)) {
        return result
      }
      if (result) {
        if (Array.isArray(result.data)) {
          return result.data
        }
      }
      return []
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: isMounted && isClientMounted,
  })

  // Process categories data and remove duplicates
  const allCategories = useMemo(() => {
    if (!categoriesData || !Array.isArray(categoriesData)) return []
    
    // Remove duplicates by id and filter out categories without id
    const uniqueCategories = categoriesData.filter(
      (category, index, self) =>
        category?.productCategoryNumber && 
        index === self.findIndex((c) => c?.productCategoryNumber === category.productCategoryNumber)
    )
    return uniqueCategories
  }, [categoriesData])

  // Prevent hydration mismatch by not rendering Select until client is mounted
  if (!isClientMounted) {
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="bg-white w-full h-9 rounded-md border border-input flex items-center px-3">
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isLoadingCategories ? (
            <div className="flex items-center justify-center p-4">
              <Spinner className="h-5 w-5" />
            </div>
          ) : (
            <>
              {allCategories.length > 0 ? (
                allCategories.map((category) => (
                  <SelectItem key={category.productCategoryNumber} value={String(category.productCategoryNumber)}>
                    {category.name || category.description || t('categoryProductcategorynumber', 'Category {{productCategoryNumber}}', { productCategoryNumber: category.productCategoryNumber })}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('key662', '카테고리가 없습니다')}
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

