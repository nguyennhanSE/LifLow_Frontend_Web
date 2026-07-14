import { Coupon } from "@/entities/coupons/coupon.entity"
import { serviceAxios } from "@/lib/axios/axios.client"
import { ResponseModel } from "@/models/ResponseModel"
import { useCallback } from "react"
import { CreateCouponDto, QueryCouponDto, UpdateCouponDto } from "./coupon.dto"

export const useCoupon = () => {
    const getCoupons = useCallback(async (params: QueryCouponDto) => {
        const response = await serviceAxios.get('/coupons/list', { params })
        return response.data.data || response.data
    }, [])
    const getCouponById = useCallback(async (id: string) => {   
        const response = await serviceAxios.get(`/coupons/${id}`)
        console.log('getCouponById', response.data)
        return response.data.data || response.data
    }, [])
    const createCoupon = useCallback(async (coupon: CreateCouponDto) => {
        try {
            const response = await serviceAxios.post('/coupons', coupon)
            return response.data.data || response.data
        } catch (error) {
            const model = new ResponseModel(error as any)
            throw new Error(model.getMessage())
        }
    }, [])
    const updateCoupon = useCallback(async (id: string, coupon: UpdateCouponDto) => {
        const response = await serviceAxios.patch(`/coupons/${id}`, coupon)
        return response.data.data || response.data
    }, [])
    const deleteCoupon = useCallback(async (id: string) => {
        const response = await serviceAxios.delete(`/coupons/${id}`)
        return response.data.data || response.data
    }, [])
    const getCouponDashboard = useCallback(async () => {
        const response = await serviceAxios.get(`/coupons/meta/dashboard`)
        return response.data.data || response.data
    }, [])
    return { getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, getCouponDashboard }
}