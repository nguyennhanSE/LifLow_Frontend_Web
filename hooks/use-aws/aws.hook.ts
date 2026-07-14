import { useCallback } from "react"
import { serviceAxios } from "@/lib/axios/axios.client"

export const useAws = () => {
    const uploadFile = useCallback(async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await serviceAxios.post('/aws/upload', formData)
        return response.data.data || response.data
    }, [])
    return { uploadFile }
}