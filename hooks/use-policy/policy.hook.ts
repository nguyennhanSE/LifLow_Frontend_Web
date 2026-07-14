import { serviceAxios } from "@/lib/axios/axios.client";
import { PolicyEntity } from "@/entities/policy/policy.entity";

export const usePolicy = () => {
    const getActivePolicy = async () => {
        const response = await serviceAxios.get('/policy/active')
        return response.data.data as PolicyEntity
    }
    const createPolicy = async (policy: PolicyEntity) => {
        const response = await serviceAxios.post('/policy', {
            paymentInformation: policy.paymentInformation,
            deliveryInformation: policy.deliveryInformation,
            exchangeInformation: policy.exchangeInformation
        })
        return response.data.data as PolicyEntity
    }
    return {
        getActivePolicy,
        createPolicy
    }
}
