export interface PaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export interface RecipeListResponse {
    data: unknown[]
    pagination: PaginationMeta
}

export interface RecipeListQueryDto {
    page?: number
    limit?: number
  
    category?: string;
  
    status?: string;
    isActive? : boolean;
    authorId?: string;
  
    sortBy?: string;
    sortOrder?: string;
    q?: string;
}

export interface CreateRecipeDto {
    title: string;
  
    category: string;
  
    content?: string;
  
    ingredients?: string[];

    productId?: string;
}

export interface UpdateRecipeDto extends CreateRecipeDto {}

/** Points history record (e.g. Recipe approval reward). */
export interface PointTransaction {
  id: string
  date: string
  userId: string
  membershipLevel: string | null
  content: string
  orderGroupNumber: string | null
  pointsType: string
  availablePointsIncrease: number | null
  availablePointsDeduction: number | null
  availablePointsBalance: number
  createdAt: string
  updatedAt: string
}