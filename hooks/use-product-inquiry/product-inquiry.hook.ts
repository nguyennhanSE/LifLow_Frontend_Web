import { useCallback } from "react"

import { CreateProductInquiryAnswerDto, CreateProductInquiryDto, QueryProductInquiriesDto } from "./product-inquiry.dto"
import { serviceAxios } from "@/lib/axios/axios.client"

export const useProductInquiry = () => {
    const createProductInquiry = useCallback(async (dto: CreateProductInquiryDto) => {
        const response = await serviceAxios.post('/product-inquiries', dto)
        return response.data.data || response.data
    }, [])
    const getProductInquiries = useCallback(async (dto: QueryProductInquiriesDto) => {
        const response = await serviceAxios.get('/product-inquiries', { params: dto })
        const data = response.data?.data ?? response.data
        const items = data?.items ?? (Array.isArray(data) ? data : [])
        const meta = data?.meta ?? null
        return { items, meta }
    }, [])
    const getProductInquiryById = useCallback(async (inquiryId: string) => {
        const response = await serviceAxios.get(`/product-inquiries/${inquiryId}`)
        return response.data.data || response.data
    }, [])
    const createProductInquiryAnswer = useCallback(async (inquiryId: string, dto: CreateProductInquiryAnswerDto) => {
        const response = await serviceAxios.post(`/product-inquiries/${inquiryId}/answers`, dto)
        return response.data.data || response.data
    }, [])  
    const getProductInquiryCount = useCallback(async (productId: string) => {
        const response = await serviceAxios.get(`/product-inquiries/product/${productId}/count`)
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
    const getProductInquiryDashboard = useCallback(async () => {
        const response = await serviceAxios.get(`/product-inquiries/dashboard`)
        return response.data.data || response.data
    }, [])

    const updateProductInquiryAnswer = useCallback(async (inquiryId: string, answerId: string, answer: string) => {
        const response = await serviceAxios.patch(`/product-inquiries/${inquiryId}/answers/${answerId}`, { answer })
        return response.data.data || response.data
    }, [])

    const getNumberOfProductInquiries = useCallback(async (productId: string) => {
        const response = await serviceAxios.get(`/product-inquiries/number-of-inquiries`)
        return response.data.data || response.data
    }, [])
    return { createProductInquiry, getProductInquiries, createProductInquiryAnswer, getProductInquiryCount, getProductInquiryDashboard, getProductInquiryById, updateProductInquiryAnswer, getNumberOfProductInquiries }
}