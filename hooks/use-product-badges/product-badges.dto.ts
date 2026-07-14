export interface CreateProductBadgeDto {
    productId: string;
  
    isHotDeal: boolean;
  
    isNewProduct: boolean;
  
    isBestSeller: boolean;
}

export interface UpdateProductBadgeDto extends CreateProductBadgeDto {}