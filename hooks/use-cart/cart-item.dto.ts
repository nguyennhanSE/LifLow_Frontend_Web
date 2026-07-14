export interface CreateCartItemDto {
    productId: string;
    quantity: number;
}

export interface BulkUpdateCartItemDto {
    id: string;
    data : CreateCartItemDto;
  }
  
  export interface BulkUpdateCartItemsDto {
    items: BulkUpdateCartItemDto[];
  }