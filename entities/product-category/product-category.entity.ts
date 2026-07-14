export interface ProductCategoryEntity {
    productCategoryNumber: string;
    name: ECategoryType;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export enum ECategoryType {
    LIVESTOCK = 'LIVESTOCK', // 라이브스톡
    CONVENIENCE_FOOD = 'CONVENIENCE_FOOD', // 편의점 음식
    FISHERIES = 'FISHERIES', // 수산물
    SIDE_DISH = 'SIDE_DISH', // 사이드 요리
}