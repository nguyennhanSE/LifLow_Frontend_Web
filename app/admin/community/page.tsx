'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, FileText, Plus, Search, Trash2, Check, X, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useRecipe } from '@/hooks/use-recipe/recipt.hook'
import { ERecipeCategory, Recipe } from '@/entities/recipes/recipe.entity'
import { PaginationButton } from '@/components/common/PaginationButton'
import RecipeModal from '@/components/common/admin/RecipeModal'
import { User } from '@/entities/user.entity'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminCommunityPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [debouncedCategory, setDebouncedCategory] = useState('')
  const [selectedSort, setSelectedSort] = useState('latest')
  const [debouncedSort, setDebouncedSort] = useState('latest')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const { getRecipes, getRecipeDashboard, getRecipeCategories, activateRecipe, deactivateRecipe, deleteRecipe, approveRecipe, rejectRecipe } = useRecipe()

  // Fetch dashboard stats
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['recipe-dashboard'],
    queryFn: async () => {
      return await getRecipeDashboard()
    },
  })

  // Fetch points history (포인트 적립/사용 내역)
  // const { data: pointsHistory = [], isLoading: isLoadingPoints } = useQuery<PointTransaction[]>({
  //   queryKey: ['recipe-points-history'],
  //   queryFn: getRecipePointsHistory,
  // })

  // Map sort option to sortBy string: 최신순→createdAt, 조회수→views, 제목순→alphabetical
  const getSortBy = (sort: string): string => {
    switch (sort) {
      case 'latest':
        return 'createdAt'
      case 'views':
        return 'views'
      case 'alphabetical':
        return 'alphabetical'
      default:
        return 'createdAt'
    }
  }

  // Paginated query for recipes
  const limit = 10
  const {
    data: recipesResponse,
    isLoading: isLoadingRecipes,
    isError: isErrorRecipes,
    error: recipesError,
    refetch,
  } = useQuery({
    queryKey: [
      'recipes',
      debouncedQuery,
      debouncedCategory,
      debouncedSort,
      activeTab,
      currentPage,
    ],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit,
      }
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim()
      if (debouncedCategory && debouncedCategory !== 'entire') params.category = debouncedCategory
      const sortBy = getSortBy(debouncedSort)
      if (sortBy) params.sortBy = sortBy
      params.order = debouncedSort === 'alphabetical' ? 'asc' : 'desc'
      if (activeTab === 'pending') params.status = 'pending'
      else if (activeTab === 'approved') params.status = 'approved'
      else if (activeTab === 'rejected') params.status = 'rejected'
      return await getRecipes(params as Parameters<typeof getRecipes>[0])
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  })

  const allRecipes = (recipesResponse?.data ?? []) as Recipe[]
  const pagination = recipesResponse?.pagination

  // Debounce keyword query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Debounce category filter
  useEffect(() => {
    setDebouncedCategory(selectedCategory)
  }, [selectedCategory])

  useEffect(() => {
    const fetchCategories = async () => {
      const categories = await getRecipeCategories()
      setAllCategories(categories?.data?.map((category: any) => category))
      }
      fetchCategories()
    }, [getRecipeCategories])
  // Debounce sort filter
  useEffect(() => {
    setDebouncedSort(selectedSort)
  }, [selectedSort])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery, debouncedCategory, debouncedSort, activeTab])

  const handleDeleteRecipe = async () => {
    await deleteRecipe(selectedRecipe?.id as string)
    setSelectedRecipe(null)
  }
  const handleActivateRecipe = async () => {
    await activateRecipe(selectedRecipe?.id as string)
    setSelectedRecipe(null)
    await refetch()
  }
  const handleDeactivateRecipe = async () => {
    await deactivateRecipe(selectedRecipe?.id as string)
    setSelectedRecipe(null)
    await refetch()
  }
  const handleCorrectRecipe = async () => {
    router.push(`/admin/community/${selectedRecipe?.id}`)
    await refetch()
  }
  return (
    <>
    {selectedRecipe && <RecipeModal open={true} setOpen={() => setSelectedRecipe(null)} recipeDetail={selectedRecipe} author={selectedRecipe.author as User} deleteRecipe={handleDeleteRecipe} activateRecipe={handleActivateRecipe} deactivateRecipe={handleDeactivateRecipe} correctRecipe={handleCorrectRecipe} />}
    <div className="space-y-6">
      {/* Header */}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">레시피 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            사용자가 업로드한 레시피를 관리합니다 (삭제/비활성화 가능)
          </p>
        </div>
        <Button size="lg" className="bg-black text-white hover:bg-black/90" asChild>
          <Link href="/admin/community/create">
            <Plus className="mr-2 h-5 w-5" />
            레시피 추가
          </Link>
        </Button>
      </section>

      {/* Status Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div 
          className={`bg-card hover:shadow-sm rounded-lg border p-5 transition-shadow cursor-pointer ${
            activeTab === 'all' ? 'border-primary border-2' : 'border-border'
          }`}
          onClick={() => setActiveTab('all')}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-muted-foreground">전체</p>
              <p className="text-2xl font-semibold text-foreground">
                {isLoadingDashboard ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  dashboardData?.fullRecipeCount || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-card hover:shadow-sm rounded-lg border p-5 transition-shadow cursor-pointer ${
            activeTab === 'pending' ? 'border-primary border-2' : 'border-border'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-100 p-2.5 text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-muted-foreground">승인 대기</p>
              <p className="text-2xl font-semibold text-foreground">
                {isLoadingDashboard ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  dashboardData?.pendingRecipeCount || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-card hover:shadow-sm rounded-lg border p-5 transition-shadow cursor-pointer ${
            activeTab === 'approved' ? 'border-primary border-2' : 'border-border'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-muted-foreground">승인 완료</p>
              <p className="text-2xl font-semibold text-foreground">
                {isLoadingDashboard ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  dashboardData?.activeRecipeCount || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-card hover:shadow-sm rounded-lg border p-5 transition-shadow cursor-pointer ${
            activeTab === 'rejected' ? 'border-primary border-2' : 'border-border'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-100 p-2.5 text-red-600">
              <X className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-muted-foreground">반려 완료</p>
              <p className="text-2xl font-semibold text-foreground">
                {isLoadingDashboard ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  dashboardData?.rejectedRecipeCount || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="bg-card border-border rounded-lg border p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">검색 및 필터</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Search */}
          <div className="space-y-2 lg:col-span-5">
            <Label className="text-sm font-medium">검색</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="제목, 작성자, 내용으로 검색"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2 lg:col-span-3">
            <Label className="text-sm font-medium">카테고리</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entire">전체</SelectItem>
                {allCategories.map((category,index) => (
                  <SelectItem key={index} value={category}>{category === ERecipeCategory.RECIPE ? '레시피' : category === ERecipeCategory.REVIEWS ? '리뷰' : category === ERecipeCategory.DAILY_LIFE ? '일상' : 'N/A'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-2 lg:col-span-4">
            <Label className="text-sm font-medium">정렬</Label>
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="최신순" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="views">조회수순</SelectItem>
                <SelectItem value="alphabetical">제목순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('entire')
              setSelectedSort('latest')
            }}
          >
            초기화
          </Button>
        </div>
      </section>

      {/* 포인트 적립/사용 내역 - theo availablePointsIncrease / availablePointsDeduction */}
      {/* <section className="bg-card border-border rounded-lg border p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground flex items-center gap-2">
          <Gift className="h-5 w-5 text-muted-foreground" />
          포인트 적립/사용 내역
        </h2>
        {isLoadingPoints ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : pointsHistory.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">포인트 내역이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs font-medium text-muted-foreground">
                  <th className="p-3 text-left">일자</th>
                  <th className="p-3 text-left">사용자</th>
                  <th className="p-3 text-left">내용</th>
                  <th className="p-3 text-right">적립</th>
                  <th className="p-3 text-right">사용</th>
                  <th className="p-3 text-right">잔액</th>
                </tr>
              </thead>
              <tbody>
                {pointsHistory.map((row) => (
                  <tr key={row.id} className="border-border border-t hover:bg-muted/20">
                    <td className="p-3 text-foreground">
                      {row.date ? format(new Date(row.date), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="p-3 text-foreground">{row.userId ?? '-'}</td>
                    <td className="p-3 text-foreground">{row.content ?? '-'}</td>
                    <td className="p-3 text-right font-medium text-green-600">
                      {row.availablePointsIncrease != null && row.availablePointsIncrease > 0
                        ? `+${row.availablePointsIncrease.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="p-3 text-right font-medium text-red-600">
                      {row.availablePointsDeduction != null && row.availablePointsDeduction > 0
                        ? `-${row.availablePointsDeduction.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="p-3 text-right text-foreground">
                      {row.availablePointsBalance != null ? row.availablePointsBalance.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section> */}

      {/* Recipe Table */}
      <section className="bg-card border-border rounded-lg border">
        {/* Tabs */}
        <div className="border-border px-6 py-3 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              전체 ({isLoadingDashboard ? '...' : dashboardData?.fullRecipeCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              승인 대기 ({isLoadingDashboard ? '...' : dashboardData?.pendingRecipeCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              승인됨 ({isLoadingDashboard ? '...' : dashboardData?.activeRecipeCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              거부됨 ({isLoadingDashboard ? '...' : dashboardData?.rejectedRecipeCount || 0})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr className="text-xs font-medium text-muted-foreground">
                <th className="w-24 p-4 text-left">썸네일</th>
                <th className="p-4 text-left">제목</th>
                <th className="p-4 text-left">작성자</th>
                <th className="p-4 text-left">카테고리</th>
                <th className="p-4 text-left">작성일</th>
                <th className="p-4 text-left">조회수</th>
                <th className="p-4 text-center">상태</th>
                <th className="p-4 text-center">노출</th>
                <th className="p-4 text-left">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isErrorRecipes ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-red-500">
                    오류가 발생했습니다: {recipesError instanceof Error ? recipesError.message : '알 수 없는 오류'}
                  </td>
                </tr>
              ) : isLoadingRecipes ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>로딩 중...</span>
                    </div>
                  </td>
                </tr>
              ) : allRecipes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-muted-foreground">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                allRecipes.map((recipe) => (
                  <tr
                    key={recipe.id}
                    className="border-border border-t transition-colors hover:bg-muted/20"
                  >
                    <td className="p-4">
                      <img
                        src={
                          Array.isArray(recipe.thumbnailUrl) && recipe.thumbnailUrl.length > 0
                            ? recipe.thumbnailUrl[0]
                            : typeof recipe.thumbnailUrl === 'string'
                            ? recipe.thumbnailUrl
                            : '/placeholder.svg'
                        }
                        alt={recipe.title || 'Recipe'}
                        className="h-12 w-12 rounded-md border border-border object-cover"
                      />
                    </td>
                    <td className="p-4 font-medium text-foreground">{recipe.title || 'N/A'}</td>
                    <td className="p-4 text-foreground">{recipe.authorName || recipe.author?.name || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          recipe.category === ERecipeCategory.RECIPE
                            ? 'bg-blue-100 text-blue-700'
                            : recipe.category === ERecipeCategory.REVIEWS
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {recipe.category || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-foreground">
                      {recipe.dateOfWriting 
                        ? format(new Date(recipe.dateOfWriting), 'yyyy-MM-dd')
                        : recipe.createdAt
                        ? format(new Date(recipe.createdAt), 'yyyy-MM-dd')
                        : 'N/A'}
                    </td>
                    <td className="p-4 text-foreground">
                      {(recipe.views || 0).toLocaleString('en-US')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium leading-none ${
                            recipe.status === 'approved' || recipe.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : recipe.status === 'pending'
                                ? 'bg-orange-100 text-orange-700'
                                : recipe.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {recipe.status === 'approved' || recipe.status === 'active'
                            ? '승인됨'
                            : recipe.status === 'pending'
                              ? '승인 대기'
                              : recipe.status === 'rejected'
                                ? '거부됨'
                                : '비활성'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium leading-none ${
                            recipe.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {recipe.isActive ? '노출' : '비노출'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* 1. Activate/Deactivate */}
                        <Button
                          onClick={async () => {
                            if (recipe.isActive) {
                              await deactivateRecipe(recipe.id as string)
                            } else {
                              await activateRecipe(recipe.id as string)
                            }
                            await refetch()
                          }}
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            recipe.isActive
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                          title={recipe.isActive ? '비활성화' : '활성화'}
                        >
                          {recipe.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        {/* 2. Recipe Detail */}
                        <Button
                          onClick={() => {
                            router.push(`/admin/community/${recipe.id}`)
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="상세보기"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {/* 3. Approve */}
                        {recipe.status === 'pending' && <Button
                          onClick={async () => {
                            await approveRecipe(recipe.id as string)
                            await refetch()
                            await refetchDashboard()
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="승인"
                        >
                          <Check className="h-4 w-4" />
                        </Button>}
                        {/* 4. Reject */}
                        {recipe.status === 'pending' && <Button
                          onClick={async () => {
                            await rejectRecipe(recipe.id as string)
                            await refetch()
                            await refetchDashboard()
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="반려"
                        >
                          <X className="h-4 w-4" />
                        </Button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="border-border flex items-center justify-between border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">전체 {pagination?.total ?? allRecipes.length}개의 레시피</p>
          {pagination && (
            <PaginationButton
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </section>
    </div>
    </>
  )
}




