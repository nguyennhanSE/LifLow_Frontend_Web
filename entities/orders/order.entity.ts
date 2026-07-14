import { ProductEntity } from "../products/product.entity";
import { User } from "../user.entity";


export interface Order {
    id: string;
    orderNumber: string;
    itemWiseOrderNumber: string;
    totalOrderAmount: number;
    totalPaymentAmount: number;
    productNumber: number;
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
    ordererName: string;
    ordererMobilePhone: string;
    ordererId?: string | null;
    desiredDeliveryDate: string;
    membershipLevelAtOrderTime: string;
    orderStatus?: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: User | null;
    // Extensions
    situation?: EOrderSituation | null;
    courierCompany?: string | null;
    invoiceNumber?: string | null;
    product?: ProductEntity | null;
  }

export interface OrderGroupedListResponse {
  data: OrderGroup[];
  pagination: PaginationMeta;
}

export interface OrderGroup {
  orderGroupNumber: string;
  orderGroupName: string;
  originalAmount: number;
  discountAmount: number;
  ordererId: string;
  situation: EOrderSituation;
  finalAmount?: number | null;
  pointsUsed?: number | null;
  cartItemIds?: string[] | null;
  deliveryFee?: number | null;
  courierCompany?: string | null;
  invoiceNumber?: string | null;
  paymentId?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  
  // Relations
  user?: User | null;
  orders?: Order[] | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}



export enum EOrderSituation {
    ORDER_PAYMENT_FAILED = 'ORDER_PAYMENT_FAILED',
    ORDER_PAYMENT_PENDING = 'ORDER_PAYMENT_PENDING',
    ORDER_PAYMENT_COMPLETED = 'ORDER_PAYMENT_COMPLETED',
    // ORDER_IN_PREPARE = 'ORDER_IN_PREPARE',
    ORDER_BEING_SHIPPED = 'ORDER_BEING_SHIPPED',
    ORDER_SHIPPED = 'ORDER_SHIPPED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    ORDER_RETURNED = 'ORDER_RETURNED',
}