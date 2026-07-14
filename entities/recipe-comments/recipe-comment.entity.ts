import { Recipe } from "../recipes/recipe.entity"
import { User } from "../user.entity"

export interface RecipeComment {
    id: string
    recipeId: string
    authorId: string
    content: string
    createdAt: Date
    updatedAt: Date
    recipe? : Recipe | null
    author? : User | null
}