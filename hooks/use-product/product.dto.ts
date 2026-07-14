export interface ProductListQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    storageMethod?: string;
    saleStatus?: string;
    displayStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    isOutDated? : boolean;
}

export interface CreateProductSpecialOfferDto {
    status?: boolean;
    discountAmount?: number;
    specialPriceApplied?: number;
    startDate?: Date | string;
    endDate?: Date | string;
}

export interface ProductBadge {
    isHotDeal: boolean;
    isNewProduct: boolean;
    isBestSeller: boolean;
}

export interface CreateProductDto {
    productName: string;
    productCode?: string;
    category?: string;

    storageMethod?: string;

    manufacturer?: string;
    origin?: number;
    consumerPrice?: number;
    supplyPrice?: number;
  
    productPrice?: number;
  
    salePrice?: number;
  
    discountRate?: number;
  
    discountStartDate?: Date;
  
    discountEndDate?: Date;

    stockQuantity?: number;
  
    deliveryMethod?: string;
  
    deliveryFeeInput?: string;
  
    productBriefDescription: string;
  
    seoDescription?: string;
  
    seoKeywords?: string;

    saleStatus ?: string;

    productBadges?: ProductBadge | null;

    specialOffer?: CreateProductSpecialOfferDto | null;
}
  
export interface UpdateProductDto extends CreateProductDto {}
