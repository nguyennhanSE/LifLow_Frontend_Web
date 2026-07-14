import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a navigation handler for product detail page
 * @param router - Next.js router instance
 * @param productId - Product ID to navigate to
 * @returns Click handler function
 */
export function createProductNavigationHandler(
  router: AppRouterInstance,
  productId: string
): () => void {
  return () => {
    router.push(`/products/${productId}`)
  }
}
