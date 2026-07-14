"use client"

import { Clock, Eye, MessageCircle, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useUser } from "@/hooks/use-user/user.hook"
import { useRecipe } from "@/hooks/use-recipe/recipt.hook"
import { Recipe } from "@/entities/recipes/recipe.entity"
import { useTranslation } from 'react-i18next'

type FilterType = "all" | "active" | "hidden"

export default function MyPageRecipe() {
  const { t } = useTranslation()
  const { getMyRecipe } = useUser()
  const { updateRecipeIsActive } = useRecipe()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true)
      const query: { page: number; limit: number; isActive?: boolean } = { page: 1, limit: 100 }
      if (filter === "active") query.isActive = true
      if (filter === "hidden") query.isActive = false
      const data = await getMyRecipe(query)
      setRecipes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
    } finally {
      setLoading(false)
    }
  }, [getMyRecipe, filter])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  const handleSetActive = useCallback(async (e: React.MouseEvent, recipeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      setUpdatingId(recipeId)
      await updateRecipeIsActive(recipeId, true) // gửi isActive = true
      setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, isActive: true } : r)))
    } catch (error) {
      console.error("Failed to activate recipe:", error)
    } finally {
      setUpdatingId(null)
    }
  }, [updateRecipeIsActive])

  const handleSetHidden = useCallback(async (e: React.MouseEvent, recipeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      setUpdatingId(recipeId)
      await updateRecipeIsActive(recipeId, false) // gửi isActive = false
      setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, isActive: false } : r)))
    } catch (error) {
      console.error("Failed to deactivate recipe:", error)
    } finally {
      setUpdatingId(null)
    }
  }, [updateRecipeIsActive])

  // Stats by isActive (활성 = isActive true, 숨김 = isActive false)
  const totalRecipes = recipes.length
  const activeRecipes = recipes.filter((r) => r.isActive === true).length
  const hiddenRecipes = recipes.filter((r) => r.isActive === false).length

  const filteredRecipes = recipes.filter((recipe) => {
    if (filter === "all") return true
    if (filter === "active") return recipe.isActive === true
    if (filter === "hidden") return recipe.isActive === false
    return true
  })

  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("en-CA") // YYYY-MM-DD format
  }

  // Category display mapping (RECIPE, REVIEWS, DAILY_LIFE -> Korean)
  const getCategoryLabel = (category: string | undefined) => {
    const map: Record<string, string> = {
      RECIPE: "레시피",
      REVIEWS: "리뷰",
      DAILY_LIFE: "일상",
    }
    return category ? map[category] ?? category : "레시피"
  }

  // Status display mapping (approved, pending, rejected -> Korean)
  const getStatusLabel = (status: string | undefined) => {
    const map: Record<string, string> = {
      approved: "승인됨",
      pending: "대기중",
      rejected: "거절됨",
    }
    return status ? map[status] ?? status : "대기중"
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "approved": return "bg-[#00a63e]"
      case "pending": return "bg-gray-500"
      case "rejected": return "bg-red-500"
      default: return "bg-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <p className="text-gray-500">{t('key233', '레시피 불러오는 중...')}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-normal">{t('key229', '내가 쓴 레시피')}</h1>
        <Link
          href="/community/create"
          className="flex items-center gap-2 rounded-md bg-[#ff5833] px-6 py-3 text-white transition-colors hover:bg-[#e64d2e]"
        >
          <Plus className="h-5 w-5" />
          {t('key234', '레시피 작성')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="mb-2 text-sm text-gray-500">{t('key235', '전체 레시피')}</p>
          <p className="text-4xl font-normal">{totalRecipes}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="mb-2 text-sm text-gray-500">{t('key236', '활성')}</p>
          <p className="text-4xl font-normal text-[#00a63e]">{activeRecipes}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="mb-2 text-sm text-gray-500">{t('key237', '숨김')}</p>
          <p className="text-4xl font-normal text-gray-400">{hiddenRecipes}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`border-r border-gray-200 px-6 py-4 text-center font-medium transition-colors ${
            filter === "all" ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"
          }`}
        >{t('totalrecipes', '전체 ({{totalRecipes}})', { totalRecipes })}</button>
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`border-r border-gray-200 px-6 py-4 text-center font-medium transition-colors ${
            filter === "active" ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"
          }`}
        >{t('activerecipes', '활성 ({{activeRecipes}})', { activeRecipes })}</button>
        <button
          type="button"
          onClick={() => setFilter("hidden")}
          className={`px-6 py-4 text-center font-medium transition-colors ${
            filter === "hidden" ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"
          }`}
        >{t('hiddenrecipes', '숨김 ({{hiddenRecipes}})', { hiddenRecipes })}</button>
      </div>

      {/* Recipe Cards */}
      {filteredRecipes.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <p className="text-gray-500">{t('key238', '레시피가 없습니다')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
            >
              <Link href={`/community/main/${recipe.id}`} className="block">
                {/* Recipe Image */}
                <div className="relative h-64 w-full">
                  <Image
                    src={recipe?.thumbnailUrl?.[0] || "/placeholder.jpg"}
                    alt={recipe.title || "Recipe"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute left-3 top-3">
                    <span className="rounded bg-[#ff5833] px-3 py-1 text-sm font-medium text-white">
                      {getCategoryLabel(recipe.category)}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3">
                    <span
                      className={`rounded px-3 py-1 text-sm font-medium text-white ${getStatusColor(recipe.status)}`}
                    >
                      {getStatusLabel(recipe.status)}
                    </span>
                  </div>
                </div>

                {/* Recipe Content */}
                <div className="p-6">
                  <h3 className="mb-3 text-lg font-medium">{recipe.title || "제목 없음"}</h3>
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
                    {recipe.content || "설명이 없습니다"}
                  </p>

                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                      <span className="font-medium">{t('key239', '재료:')} </span>
                      {recipe.ingredients.join(", ")}
                    </div>
                  )}

                  <div className="mb-4 flex items-center gap-4 border-b border-gray-200 pb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{recipe.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{recipe.recipeComments?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(recipe.dateOfWriting)}</span>
                  </div>
                </div>
              </Link>

              {/* 활성 / 숨김 buttons: 활성 = isActive true, 숨김 = isActive false */}
              {/* <div className="flex gap-2 border-t border-gray-200 p-4">
                <button
                  type="button"
                  onClick={(e) => handleSetActive(e, recipe.id)}
                  disabled={updatingId === recipe.id || recipe.isActive === true}
                  className="flex-1 rounded-md bg-[#00a63e] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[#008f35]"
                >
                  {updatingId === recipe.id ? "처리 중..." : "활성"}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSetHidden(e, recipe.id)}
                  disabled={updatingId === recipe.id || recipe.isActive === false}
                  className="flex-1 rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-gray-500"
                >
                  {updatingId === recipe.id ? "처리 중..." : "숨김"}
                </button>
              </div> */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

