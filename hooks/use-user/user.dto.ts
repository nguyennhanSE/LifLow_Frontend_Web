import { EMembershipStatus } from "@/entities/membership.entity";
import { ERoleName } from "@/entities/roles/role.enum";

export interface GetUsersQueryDto {
    page: number;
    limit: number;
    sort?: 'asc' | 'desc';
    sortBy?: string;
    counted?: boolean;
    role?: ERoleName;
    email?: string;
    searchField?: string;
    q?: string;
    status?: 'normal' | 'inactive' | 'stop';
    nickName?: string;
}

export interface GetAdminOnlyQueryDto {
    page: number;
    limit: number;
    sort?: 'asc' | 'desc';
    sortBy?: string;
    role?: ERoleName;
    q?: string;
}
export  interface CreateUserDto {
    id: string;
    password: string;

    name: string;

    mobilePhoneNumber?: string;

    phoneNumber?: string;

    email?: string;

    zipCode?: number;

    addressName?: string;

    addressFull?: string;

    dateOfBirth?: string;

    nickName?: string;

    statusMessage?: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    phoneNumber?: string;
    role?: ERoleName;
    membershipLevel?: string;
    age?: number;
    totalUsedPoints?: number;
    availablePoints?: number;
    dormancyDate?: string | null;
    withdrawalDate?: string | null;
    withdrawalType?: string | null;
    reasonForWithdrawal?: string | null;
    totalPurchaseAmount?: number;
    password?: string;
    membershipStatus?: EMembershipStatus;
}

export interface CreateShippingAddressDto {
    deliveryAddress: string;
    recipientName: string;
    phoneNumber: string;
    mobilePhone?: string;
    postalCode: number;
    address: string;
    addressFull: string;
    setAsDefault: boolean;
}

export interface UpdateShippingAddressDto extends CreateShippingAddressDto {
}

export interface GetMyRecipeQueryDto {
    page: number;
    limit: number;
    isActive?: boolean;
}
