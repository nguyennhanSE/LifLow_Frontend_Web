"use client"

import { useState, useMemo, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useProduct } from "@/hooks/use-product/product.hook"
import { useCategory } from "@/hooks/use-category/category.hook"
import { ProductEntity } from "@/entities/products/product.entity"
import { ProductCategoryEntity } from "@/entities/product-category/product-category.entity"
import { createProductNavigationHandler } from "@/lib/utils"
import { useTranslation, Trans } from 'react-i18next'

interface DisplayProduct {
  id: string
  name: string
  category: string
  image: string
  rating: number
  reviews: number
  originalPrice: number
  salePrice: number
  discount: number
  isHot: boolean
  productBadges?: {
    isHotDeal: boolean
    isNewProduct: boolean
    isBestSeller: boolean
  } | null
}

function ProductCardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative aspect-square">
      {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  )
}

// Map category name from English to Korean
function getCategoryKoreanName(categoryName: string): string {
  const categoryMap: Record<string, string> = {
    'FISHERIES': '수산',
    'CONVENIENCE_FOOD': '간편식',
    'SIDE_DISH': '반찬',
    'LIVESTOCK': '축산',
  }
  return categoryMap[categoryName] || categoryName
}

function mapProductToDisplay(product: ProductEntity): DisplayProduct {
  const originalPrice = product.consumerPrice || product.productPrice || 0
  const salePrice = product.salePrice || product.productPrice || 0
  const discount = originalPrice > salePrice && originalPrice > 0 
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) 
    : 0
  
  const categoryName = product.category?.name || ""
  const koreanCategoryName = getCategoryKoreanName(categoryName)
  
  // Get productBadges - handle both object and array formats
  let productBadges = null
  if (product.productBadges) {
    if (typeof product.productBadges === 'object' && !Array.isArray(product.productBadges)) {
      productBadges = {
        isHotDeal: product.productBadges.isHotDeal || false,
        isNewProduct: product.productBadges.isNewProduct || false,
        isBestSeller: product.productBadges.isBestSeller || false,
      }
    }
  }
  
  return {
    id: product.id,
    name: product.productName || "",
    category: koreanCategoryName,
    image: product.imageRegistrationThumbnail || product.imageRegistrationList || "/placeholder.svg",
    rating: product.productReviews?.averageRating || 0,
    reviews: product.productReviews?.total || 0,
    originalPrice,
    salePrice,
    discount,
    isHot: product.productSpecialOffer?.status || false,
    productBadges,
  }
}

function parseNumberParam(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function deriveUiSort(sortByParam: string | null, sortOrderParam: string | null): string {
  const sortBy = (sortByParam || "").trim()
  const sortOrder = (sortOrderParam || "").trim().toLowerCase()

  if (sortBy === "salePrice" && sortOrder === "asc") return "price-low"
  if (sortBy === "salePrice" && sortOrder === "desc") return "price-high"
  if (sortBy === "rating" && sortOrder === "desc") return "rating"
  if (sortBy === "createdAt" && sortOrder === "desc") return "latest"

  return "latest"
}

export function MarketPageSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { getProducts, getBrands } = useProduct()
  const { getCategories } = useCategory()
  
  // Initialize with default, will be updated dynamically based on actual product prices
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStorageTypes, setSelectedStorageTypes] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("latest")
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 12
  const [displayStatus] = useState("Y")

  // Initialize filter/sort state from URL query params (once on mount)
  useEffect(() => {
    const pageFromUrl = parseNumberParam(searchParams.get("page"), 1)
    const limitFromUrl = parseNumberParam(searchParams.get("limit"), limit)
    const displayStatusFromUrl = searchParams.get("displayStatus") || displayStatus
    const searchFromUrl = searchParams.get("search") || ""
    const categoryFromUrl = searchParams.get("category") || ""
    const brandFromUrl = searchParams.get("brand") || ""
    const storageMethodFromUrl = searchParams.get("storageMethod") || ""
    const sortByFromUrl = searchParams.get("sortBy")
    const sortOrderFromUrl = searchParams.get("sortOrder")

    setCurrentPage(pageFromUrl)
    // limit & displayStatus are fixed in UI right now; keep state as-is but we will reflect URL below
    if (searchFromUrl) setSearchQuery(searchFromUrl)
    if (categoryFromUrl) {
      setSelectedCategories(
        categoryFromUrl
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    }
    if (brandFromUrl) {
      setSelectedBrands(
        brandFromUrl
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    }
    if (storageMethodFromUrl) {
      setSelectedStorageTypes(
        storageMethodFromUrl
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    }
    setSortBy(deriveUiSort(sortByFromUrl, sortOrderFromUrl))

    // If URL had different limit/displayStatus, we still mirror those in the URL sync,
    // but request params remain controlled by UI constants for now.
    if (limitFromUrl !== limit || displayStatusFromUrl !== displayStatus) {
      // no-op (intentional)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const requestSort = useMemo(() => {
    if (sortBy === "price-low") return { sortBy: "salePrice", sortOrder: "asc" as const }
    if (sortBy === "price-high") return { sortBy: "salePrice", sortOrder: "desc" as const }
    if (sortBy === "rating") return { sortBy: "rating", sortOrder: "desc" as const }
    return { sortBy: "createdAt", sortOrder: "desc" as const }
  }, [sortBy])

  // Keep URL query params in sync with request params
  useEffect(() => {
    const next = new URLSearchParams()
    next.set("page", String(currentPage))
    next.set("limit", String(limit))
    next.set("displayStatus", displayStatus)
    next.set("sortBy", requestSort.sortBy)
    next.set("sortOrder", requestSort.sortOrder)

    if (debouncedSearchQuery.trim()) next.set("search", debouncedSearchQuery.trim())
    if (selectedCategories.length > 0) next.set("category", selectedCategories.join(","))
    if (selectedBrands.length > 0) next.set("brand", selectedBrands.join(","))
    if (selectedStorageTypes.length > 0) next.set("storageMethod", selectedStorageTypes.join(","))

    const nextQueryString = next.toString()
    const currentQueryString = searchParams.toString()
    if (nextQueryString !== currentQueryString) {
      router.replace(t('pathnamenextquerystring', '{{pathname}}?{{nextQueryString}}', { pathname, nextQueryString }), { scroll: false })
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    displayStatus,
    limit,
    pathname,
    requestSort.sortBy,
    requestSort.sortOrder,
    router,
    searchParams,
    selectedBrands,
    selectedCategories,
    selectedStorageTypes,
  ])

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await getCategories({})
      return result
    },
  })

  // Fetch brands
  const { data: brandsData, isLoading: isLoadingBrands } = useQuery({
    queryKey: ['product-brands'],
    queryFn: async () => {
      const result = await getBrands()
      return result
    },
  })

  // Extract categories and brands for filters
  const categories = useMemo(() => {
    if (!categoriesData) return []
    const data = categoriesData?.data || categoriesData
    if (Array.isArray(data)) {
      return data.map((cat: ProductCategoryEntity | string) => {
        if (typeof cat === 'string') {
          const koreanName = getCategoryKoreanName(cat)
          return { id: cat, label: koreanName, color: "#ff5833" }
        }
        const koreanName = getCategoryKoreanName(cat.name || "")
        return { 
          id: cat.productCategoryNumber || cat.name, 
          label: koreanName, 
          color: "#ff5833" 
        }
      })
    }
    return []
  }, [categoriesData])

  const brands = useMemo(() => {
    if (!brandsData) return []
    const data = brandsData?.data || brandsData
    if (Array.isArray(data)) {
      return data.map((brand: string | { name?: string; brand?: string }) => {
        if (typeof brand === 'string') return brand
        return brand.name || brand.brand || ''
      }).filter(Boolean)
    }
    return []
  }, [brandsData])

  // Fetch products with filters using infinite query
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', debouncedSearchQuery, selectedCategories, selectedBrands, selectedStorageTypes, sortBy, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = {
        page: pageParam,
        limit,
        displayStatus,
      }

      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim()
      }

      if (selectedCategories.length > 0) {
        params.category = selectedCategories.join(',')
      }

      if (selectedBrands.length > 0) {
        params.brand = selectedBrands.join(',')
      }

      if (selectedStorageTypes.length > 0) {
        params.storageMethod = selectedStorageTypes.join(',')
      }

      params.sortBy = requestSort.sortBy
      params.sortOrder = requestSort.sortOrder

      const result = await getProducts(params)
      // Return the full result object to preserve pagination info
      return result
    },
    getNextPageParam: (lastPage, allPages) => {
      // Handle different response structures
      const data = lastPage?.data || lastPage  
      // Check if we have pagination info
      if (data?.totalPages) {
        const currentPage = data?.page || allPages.length
        if (currentPage < data.totalPages) {
          console.log('[MarketPage] Has next page via totalPages', { currentPage, totalPages: data.totalPages, nextPage: currentPage + 1 })
          return currentPage + 1
        }
        console.log('[MarketPage] No more pages via totalPages')
        return undefined
      }
      
      // Fallback: check if last page has full limit of items
      const docs = data?.docs || (Array.isArray(data) ? data : [])
      const lastLength = Array.isArray(docs) ? docs.length : 0
      
      // If we got less than limit items, no more pages
      if (lastLength < limit) {
        console.log('[MarketPage] No more pages - last page has less than limit items', { lastLength, limit })
        return undefined
      }
      
      // Otherwise, return next page number
      const nextPage = allPages.length + 1
      console.log('[MarketPage] Has next page via fallback', { nextPage })
      return nextPage
    },
    initialPageParam: 1,
  })

  const totalFromApi = useMemo(() => {
    const first = productsData?.pages?.[0] as any
    const total = first?.total ?? first?.pagination?.total
    const n = Number(total)
    return Number.isFinite(n) ? n : 0
  }, [productsData?.pages])

  const loadedCountFromApi = useMemo(() => {
    if (!productsData?.pages) return 0
    return productsData.pages.reduce((sum: number, page: any) => {
      const data = page?.data ?? page
      const list = Array.isArray(data) ? data : Array.isArray(data?.docs) ? data.docs : Array.isArray(data?.data) ? data.data : []
      return sum + (Array.isArray(list) ? list.length : 0)
    }, 0)
  }, [productsData?.pages])

  // Process products data from infinite query
  const products = useMemo(() => {
    if (!productsData?.pages) return []
    
    // Flatten all pages into a single array
    const allProducts: ProductEntity[] = []
    productsData.pages.forEach((page) => {
      const data = page?.data || page
      const productList = data?.docs || data?.data || (Array.isArray(data) ? data : [])
      if (Array.isArray(productList)) {
        allProducts.push(...productList)
      }
    })
    
    // Debug: Log raw data count
    console.log(`[MarketPage] Raw products from API:`, {
      total: allProducts.length,
      pages: productsData.pages.length,
      products: allProducts.map(p => ({ id: p.id, name: p.productName, price: p.salePrice || p.productPrice }))
    })
    
    // Deduplicate products by ID
    const uniqueProducts = Array.from(
      new Map(allProducts.map(product => [product.id, product])).values()
    )
    
    // Debug: Log deduplication results
    if (allProducts.length !== uniqueProducts.length) {
      console.log(`[MarketPage] Removed ${allProducts.length - uniqueProducts.length} duplicate products`, {
        before: allProducts.length,
        after: uniqueProducts.length
      })
    }
    
    // Map all products first
    const mappedProducts = uniqueProducts
      .map(mapProductToDisplay)
      .filter(product => product.id && product.id.trim() !== "") // Filter out products without valid IDs
    
    // Debug: Log after mapping
    if (uniqueProducts.length !== mappedProducts.length) {
      console.log(`[MarketPage] Filtered out ${uniqueProducts.length - mappedProducts.length} products without valid IDs`)
    }
    
    // Filter by price range (client-side filtering)
    // More lenient: include products with price 0 or if price is within range
    const filtered = mappedProducts.filter(product => {
      const price = product.salePrice || 0
      // Always include products with price 0 (they might be free or price not set)
      if (price === 0) return true
      // Filter by range for products with valid prices
      return price >= priceRange[0] && price <= priceRange[1]
    })
    
    // Debug: Log if products are being filtered out
    if (mappedProducts.length !== filtered.length) {
      const filteredOut = mappedProducts.filter(p => {
        const price = p.salePrice || 0
        if (price === 0) return false
        return !(price >= priceRange[0] && price <= priceRange[1])
      })
      console.log(`[MarketPage] Filtered ${mappedProducts.length - filtered.length} products by price range`, {
        total: mappedProducts.length,
        displayed: filtered.length,
        priceRange,
        filteredOut: filteredOut.map(p => ({ id: p.id, name: p.name, price: p.salePrice }))
      })
    }
    
    return filtered
  }, [productsData, priceRange])

  // Calculate dynamic max price for slider based on actual product prices
  const maxPrice = useMemo(() => {
    if (!productsData?.pages) return 100000 // Default fallback
    
    // Flatten all pages to get all products
    const allProducts: ProductEntity[] = []
    productsData.pages.forEach((page) => {
      const data = page?.data || page
      const productList = data?.docs || data?.data || (Array.isArray(data) ? data : [])
      if (Array.isArray(productList)) {
        allProducts.push(...productList)
      }
    })
    
    if (allProducts.length === 0) return 100000 // Default fallback
    
    // Find the maximum price from all products
    const maxProductPrice = allProducts.reduce((max: number, product: ProductEntity) => {
      const salePrice = product.salePrice || 0
      const productPrice = product.productPrice || 0
      const consumerPrice = product.consumerPrice || 0
      const currentMax = Math.max(salePrice, productPrice, consumerPrice)
      return Math.max(max, currentMax)
    }, 0)
    
    // Return the actual max price (add 10% buffer for better UX, but use actual max if > 0)
    return maxProductPrice > 0 ? Math.ceil(maxProductPrice * 1.1) : 100000
  }, [productsData])

  // Update price range when maxPrice changes to ensure slider covers all products
  useEffect(() => {
    if (maxPrice > 0 && maxPrice !== 100000) {
      setPriceRange((prevRange) => {
        // Only update if current max is less than the calculated maxPrice
        // This prevents resetting user's filter if they've adjusted it
        if (prevRange[1] < maxPrice) {
          return [prevRange[0], maxPrice]
        }
        return prevRange
      })
    }
  }, [maxPrice])

  const toggleCategory = (categoryId: string) => {
    setCurrentPage(1)
    setSelectedCategories((prev) => {
      // single-select: only one category can be active at a time
      if (prev.includes(categoryId)) return []
      return [categoryId]
    })
  }

  const toggleBrand = (brand: string) => {
    setCurrentPage(1)
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const toggleStorageType = (storageType: string) => {
    setCurrentPage(1)
    setSelectedStorageTypes((prev) => {
      // single-select: only one storage type at a time
      if (prev.includes(storageType)) return []
      return [storageType]
    })
  }

  // Storage types for filter
  const storageTypes = [
    { id: "room", label: t('key108', '상온'), emoji: "", value: "room_temperature" },
    { id: "refrigerated", label: t('key109', '냉장'), emoji: "", value: "refrigerated" },
    { id: "frozen", label: t('key110', '냉동'), emoji: "", value: "frozen" },
  ]

  const isLoading = isLoadingCategories || isLoadingBrands || isLoadingProducts

  const filterContent = (
    <div className="text-black">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-base font-bold mb-3 whitespace-nowrap">{t('key111', '카테고리')}</h3>
        {isLoadingCategories ? (
          <div className="text-xs text-gray-500">{t('key112', '로딩중...')}</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="all-categories"
                checked={selectedCategories.length === 0}
                onCheckedChange={() => {
                  setCurrentPage(1)
                  setSelectedCategories([])
                }}
                className="shrink-0 border-gray-300 data-[state=checked]:bg-[#ff5833] data-[state=checked]:border-[#ff5833]"
              />
              <Label htmlFor="all-categories" className="cursor-pointer whitespace-nowrap">
                <span className="text-xs">{t('key113', '전체 보기')}</span>
              </Label>
            </div>
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                  className="shrink-0 border-gray-300 data-[state=checked]:bg-[#ff5833] data-[state=checked]:border-[#ff5833]"
                />
                <Label htmlFor={category.id} className="cursor-pointer whitespace-nowrap">
                  <span className="text-xs">{category.label}</span>
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Type */}
      <div className="mb-6">
        <h3 className="text-base font-bold mb-3 whitespace-nowrap">{t('key114', '저장 타입')}</h3>
        <div className="space-y-2">
          {storageTypes.map((storage) => (
            <div key={storage.id} className="flex items-center gap-2">
              <Checkbox
                id={storage.id}
                checked={selectedStorageTypes.includes(storage.value)}
                onCheckedChange={() => toggleStorageType(storage.value)}
                className="shrink-0 border-gray-300 data-[state=checked]:bg-[#ff5833] data-[state=checked]:border-[#ff5833]"
              />
              <Label htmlFor={storage.id} className="cursor-pointer whitespace-nowrap">
                <span className="text-xs">{storage.label}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-base font-bold mb-3 whitespace-nowrap">{t('key115', '가격 범위')}</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} max={maxPrice} step={1000} className="mb-3" />
        <div className="flex justify-between text-xs text-gray-600">
          <span className="whitespace-nowrap">{priceRange[0].toLocaleString()}원</span>
          <span className="whitespace-nowrap">{priceRange[1].toLocaleString()}원</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-white">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[240px] shrink-0 bg-white p-5 h-screen sticky top-0 overflow-y-auto border-r border-gray-200">
          {filterContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Search and Sort Bar */}
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <button aria-label="필터" className="lg:hidden shrink-0 flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" title="필터" className="w-[280px] bg-white p-5 overflow-y-auto">
                <div className="mt-8">
                  {filterContent}
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t('key116', '상품명 또는 브랜드를 검색해보세요')}
                value={searchQuery}
                onChange={(e) => {
                  setCurrentPage(1)
                  setSearchQuery(e.target.value)
                }}
                className="w-full pl-9 sm:pl-12 py-2 bg-gray-50 text-gray-900 text-sm rounded-sm border border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-300"
              />
            </div>
          </div>

          {/* Products Header */}
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap truncate">
              총 {productsData?.pages?.[0]?.data?.totalDocs 
                ? t('lengthTotaldocs', '{{length}} / {{totalDocs}}개', { length: products.length, totalDocs: productsData.pages[0].data.totalDocs })
                : `${products.length}개`}
            </span>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setCurrentPage(1)
                setSortBy(value)
              }}
            >
              <SelectTrigger className="w-[120px] sm:w-[160px] bg-white text-gray-900 text-xs sm:text-sm border border-gray-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">{t('key117', '신상품순')}</SelectItem>
                <SelectItem value="price-low">{t('key118', '낮은가격순')}</SelectItem>
                <SelectItem value="price-high">{t('key119', '높은가격순')}</SelectItem>
                <SelectItem value="rating">{t('key120', '평점순')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-400 text-sm">{t('key121', '상품을 불러오는 중...')}</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-400 text-sm">{t('key122', '상품이 없습니다')}</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={createProductNavigationHandler(router, product.id)}
                  >
                    <div className="relative">
                      <ProductCardImage src={product.image || "/placeholder.svg"} alt={product.name} />
                      <div className="absolute bottom-2 left-2 flex gap-1 z-10 flex-wrap pointer-events-none">
                        {product.isHot && (
                          <div className="bg-[#ff5833] text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded flex items-center gap-0.5 whitespace-nowrap">
                            {t('key123', '🔥 특가')}
                          </div>
                        )}
                        {product.productBadges && (
                          <>
                            {product.productBadges.isHotDeal && (
                              <div className="bg-orange-100 text-orange-500 border border-orange-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded whitespace-nowrap">
                                {t('key45', '핫딜')}
                              </div>
                            )}
                            {product.productBadges.isNewProduct && (
                              <div className="bg-blue-100 text-blue-500 border border-blue-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded whitespace-nowrap">
                                {t('key46', '신상품')}
                              </div>
                            )}
                            {product.productBadges.isBestSeller && (
                              <div className="bg-purple-100 text-purple-500 border border-purple-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded whitespace-nowrap">
                                {t('best', 'BEST')}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-4">
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 whitespace-nowrap">{product.category}</p>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">{product.name}</h3>
                      {((product.rating !== undefined && product.rating > 0) || (product.reviews !== undefined && product.reviews > 0)) && (
                        <div className="flex items-center gap-1 mb-2 sm:mb-3">
                          {product.rating !== undefined && product.rating > 0 && (
                            <>
                              <span className="text-yellow-500 text-xs sm:text-sm">★</span>
                              <span className="text-xs sm:text-sm font-medium text-gray-900">{product.rating.toFixed(1)}</span>
                            </>
                          )}
                          {product.reviews !== undefined && product.reviews > 0 && (
                            <span className="text-[10px] sm:text-xs text-gray-500">{t('reviews', '({{reviews}})', { reviews: product.reviews })}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {product.discount > 0 ? (
                          <>
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through whitespace-nowrap">
                              {product.originalPrice.toLocaleString()}원
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold bg-[#ff5833] text-white px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap">{t('discount', '{{discount}}%', { discount: product.discount })}</span>
                          </>
                        ) : null}
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-0.5 sm:mt-1 whitespace-nowrap">
                        {product.discount > 0 ? (
                          <span className="text-[#ff5833]">{product.salePrice.toLocaleString()}원</span>
                        ) : (
                          <span>{product.salePrice.toLocaleString()}원</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              <div className="flex justify-center mt-6 sm:mt-8">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (isFetchingNextPage || !hasNextPage) return
                    await fetchNextPage()
                    setCurrentPage((p) => p + 1)
                  }}
                  disabled={isFetchingNextPage || !hasNextPage}
                  className="rounded-full px-6 sm:px-8 py-4 sm:py-6 bg-white text-gray-900 text-xs sm:text-sm border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap touch-manipulation"
                >
                  {isFetchingNextPage ? (
                    <span>{t('key124', '로딩 중...')}</span>
                  ) : !hasNextPage ? (
                    <span>{t('key125', '모든 상품을 불러왔습니다')}</span>
                  ) : (
                    <><Trans i18nKey="spanClassnamemr1Smmr2spanLoadedcountfromapi"><span className="mr-1 sm:mr-2">+</span>
                      더보기 ({{ loadedCountFromApi }} /</Trans>{totalFromApi || loadedCountFromApi})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
