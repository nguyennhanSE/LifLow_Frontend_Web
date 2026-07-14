import { ProductEntity } from "../products/product.entity";
import { ECategoryType } from "../product-category/product-category.entity";

export interface BannerEntity {
    id: string;
    type: EBannerType;
  
    status: EBannerStatus;
  
    productId?: string | null;
  
    productCategoryNumber?: string | null;

    /**
     * Some API responses provide category enum instead of productCategoryNumber.
     * Keep this optional for backward/forward compatibility.
     */
    category?: ECategoryType | null;
  
    title?: string | null;
  
    badgeText?: string | null;
  
    mainText?: string | null;
  
    ctaButtonText?: string | null;
  
    ctaButtonUrl?: string | null;
  
    imageUrl?: string | null;
  
    mobileImageUrl?: string | null;
  
    displayOrder?: number | null;
  
    startDate?: Date | null;
  
    endDate?: Date | null;
  
    productName?: string | null;
  
    productPrice?: number | null;
  
    productBrand?: string | null;
  
    productExplanation?: string | null;
  
    createdAt?: Date | null;
  
    updatedAt?: Date | null;

    product?: ProductEntity | null;
}

export enum EBannerType {
    MAIN_PRODUCTS = 'MAIN_PRODUCTS',      // Main Products (메인 상품)
    CATEGORY = 'CATEGORY',          // Category (카테고리)
    FOOTER = 'FOOTER',            // Footer
    CONTENT_HERO = 'CONTENT_HERO',      // Content Hero
    SPECIAL_PRICE = 'SPECIAL_PRICE',     // This week's special price (이번주 특가)
}
export enum EBannerStatus {
    ACTIVE = 'ACTIVE',   // 활성화
    INACTIVE = 'INACTIVE', // 비활성화
    SCHEDULED = 'SCHEDULED', // 예약됨
}

