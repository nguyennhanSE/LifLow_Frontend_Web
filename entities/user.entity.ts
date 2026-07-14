import { Membership } from "./membership.entity";
import { EPermissionName } from "./permissions/permission.entity";
import { Recipe } from "./recipes/recipe.entity";
import { Role } from "./roles/role.entity";

export interface User {
    id: string;
    name: string;
    age: number;
    membershipLevel: string;
    email: string;
    phoneNumber: string;
    totalUsedPoints: number;
    availablePoints: number;
    registrationDate: string;
    dormancyDate: string | null;
    withdrawalDate: string | null;
    withdrawalType: string | null;
    reasonForWithdrawal: string | null;
    createdAt: string;
    updatedAt: string;
    totalPurchaseAmount?: number;
    roles?: Role[] | null;
    permissions?: EPermissionName[] | null;
    membership?: Membership | null;
    recipes?: Recipe[];
    situation: string;
    avatarUrl?: string | null;
}
