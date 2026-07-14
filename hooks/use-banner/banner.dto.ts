import { EBannerStatus, EBannerType } from "@/entities/banner/banner.entity";
import { ECategoryType } from "@/entities/product-category/product-category.entity";

export interface CreateBannerDto {
    type: EBannerType;
  
    status: EBannerStatus;
  
  
    category?: ECategoryType | null; 
  
    productId?: string;
  
    title?: string;
  
    badgeText?: string;
  
    mainText?: string;
  
    ctaButtonText?: string;
  
    ctaButtonUrl?: string;
  
    imageUrl?: string;
  
    mobileImageUrl?: string;
  
    displayOrder?: number;
  
    startDate?: string;
  
    endDate?: string;
  }
  

export interface UpdateBannerDto extends CreateBannerDto {}

export { ECategoryType }