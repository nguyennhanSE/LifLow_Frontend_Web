import { serviceAxios } from "@/lib/axios/axios.client";
import { useCallback } from "react";
import { CreateOrderDto, OrderFilterDto, UpdateOrderGroupDto} from "./order.dto";
import { Order, OrderGroup, OrderGroupedListResponse } from "@/entities/orders/order.entity";

export const useOrder = () => {
    const getOrders = useCallback(async (query: OrderFilterDto) => {
        const response = await serviceAxios.get('/order/list', { params: query });
        return response.data.data as OrderGroupedListResponse;
    }, []);
    const getOrdersStats = useCallback(async () => {
        const response = await serviceAxios.get('/order/stats/dashboard');
        return response.data.data;
    }, []);
    const updateOrderGroup = useCallback(async (orderGroupId: string, data: UpdateOrderGroupDto) => {
        const response = await serviceAxios.patch(`/order/group/${orderGroupId}`, data);
        return response.data.data as OrderGroup;
    }, []);
    const createOrder = useCallback(async (data: CreateOrderDto, point?: number, coupons?: string[]) => {
        const response = await serviceAxios.post('/order', {
            data,
            point,
            coupons,
        });
        return response.data.data as Order;
    }, []);

    const getOrderById = useCallback(async (orderId: string) => {
        const response = await serviceAxios.get(`/order/${orderId}`);
        return response.data.data as Order;
    }, []);

    const getOrderGroupByOrderGroupNumber = useCallback(async (orderGroupNumber: string) => {
        const response = await serviceAxios.get(`/order/group/${orderGroupNumber}`);
        return response.data.data as OrderGroup;
    }, []);

    const getMyOrders = useCallback(async (offset?: number, limit?: number) => {
        const response = await serviceAxios.get('/user/me/orders', {
            params: {
                offset,
                limit,
            },
        });
        return response.data.data.orderGroups as OrderGroup[];
    }, []);

    const cancelOrderGroup = useCallback(async (orderGroupNumber: string) => {
        const response = await serviceAxios.put(`/order/orderGroup/cancel`, {
            orderGroupNumber,
        });
        return response.data.data;
    }, []);

    return {
        getOrders,
        getOrdersStats,
        updateOrderGroup,
        createOrder,
        getOrderById,
        getMyOrders,
        getOrderGroupByOrderGroupNumber,
        cancelOrderGroup,
    }
}