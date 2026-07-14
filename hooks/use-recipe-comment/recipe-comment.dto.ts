export interface QueryRecipeCommentsDto {
    recipeId?: string;
    authorId?: string;
    page?: number;
    limit?: number;
  
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateRecipeCommentDto {
    recipeId: string;
    content: string;
}