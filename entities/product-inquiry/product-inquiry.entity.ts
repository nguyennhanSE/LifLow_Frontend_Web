import { User } from "../user.entity";
import { ProductEntity } from "../products/product.entity";

export interface ProductInquiryEntity {
  /** Unique identifier for the inquiry */
  id: string;

  /** Product ID this inquiry belongs to */
  productId: string;

  /** User ID of the inquiry author */
  authorId: string;

  /** Inquiry title */
  title: string;

  /** Inquiry content text */
  content: string;

  /** Answer to the inquiry (optional) */
  answer?: string | null;

  /** Whether the inquiry has been answered */
  hasAnswer?: boolean;

  /** Timestamp when the inquiry was created */
  createdAt?: Date | string | null;

  /** Timestamp when the inquiry was last updated */
  updatedAt?: Date | string | null;

  // Relations

  /** Product this inquiry belongs to */
  product?: ProductEntity | null;

  /** User who authored this inquiry */
  user?: User | null;

  productInquiryAnswers?: ProductInquiryAnswerEntity[]
}

export interface ProductInquiryAnswerEntity {
  id: string;

  inquiryId: string;

  answer: string;

  createdAt: Date;

  updatedAt: Date;

  /** User who authored this answer */
  user?: User | null;
}