import { User } from "../user.entity";
import { ProductEntity } from "../products/product.entity";

export interface ProductReviewEntity {
  /** Unique identifier for the review */
  id: string;

  /** Product ID this review belongs to (maps to product_id in database) */
  productId: string;

  /** Image URL of the review (maps to image_url in database) */
  imageUrl?: string | null;

  /** User ID of the review author (maps to author_id in database) */
  authorId: string;

  /** Review content text (maps to review in database) */
  review: string;

  /** Rating value (maps to rating in database) */
  rating: number;

  /** Timestamp when the review was created (maps to created_at in database) */
  createdAt?: Date | null;

  /** Timestamp when the review was last updated (maps to updated_at in database) */
  updatedAt?: Date | null;

  // Relations

  /** Product this review belongs to */
  product?: ProductEntity | null;

  /** User who authored this review */
  user?: User | null;
}
