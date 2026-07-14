import { DateRange } from 'react-day-picker';
import { serviceAxios } from "@/lib/axios/axios.client"
import { useCallback } from "react"
import { CreateProductDto, CreateProductSpecialOfferDto, ProductListQueryDto, UpdateProductDto } from "./product.dto"
import { Pagination } from '@/utils/common';

export const useProduct = () => {
    const getProducts = useCallback(async (query: ProductListQueryDto) => {
        const response = await serviceAxios.get('/products/list', { params: query })
        const pagination = response.data.data?.pagination
        return {
            data: response.data.data?.data,
            total: response.data.data?.pagination?.total ?? pagination?.total ?? 0,
            pagination: {
                page: pagination?.page ?? query.page ?? 1,
                limit: pagination?.limit ?? query.limit ?? 10,
                total: pagination?.total ?? response.data.total ?? 0,
                totalPages: pagination?.totalPages ?? 1,
            } as Pagination,
        }
    }, [])
    const getProductById = useCallback(async (id: string) => {
        const response = await serviceAxios.get(`/products/${id}`)
        return response.data.data || response.data
    }, [])
    const deleteProduct = useCallback(async (id: string) => {
        const response = await serviceAxios.delete(`/products/${id}`)
        return response.data.data || response.data
    }, [])
    const handleProductSpecialOffer = useCallback(async (id: string, dto: CreateProductSpecialOfferDto) => {
        const response = await serviceAxios.put(`/products/${id}/special-offer`, dto)
        return response.data.data || response.data
    }, [])
    const createProduct = useCallback(async (createProductDto: CreateProductDto, imageRegistrationDetail?: File, imageRegistrationThumbnail?: File, additionalImages?: File[]) => {
        const formData = new FormData()
        
        // Append all fields from createProductDto directly to FormData
        Object.entries(createProductDto).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return // Skip undefined/null values
            }
            
            if (Array.isArray(value)) {
                // For arrays, append each item separately with the same key
                value.forEach((item) => {
                    formData.append(key, String(item))
                })
            } else if (value instanceof Date) {
                // Convert Date to ISO string
                formData.append(key, value.toISOString())
            } else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
                // For objects (like productBadges, specialOffer), convert to JSON string
                formData.append(key, JSON.stringify(value))
            } else {
                // For other types, convert to string
                formData.append(key, String(value))
            }
        })
        
        // Append image files
        if (imageRegistrationDetail) {
            formData.append('imageRegistrationDetail', imageRegistrationDetail)
        }
        if (imageRegistrationThumbnail) {
            formData.append('imageRegistrationThumbnail', imageRegistrationThumbnail)
        }
        if (additionalImages) {
            additionalImages.forEach((image) => {
                formData.append('additionalImages', image)
            })
        }
        
        const response = await serviceAxios.post('/products', formData)
        return response.data.data || response.data
    }, [])
    
    const getSpecialOffers = useCallback(async (dto : ProductListQueryDto) => {
        const response = await serviceAxios.get('/products/special-offers', { params: dto })
        return response.data.data
    }, [])

    const getBrands = useCallback(async () => {
        const response = await serviceAxios.get('/products/brands/list')
        return response.data.data || response.data
    }, [])


    const updateProductById = useCallback(async (id: string, updateProductDto: UpdateProductDto, imageRegistrationDetail?: File, imageRegistrationThumbnail?: File, additionalImages?: File[]) => {
        const formData = new FormData()
        
        // Append all fields from updateProductDto to FormData
        Object.entries(updateProductDto).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return // Skip undefined/null values
            }
            
            if (Array.isArray(value)) {
                // For arrays, append each item separately with the same key
                value.forEach((item) => {
                    formData.append(key, String(item))
                })
            } else if (value instanceof Date) {
                // Convert Date to ISO string
                formData.append(key, value.toISOString())
            } else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
                // For objects (like productBadges, specialOffer), convert to JSON string
                formData.append(key, JSON.stringify(value))
            } else {
                // For other types, convert to string
                formData.append(key, String(value))
            }
        })
        
        // Append image files
        if (imageRegistrationDetail) {
            formData.append('imageRegistrationDetail', imageRegistrationDetail)
        }
        if (imageRegistrationThumbnail) {
            formData.append('imageRegistrationThumbnail', imageRegistrationThumbnail)
        }
        if (additionalImages) {
            additionalImages.forEach((image) => {
                formData.append('additionalImages', image)
            })
        }
        
        const response = await serviceAxios.patch(`/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data.data || response.data
    }, [])

    const createSpecialOffer = useCallback(async (id: string, dto: CreateProductSpecialOfferDto) => {
        const response = await serviceAxios.put(`/products/${id}/special-offer`, dto)
        return response.data.data || response.data
    }, [])

    const deleteSpecialOffer = useCallback(async (id: string) => {
        const response = await serviceAxios.delete(`/products/${id}/special-offer`)
        return response.data.data || response.data
    }, [])
    return {
        getProducts,
        getProductById,
        deleteProduct,
        handleProductSpecialOffer,
        createProduct,
        getSpecialOffers,
        getBrands,
        updateProductById,
        deleteSpecialOffer,
        createSpecialOffer,
    }
}