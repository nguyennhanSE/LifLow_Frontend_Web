export interface PolicyEntity {
  id: string;

  status: 'active' | 'inactive';

  paymentInformation: string;

  deliveryInformation: string;

  exchangeInformation: string;

  createdAt?: Date;

  updatedAt?: Date;
}
