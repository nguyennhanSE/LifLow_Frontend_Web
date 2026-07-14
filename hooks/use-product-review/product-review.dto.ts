export interface CreateProductReviewDto {
    productId: string;
    review: string;
    rating: number;
}

export interface QueryProductReviewsDto {
    productId?: string;
    authorId?: string;
    minRating?: number;
    maxRating?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/** Recipe item in product review feed (type: "recipe") */
export interface ProductReviewFeedRecipe {
    id: string;
    title: string;
    content: string;
    authorName: string;
    category: string;
    dateOfWriting: string;
    views: number;
    thumbnailUrl: string[];
    status: string;
}

/** Review item in product review feed (type: "review") */
export interface ProductReviewFeedReview {
    id: string;
    productId: string;
    authorId: string;
    authorName: string;
    imageUrl: string | null;
    review: string;
    rating: number;
    createdAt: string;
    updatedAt: string;
    user: unknown | null;
    product: unknown | null;
}

export type ProductReviewFeedItem =
    | { type: "recipe"; createdAt: string; likes: number; likedByMe: boolean; recipe: ProductReviewFeedRecipe }
    | { type: "review"; createdAt: string; likes: number; likedByMe: boolean; review: ProductReviewFeedReview };
