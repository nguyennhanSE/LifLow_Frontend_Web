export interface CartItemCouponDto {
    cartItemId: string;
    couponIds?: string[];
}

export interface CouponIdQuantityDto {
    couponId: string;
    quantity: number;
}
export interface DirectPayOrderItemDto {
    productId: string;
    quantity: number;
}

export interface InitializePaymentRequestDto {
    cartItemIds?: string[],
    coupons: CouponIdQuantityDto[],
    userShippingAddressId?: string,
    points?: number,
    deliveryFee?: number,
}
export interface InitializeDirectPaymentRequestDto {
    productId: string;
    quantity: number;
    coupons: CouponIdQuantityDto[];
    userShippingAddressId?: string;
    points?: number;
    deliveryFee?: number;
}


export interface ConfirmPaymentRequestDto {
    paymentKey: string;
    orderGroupNumber: string;
    amount: number;
    deliveryFee: number;
    userShippingAddressId?: string;
    cartItems: string[];
    coupons?: CouponIdQuantityDto[];
    paymentToken : string;
}

export interface InitializePaymentResponseDto {
    orderId: string;
    customerKey: string;
    deliveryFee: number;
    cartItemCoupons?: CartItemCouponDto[];
}

export interface CartItemCouponDto {
    cartItemId: string;
    couponIds?: string[];
  }
  
export interface ConfirmPaymentOrderItemDto {
    cartItemId: string;
    productId: string;
    totalOrderAmount: number;
    totalPaymentAmount: number;
  
    productName: string;
    productNameWithOptions: string;
  
    quantity: number;
  
    salePrice: number;
  
    recipient: string;
  
    recipientAddressFull: string;
  
    recipientPostalCode: number;
  
    recipientMobilePhone: string;
  
    deliveryMessage: string;
}

export interface InitializePaymentResponseDto {
    orderId: string;
    deliveryFee: number;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    orderGroupName: string;
    customerKey: string;
    successUrl: string;
    failUrl: string;
    paymentToken: string;
}

export interface CancelPaymentRequestDto {
    paymentId: string;
    cancelReason: string;
}

export interface ReturnPaymentRequestDto {
    paymentId: string;
    returnReason: string;
}