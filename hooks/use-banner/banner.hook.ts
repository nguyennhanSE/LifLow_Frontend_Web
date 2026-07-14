import { EBannerType } from "@/entities/banner/banner.entity"
import { serviceAxios } from "@/lib/axios/axios.client"
import { useCallback } from "react"
import { CreateBannerDto, ECategoryType, UpdateBannerDto } from "./banner.dto"
export const useBanner = () => {
  const getBannersByType = useCallback(async (type: EBannerType) => {
    const response = await serviceAxios.get(`/banners/type/${type}`)
    const bannerData = response.data.data
    return bannerData
  }, [])
  const createBanner = useCallback(async (dto: CreateBannerDto) => {
    const response = await serviceAxios.post('/banners', dto)
    return response.data.data || response.data
  }, [])
  const updateBanner = useCallback(async (id: string, dto: UpdateBannerDto) => {
    const response = await serviceAxios.patch(`/banners/${id}`, dto)
    return response.data.data || response.data
  }, [])    
  const getBannerByCategory = useCallback(async (category: ECategoryType | 'ALL') => {
    const response = await serviceAxios.get(`/banners/category/${category}`)
    return response.data.data[0];
  }, [])

  const updateBannerImageById = useCallback(async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await serviceAxios.patch(`/banners/update-image-url/${id}`, formData)
    return response.data.data
  }, [])
  return {
    getBannersByType,
    createBanner,
    updateBanner,
    getBannerByCategory,
    updateBannerImageById,
  }
}