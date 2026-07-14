export interface Coupon {
    id: string;
    name: string;
    code: string;
    type: CouponType;
    discountRate?: number | null;
    discountAmount?: number | null;
    minPurchaseAmount?: number | null;
    maxDiscountAmount?: number | null;
    imageUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    isActive?: boolean | null;
    isPermanent?: boolean | null;
    canAutoIssue?: boolean | null;
    isAutoIssue?: boolean | null;
    hasBeenIssued?: boolean | null;
    autoIssueDayOfMonth?: string | null;
    targetGrades?: string[] | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

  export enum CouponType {
    PERCENT = 'PERCENT', // 정률 할인 (Discount rate %)
    AMOUNT = 'AMOUNT',  // 정액 할인 (Discount amount)
    FREE_SHIPPING = 'FREE_SHIPPING',  // 무료 배송 (Free shipping)
  }
  
export enum CouponTargetGrade {
    VIP = 'VIP',  // VIP
    VVIP = 'VVIP', // VVIP
}
  
export enum CouponHistoryStatus {
    ISSUED = 'ISSUED',    // 발급됨
    USED = 'USED',      // 사용됨
    EXPIRED = 'EXPIRED',   // 만료됨
    CANCELLED = 'CANCELLED', // 취소됨
}