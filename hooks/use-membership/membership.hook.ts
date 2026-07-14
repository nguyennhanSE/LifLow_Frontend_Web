import { serviceAxios } from "@/lib/axios/axios.client";
import { useCallback } from "react";
import { BulkUpdateMembershipItemDto, UpdateUserMembershipDto } from "./membership.dto";

export const useMembership = () => {
    const updateUserMembership = useCallback(async (userId: string, dto: UpdateUserMembershipDto) => {
        const response = await serviceAxios.patch(`/memberships/user/${userId}`, {
            ...dto,
        });
        return response.data.data;
    }, []);
    const getMembership = useCallback(async (page: number, limit: number, sortOrder: string = 'desc') => {
        const response = await serviceAxios.get(`/memberships`, {
            params: {
                page,
                limit,
                sortOrder,
            },
        });
        return response.data.data.docs;
    }, []);
    const bulkUpdateMembership = useCallback(async (updates: BulkUpdateMembershipItemDto[]) => {
        // Send body as a plain array (no { updates: ... } wrapper)
        const response = await serviceAxios.post(
            `/memberships/bulk-update`,{
            updates:updates.map((update: BulkUpdateMembershipItemDto) => ({
                membershipId: update.membershipId,
                nickName: update.nickName,
                minPrice: update.minPrice,
                basePeriod: update.basePeriod,
            }))}
        );
        return response.data.data;
    }, []);
    const recalculateMembership = useCallback(async () => {
        const response = await serviceAxios.post(`/memberships/recalculate-all`);
        return response.data.data;
    }, []);
    return {
        updateUserMembership,
        getMembership,
        bulkUpdateMembership,
        recalculateMembership,
    }
}