import { serviceAxios } from "@/lib/axios/axios.client"
import { CategoryFilterDto } from "./category.dto"
import { useCallback } from "react"

export const useCategory = () => {
    const getCategories = useCallback(async (query: CategoryFilterDto) => {
        const response = await serviceAxios.get('/categories/list', { params: query })
        return response.data.data || response.data
    }, [])
    return {
        getCategories,
    }
}