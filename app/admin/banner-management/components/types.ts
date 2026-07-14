export type Product = {
  id: number
  name: string
  price: string
  brand: string
  description: string
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Jjuwang Instant Ramen Box (20 Pack)',
    price: '35,900',
    brand: 'Jjuwang',
    description: 'Premium ramen with deep flavor',
  },
  {
    id: 2,
    name: 'Korean BBQ Set',
    price: '89,000',
    brand: 'Seoul Foods',
    description: 'Authentic Korean BBQ experience',
  },
] as const

export type CategoryBanner = {
  id: string
  name: string
  title: string
  subtitle: string
  ctaText: string
  ctaUrl: string
  bgColor: string
}

export const initialCategoryBanners: CategoryBanner[] = [
  {
    id: 'all',
    name: 'All Categories',
    title: "Today's Recommendation",
    subtitle: 'Discover fresh Jjuwangsan products at special prices.',
    ctaText: 'View All',
    ctaUrl: '/products/category/all',
    bgColor: '#FF5833',
  },
  {
    id: 'livestock',
    name: 'Livestock',
    title: 'Premium Korean beef',
    subtitle: 'Only grade 1 or higher is carefully selected',
    ctaText: 'View livestock',
    ctaUrl: '/products/category/meat',
    bgColor: '#E74C3C',
  },
  {
    id: 'convenience',
    name: 'Convenience food',
    title: 'Easy to enjoy',
    subtitle: 'A delicious meal',
    ctaText: 'View simple meals',
    ctaUrl: '/products/category/ready',
    bgColor: '#F39C12',
  },
  {
    id: 'fisheries',
    name: 'Fisheries',
    title: 'fresh seafood',
    subtitle: 'Direct from the sea',
    ctaText: 'View fisheries',
    ctaUrl: '/products/category/seafood',
    bgColor: '#3498DB',
  },
  {
    id: 'sidedish',
    name: 'Side dish',
    title: 'Full of sincerity',
    subtitle: 'Side dishes that taste like home cooking',
    ctaText: 'View side dishes',
    ctaUrl: '/products/category/sidedish',
    bgColor: '#27AE60',
  },
] as const

