import { serviceAxios } from "@/lib/axios/axios.client"
import { useCallback } from "react"
import { CreateProductReviewDto, QueryProductReviewsDto } from "./product-review.dto"

export const useProductReview = () => {
    const createProductReview = useCallback(async (dto: CreateProductReviewDto, imageURL?: File) => {
        const formData = new FormData()
        formData.append('productId', dto.productId)
        formData.append('review', dto.review)
        formData.append('rating', dto.rating.toString())
        if (imageURL) {
            formData.append('imageUrl', imageURL)
        }
        const response = await serviceAxios.post('/product-reviews', formData)
        return response.data.data || response.data.data
    }, [])
    const getProductReviews = useCallback(async (dto: QueryProductReviewsDto) => {
        const response = await serviceAxios.get('/product-reviews', { params: dto })
        return response.data.data.items
    }, [])
    const getProductReviewsCount = useCallback(async (productId: string) => {
        const response = await serviceAxios.get(`/product-reviews/count/${productId}`)
        const data = response.data?.data ?? response.data
        // Ensure we return a number
        if (typeof data === 'number') {
            return data
        }
        if (data && typeof data === 'object' && 'count' in data) {
            return Number(data.count) || 0
        }
        return 0
    }, [])

    const getProductReviewsByProductId = useCallback(async (productId: string, page: number, limit: number, sortOrder?: 'asc' | 'desc') => {
        const response = await serviceAxios.get(`/product-reviews/product/${productId}`, {
            params: {
                page,
                limit,
                ...(sortOrder && { sortOrder }),
            }
        })
        return response.data.data.items
    }, [])

    const toggleProductReviewLike = useCallback(async (productReviewId: string) => {
        const response = await serviceAxios.patch(`/product-reviews/${productReviewId}/like`)
        return response.data.data
    }, [])
    
    return { createProductReview, getProductReviews, getProductReviewsCount, getProductReviewsByProductId, toggleProductReviewLike }
}