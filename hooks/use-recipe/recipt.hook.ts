import { useCallback } from "react";
import { serviceAxios } from "@/lib/axios/axios.client";
import { CreateRecipeDto, PointTransaction, RecipeListQueryDto, RecipeListResponse, UpdateRecipeDto } from "./recipe.dto";

export const useRecipe = () => {
    const getRecipes = useCallback(async (query: RecipeListQueryDto): Promise<RecipeListResponse> => {
        const response = await serviceAxios.get('/recipe/list', { params: query });
        const payload = response.data.data;
        return {
            data: payload?.data ?? [],
            pagination: payload?.pagination ?? {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        };
    }, []);
    const getRecipeDashboard = useCallback(async () => {
        const response = await serviceAxios.get('/recipe/meta/dashboard');
        return response.data.data;
    }, []);
    const getRecipeCategories = useCallback(async () => {
        const response = await serviceAxios.get('/recipe/meta/categories');
        return response.data.data;
    }, []);
    const getRecipeById = useCallback(async (id: string) => {
        const response = await serviceAxios.get(`/recipe/${id}`);
        return {recipeDetail: response.data.data.data, author: response.data.data.data.author};
    }, []);
    const activateRecipe = useCallback(async (id: string) => {
        const response = await serviceAxios.patch(`/recipe/${id}/activate`);
        return response.data.data;
    }, []);
    const deactivateRecipe = useCallback(async (id: string) => {
        const response = await serviceAxios.patch(`/recipe/${id}/deactivate`);
        return response.data.data;
    }, []);

    /** PATCH /recipe/:id with body { isActive: true | false } */
    const updateRecipeIsActive = useCallback(async (id: string, isActive: boolean) => {
        const response = await serviceAxios.patch(`/recipe/${id}`, { isActive });
        return response.data.data;
    }, []);
    const deleteRecipe = useCallback(async (id: string) => {
        const response = await serviceAxios.delete(`/recipe/${id}`);
        return response.data.data;
    }, []);
    const approveRecipe = useCallback(async (id: string) => {
        const response = await serviceAxios.patch(`/recipe/${id}/approve`);
        return response.data.data;
    }, []);
    const rejectRecipe = useCallback(async (id: string) => {
        const response = await serviceAxios.patch(`/recipe/${id}/reject`);
        return response.data.data;
    }, []);
    const createRecipe = useCallback(async (recipe: CreateRecipeDto, thumbnails?: File[]) => {
        const formData = new FormData()
        Object.entries(recipe).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return // Skip undefined/null values
            }
            
            if (Array.isArray(value)) {
                // For arrays, append each element separately with the same key
                // This allows the backend to receive it as an array
                value.forEach((item) => {
                    formData.append(key, String(item))
                })
            } else if (value instanceof Date) {
                // Convert Date to ISO string
                formData.append(key, value.toISOString())
            } else {
                // For other types, convert to string
                formData.append(key, String(value))
            }
        })
        if (thumbnails) {
            thumbnails.forEach((thumbnail) => {
                formData.append('thumbnail', thumbnail)
            })
        }
        const response = await serviceAxios.post('/recipe', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }, []);
    const updateRecipe = useCallback(async (id: string, recipe: UpdateRecipeDto, thumbnails?: File[]) => {
        const formData = new FormData()
        Object.entries(recipe).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return // Skip undefined/null values
            }
            
            if (Array.isArray(value)) {
                // For arrays, append each element separately with the same key
                // This allows the backend to receive it as an array
                value.forEach((item) => {
                    formData.append(key, String(item))
                })
            } else if (value instanceof Date) {
                // Convert Date to ISO string
                formData.append(key, value.toISOString())
            } else {
                // For other types, convert to string
                formData.append(key, String(value))
            }
        })
        if (thumbnails) {
            thumbnails.forEach((thumbnail) => {
                formData.append('thumbnail', thumbnail)
            })
        }
        const response = await serviceAxios.patch(`/recipe/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }, []);
    const getRecipePointsHistory = useCallback(async (): Promise<PointTransaction[]> => {
        try {
            const response = await serviceAxios.get('/recipe/points-history');
            const data = response.data?.data ?? response.data;
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }, []);

    const toggleRecipeLike = useCallback(async (id: string) => {
        const response = await serviceAxios.patch(`/recipe/${id}/like`);
        return response.data.data;
    }, []);

    const getRecipeForAdmin = useCallback(async (id: string) => {
        const response = await serviceAxios.get(`/recipe/for-admin/${id}`);
        return {recipeDetail: response.data.data.data, author: response.data.data.data.author};
    }, []);
    return {
        getRecipes,
        getRecipeDashboard,
        getRecipeCategories,
        getRecipeById,
        activateRecipe,
        deactivateRecipe,
        updateRecipeIsActive,
        deleteRecipe,
        createRecipe,
        updateRecipe,
        approveRecipe,
        rejectRecipe,
        getRecipePointsHistory,
        toggleRecipeLike,
        getRecipeForAdmin,
    }
}