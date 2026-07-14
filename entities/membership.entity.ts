export interface Membership {
    id: string;
    name: string;
    description: string | null;
    nickName: string | null;
    basePeriod: number | null;
    minPrice?: number | null;
}

export enum MembershipLevel {
    LV1 = 'LV1. 씨앗',
    LV2 = 'LV2. 새싹',
    LV3 = 'LV3. 열매',
    LV4 = 'LV4. 나무',
    LV5 = 'LV5. 정원',
}
export enum EMembershipStatus {
    ACTIVE = 'normal',
    INACTIVE = 'inactive',
    STOP = 'stop'
}