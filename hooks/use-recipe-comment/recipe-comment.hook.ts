import { serviceAxios } from "@/lib/axios/axios.client"
import { CreateRecipeCommentDto, QueryRecipeCommentsDto } from "./recipe-comment.dto"

export const useRecipeComment = () => {
    const getRecipeComments = async (dto: QueryRecipeCommentsDto) => {
        const response = await serviceAxios.get(`/recipe-comments`, { params: dto })
        return response.data.data
    }
    const createRecipeComment = async (dto: CreateRecipeCommentDto) => {
        const response = await serviceAxios.post(`/recipe-comments`, dto)
        return response.data
    }
    return { getRecipeComments, createRecipeComment }
}