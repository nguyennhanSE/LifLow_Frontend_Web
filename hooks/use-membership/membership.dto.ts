import { EMembershipStatus } from "@/entities/membership.entity";

export interface UpdateUserMembershipDto {
    startDate?: Date;
    endDate?: Date;
    status?: EMembershipStatus;
    membershipLevel?: string;
    availablePoints?: number;
}

export interface BulkUpdateMembershipItemDto {
    membershipId: string;
    nickName: string;
    minPrice: number;
    basePeriod: number;
}
  
export interface BulkUpdateMembershipDto {
    updates: BulkUpdateMembershipItemDto[];
}