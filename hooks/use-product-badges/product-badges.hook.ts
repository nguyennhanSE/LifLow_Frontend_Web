import { useCallback } from "react"

import { serviceAxios } from "@/lib/axios/axios.client"
import { CreateProductBadgeDto, UpdateProductBadgeDto } from "./product-badges.dto"

export const useProductBadges = () => {
    const createProductBadge = useCallback(async (dto: CreateProductBadgeDto) => {
        const response = await serviceAxios.post('/product-badges', dto)
        return response.data.data || response.data
    }, [])
    const updateProductBadgeByProductId = useCallback(async (productId: string, dto: UpdateProductBadgeDto) => {
        const response = await serviceAxios.patch(`/product-badges/${productId}`, dto)
        return response.data.data || response.data
    }, [])

    return { createProductBadge, updateProductBadgeByProductId }
}