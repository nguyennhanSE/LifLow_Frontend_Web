import { EOrderSituation } from "@/entities/orders/order.entity";

export interface OrderFilterDto {
    page?: number;
    limit?: number;
    q?: string;
    ordererId?: string;
    dateFrom?: string;
  
    dateTo?: string;
  
  
    sortBy?: string;
  
    sortOrder?: 'asc' | 'desc';
  
    situation?: EOrderSituation | 'ALL';
  
    period?: 'today' | '7d' | '1m' | 'all';
  
}

export interface CreateOrderDto {
    orderGroupNumber: string;
    
    cartId: string;
  
    totalOrderAmount: number;
  
    totalPaymentAmount: number;
  
    productId: string;
  
    productName: string;
  
    productNameWithOptions: string;
  
    quantity: number;
  
    recipient: string;
  
    recipientAddressFull: string;
  
    recipientPostalCode: number;
  
    recipientMobilePhone: string;
  
    recipientPhoneNumber: string;
  
    deliveryMessage: string;
  
    salePrice: number;
  
    paymentType: string;
  
    paymentMethod: string;
  
    orderDate: string;
  
    desiredDeliveryDate: string;
  
    situation: EOrderSituation;
  
    courierCompany: string;
  }
  
export interface UpdateOrderGroupDto {
    orderGroupName?: string;
    originalAmount?: number;
    discountAmount?: number;
    ordererId?: string;
    situation?: EOrderSituation;
    finalAmount?: number;
    pointsUsed?: number;
    cartItemIds?: string[];
    deliveryFee?: number;
    courierCompany?: string;
    invoiceNumber?: string;
}
