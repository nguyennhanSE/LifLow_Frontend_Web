export interface QueryProductInquiriesDto {
    productId?: string;
    authorId?: string;
    hasAnswer?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}
export interface CreateProductInquiryDto {
    productId: string;
    authorId: string;
    title: string;
    content: string;
  }
   
export interface CreateProductInquiryAnswerDto {
    answer: string;
}
