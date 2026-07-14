import { User } from "../user.entity";

export interface Recipe {
    id: string;
    title?: string;
    authorId?: string | null;
    authorName?: string | null;
    category?: ERecipeCategory;
    dateOfWriting?: Date;
    views?: number;
    status?: string;
    thumbnailUrl?: string[];
    content?: string;
    ingredients?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    author?: User | null;
    recipeComments? : any[];   
}

export enum ERecipeCategory {
    RECIPE = 'RECIPE',
    REVIEWS = 'REVIEWS',
    DAILY_LIFE = 'DAILY_LIFE',
}

/** Display label for category (value sent to API is still enum) */
export const getRecipeCategoryLabel = (value: ERecipeCategory | string): string => {
  switch (value) {
    case ERecipeCategory.RECIPE:
      return '레시피'
    case ERecipeCategory.REVIEWS:
      return '리뷰'
    case ERecipeCategory.DAILY_LIFE:
      return '일상'
    default:
      return String(value)
  }
}


