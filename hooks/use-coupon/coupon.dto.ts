import { CouponType } from "@/entities/coupons/coupon.entity";

export interface QueryCouponDto {
    isActive?: boolean;
  
    type?: CouponType;
  
    search?: string;
  
    page?: number;
  
    limit?: number;
  
    sortBy?: string;
  
    sortOrder?: 'asc' | 'desc';
  }

  export interface CreateCouponDto {
    name?: string;
  
    code?: string;
  
    type?: CouponType;
  
    discountRate?: number;
  
    discountAmount?: number;
  
    minPurchaseAmount?: number;
  
    maxDiscountAmount?: number;
  
    imageUrl?: string;
  
    startDate?: string;
  
    endDate?: string;
  
    isActive?: boolean;
  
    isAutoIssue?: boolean;
  
    autoIssueDayOfMonth?: string;
  
    targetGrades?: string[];
}

export interface UpdateCouponDto extends CreateCouponDto {}