import { AnnouncementEntity } from "@/entities/announcements/announcements.entity"
import { AnnouncementListResponse, CreateAnnouncementDto, QueryAnnouncementDto, UpdateAnnouncementDto } from "./announcement.dto"
import { serviceAxios } from "@/lib/axios/axios.client"
import { useCallback } from "react"

export const useAnnouncement = () => {
    const getAnnouncements = useCallback(async (dto: QueryAnnouncementDto): Promise<AnnouncementListResponse> => {
        dto.status = 'active'
        const response = await serviceAxios.get('/announcements', { params: dto })
        const payload = response.data.data
        return {
            data: payload?.data ?? [],
            pagination: {
                total: payload?.total ?? 0,
                page: payload?.page ?? 1,
                limit: payload?.limit ?? 10,
                totalPages: payload?.totalPages ?? 0,
            },
        }
    }, [])
    const createAnnouncement = useCallback(async (announcement: CreateAnnouncementDto, imageFile?: File) => {
        const formData = new FormData()
        formData.append('title', announcement.title || '')
        formData.append('authorName', announcement.authorName || '')
        formData.append('type', announcement.type || '')
        formData.append('content', announcement.content || '')
        if (announcement.isFixed !== undefined) {
            formData.append('isFixed', announcement.isFixed as any)
        }
        if (announcement.status) {
            formData.append('status', announcement.status)
        }
        if (imageFile) {
            formData.append('image', imageFile)
        }
        const response = await serviceAxios.post('/announcements', formData)
        return response.data.data 
    }, [])
    const deleteAnnouncementById = useCallback(async (id: string) => {
        const response = await serviceAxios.delete(`/announcements/${id}`)
        return response.data.data 
    }, [])
    const updateAnnouncementById = useCallback(async (id: string, announcement: UpdateAnnouncementDto, imageFile?: File) => {
        const formData = new FormData()
        formData.append('title', announcement.title || '')
        formData.append('authorName', announcement.authorName || '')
        formData.append('type', announcement.type || '')
        formData.append('content', announcement.content || '')
        if (announcement.isFixed !== undefined) {
            formData.append('isFixed', announcement.isFixed as any)
        }
        if (announcement.status) {
            formData.append('status', announcement.status)
        }
        if (imageFile) {
            formData.append('image', imageFile)
        }
        const response = await serviceAxios.patch(`/announcements/${id}`, formData)
        return response.data.data 
    }, [])

    const addAnnouncementView = useCallback(async (id: string) => {
        const response = await serviceAxios.patch(`/announcements/${id}/add-view`)
        return response.data.data 
    }, [])
    return {
        getAnnouncements,
        createAnnouncement,
        deleteAnnouncementById,
        updateAnnouncementById,
        addAnnouncementView
    }
}