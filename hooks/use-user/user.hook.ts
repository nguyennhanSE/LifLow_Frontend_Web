import { serviceAxios } from "@/lib/axios/axios.client";
import { CreateShippingAddressDto, CreateUserDto, GetAdminOnlyQueryDto, GetMyRecipeQueryDto, GetUsersQueryDto, UpdateShippingAddressDto, UpdateUserDto } from "./user.dto";
import { User } from "@/entities/user.entity";
import { EPermissionName } from "@/entities/permissions/permission.entity";
import { useCallback } from "react";
import { Pagination } from "@/utils/common";
import { ResponseModel } from "@/models/ResponseModel";

export const useUser = () => {
    const getUsers = useCallback(async (query: GetUsersQueryDto) => {
        const response = await serviceAxios.get('/user/list', { params: query });
        const pagination : Pagination = {
            page: response.data.data.currentPage,
            limit: response.data.data.limit,
            total: response.data.data.totalDocs,
            totalPages: response.data.data.totalPages,
        }
        return {data:response.data.data.docs, total:response.data.data.totalDocs, pagination : pagination} as {data: User[], total: number, pagination: Pagination};
    }, []); 
    const getAdminOnly = useCallback(async (query: GetAdminOnlyQueryDto) => {
        const response = await serviceAxios.get('/user/admin-list', { params: query });
        return {data:response.data.data.docs, total:response.data.data.totalDocs} as {data: User[], total: number};
    }, []);
    const addUser = useCallback(async (user: CreateUserDto) => {
        const response = await serviceAxios.post('/user/create', user);
        return response.data.data as User;
    }, []);
    const updateUser = useCallback(async (user: UpdateUserDto, id: string) => {
        const response = await serviceAxios.patch(`/user/${id}`, user);
        return response.data.data as User;
    }, []);
    const deleteUser = useCallback(async (id: string) => {
        const response = await serviceAxios.delete(`/user/${id}`);
        return response.data.data as User;
    }, []);
    const updateUserPermissions = useCallback(async (id: string, permissions: EPermissionName[] ) => {
        const response = await serviceAxios.patch(`/user/${id}/permissions`, {
            permissions: {
                DASHBOARD_ACCESS: permissions.includes(EPermissionName.DASHBOARD_ACCESS),
                MEMBER_MANAGEMENT: permissions.includes(EPermissionName.MEMBER_MANAGEMENT),
                PRODUCT_MANAGEMENT: permissions.includes(EPermissionName.PRODUCT_MANAGEMENT),
                ORDER_MANAGEMENT: permissions.includes(EPermissionName.ORDER_MANAGEMENT),
                RECIPE_MANAGEMENT: permissions.includes(EPermissionName.RECIPE_MANAGEMENT),
                BANNER_MANAGEMENT: permissions.includes(EPermissionName.BANNER_MANAGEMENT),
            }
        });
        return response.data.data as User;
    }, []);
    const getUserPermissions = useCallback(async (id: string) => {
        const response = await serviceAxios.get(`/user/${id}/permissions`);
        return response.data.data.permissions as EPermissionName[];
    }, []);
    const getMyPoints = useCallback(async () => {
        const response = await serviceAxios.get('/user/me/points');
        return response.data.data;
    }, []);
    const getMyCoupons = useCallback(async () => {
        const response = await serviceAxios.get('/user/me/coupons');
        return response.data.data as { availableCoupons: any[]; usedCoupons: any[] };
    }, []);
    const getMyInformation = useCallback(async (params?: { includeOrders?: boolean }) => {
        const response = await serviceAxios.get('/user/me', { params });
        return response.data.data as User & { orders?: any[] };
    }, []);
    const updateMyInformation = useCallback(async (user: {name?: string, email?: string, phoneNumber?: string}) => {
        const response = await serviceAxios.patch('/user/me', user);
        return response.data.data as User;
    }, []);
    const getMyDeliveryAddress = useCallback(async () => {
        const response = await serviceAxios.get('/user/me/shipping-address');
        return response.data.data as any[];
    }, []);
    const addMyDeliveryAddress = useCallback(async (deliveryAddress: CreateShippingAddressDto) => {
        const response = await serviceAxios.post('/user/me/shipping-address', deliveryAddress);
        return response.data.data as any;
    }, []);

    const updateMyDeliveryAddress = useCallback(async (deliveryAddressId: string, deliveryAddress: UpdateShippingAddressDto) => {
        const response = await serviceAxios.patch(`/user/me/shipping-address/${deliveryAddressId}`, deliveryAddress);
        return response.data.data as any;
    }, []);

    const deleteMyDeliveryAddress = useCallback(async (deliveryAddressId: string) => {
        const response = await serviceAxios.delete(`/user/me/shipping-address/${deliveryAddressId}`);
        return response.data.data as any;
    }, []);

    const getMyRecipe = useCallback(async (query: GetMyRecipeQueryDto) => {
        const response = await serviceAxios.get('/recipe/author/me', {
            params: query
        });
        const payload = response.data?.data;
        return (Array.isArray(payload) ? payload : payload?.data ?? []) as any;
    }, []);

    const registerUser = useCallback(async (user: CreateUserDto, avatarImage?: File) => {
        const formData = new FormData();
        // Append all user fields directly to FormData
        Object.entries(user).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof Date) {
                    formData.append(key, value.toISOString());
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        if (avatarImage) {
            formData.append('avatarImage', avatarImage);
        }
        const response = await serviceAxios.post('/user/create', formData);
        return response.data.data as User;
    }, []);

    const checkUserId = useCallback(async (id: string) => {
        const response = await serviceAxios.get(`/user/check-id?id=${id}`);
        return response.data.data;
    }, []);

    const findId = useCallback(async (name: string, email: string) => {
        const response = await serviceAxios.get(`/user/find-id?name=${name}&email=${email}`);
        return response.data.data;
    }, []);
    const findPassword = useCallback(async (id: string, name: string, email: string) => {
        const response = await serviceAxios.get(`/user/find-password?id=${id}&name=${name}&email=${email}`);
        return response.data.data;
    }, []);

    const updatePassword = useCallback(async (oldPassword: string, newPassword: string) => {
        try {
            const response = await serviceAxios.post('/user/me/update-password', { oldPassword, newPassword });
            return response.data.data as User;
        } catch (error: any) {
            const model = new ResponseModel(error as any);
            throw new Error(model.getMessage());
        }
    }, []);

    const cancelMembership = useCallback(async () => {
        const response = await serviceAxios.put('/user/me/cancel-membership');
        return response.data.data as User;
    }, []);

    const updateMyAvatar = useCallback(async (avatarImage: File) => {
        const formData = new FormData();
        formData.append('avatarImage', avatarImage);
        const response = await serviceAxios.patch('/user/me/avatar', formData);
        return response.data.data as User;
    }, []);
    return {
        getUsers,
        getAdminOnly,
        addUser,
        updateUser,
        deleteUser,
        updateUserPermissions,
        getUserPermissions,
        getMyPoints,
        getMyCoupons,
        getMyInformation,
        updateMyInformation,
        getMyDeliveryAddress,
        addMyDeliveryAddress,
        getMyRecipe,
        registerUser,
        checkUserId,
        findId,
        findPassword,
        updateMyDeliveryAddress,
        deleteMyDeliveryAddress,
        updatePassword,
        cancelMembership,
        updateMyAvatar,
    }
}