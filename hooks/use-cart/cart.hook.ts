import { serviceAxios } from "@/lib/axios/axios.client"
import { useCallback } from "react"
import { CreateCartItemDto } from "./cart-item.dto";
import { BulkUpdateCartItemsDto } from "./cart-item.dto";

export const useCart = () => {
    const getMyCart = useCallback(async () => {
        const response = await serviceAxios.get('/carts/me');
        return response.data.data;
    }, []);

    const addItemToCart = useCallback(async (item: CreateCartItemDto) => {
        try {
            const response = await serviceAxios.post('/carts/add-item', item);
            // Broadcast cart update event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            }
            return response.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }, []);

    const deleteItemFromCart = useCallback(async (itemId: string) => {
        try {
            const response = await serviceAxios.delete(`/cart-items/${itemId}`);
            // Broadcast cart update event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            }
            return response.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }, []);

    const bulkUpdateCartItems = useCallback(async (dto: BulkUpdateCartItemsDto) => {
        try {
            const response = await serviceAxios.patch(`/cart-items/bulk-update`, dto);
            // Broadcast cart update event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            }
            return response.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }, []);

    const getNumberOfCartItems = useCallback(async () => {
        try {
            const response = await serviceAxios.get('/carts/number-of-items');
            return response.data.data as number;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }, []);

    const bulkDeleteCartItems = useCallback(async (cartItemIds: string[]) => {
        try {
            const response = await serviceAxios.delete(`/cart-items/bulk-remove`, { data: { cartItemIds } });
            return response.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }, []);
    return { getMyCart, addItemToCart, deleteItemFromCart, bulkUpdateCartItems, bulkDeleteCartItems, getNumberOfCartItems };
};