import { serviceAxios } from "@/lib/axios/axios.client"
import { InitializePaymentRequestDto, InitializeDirectPaymentRequestDto, ConfirmPaymentRequestDto, InitializePaymentResponseDto, CancelPaymentRequestDto, ReturnPaymentRequestDto } from "./payment.dto"
import { useCallback } from "react"

export const usePayment = () => {
    const initializePayment = useCallback(async (initializePaymentRequestDto: InitializePaymentRequestDto) : Promise<InitializePaymentResponseDto> => {
        const response = await serviceAxios.post('/payment/initiate', initializePaymentRequestDto);
        return response.data.data;
    }, []);
    const initializeDirectPayment = useCallback(async (dto: InitializeDirectPaymentRequestDto) => {
        const response = await serviceAxios.post('/payment/initiate-directly-pay', dto);
        return response.data.data;
    }, []);
    const confirmPayment = useCallback(async (confirmPaymentRequestDto: ConfirmPaymentRequestDto) => {
        const response = await serviceAxios.post('/payment/confirm', confirmPaymentRequestDto);
        // Broadcast cart update event (cart items removed after successful payment)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
        return response.data;
    }, []);
    const cancelPayment = useCallback(async (dto: CancelPaymentRequestDto) => {
        const response = await serviceAxios.post('/payment/cancel', dto);
        return response.data.data;
    }, []);

    const returnPayment = useCallback(async (dto: ReturnPaymentRequestDto) => {
        const response = await serviceAxios.post('/payment/return', dto);
        return response.data.data;
    }, []);
    return {
        initializePayment,
        initializeDirectPayment,
        confirmPayment,
        cancelPayment,
        returnPayment,
    }
}