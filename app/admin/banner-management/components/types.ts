import i18next from 'i18next'
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
    name: i18next.t('jjuwangInstantRamenBox20Pack', 'Jjuwang Instant Ramen Box (20 Pack)'),
    price: '35,900',
    brand: 'Jjuwang',
    description: i18next.t('premiumRamenWithDeepFlavor', 'Premium ramen with deep flavor'),
  },
  {
    id: 2,
    name: i18next.t('koreanBbqSet', 'Korean BBQ Set'),
    price: '89,000',
    brand: 'Seoul Foods',
    description: i18next.t('authenticKoreanBbqExperience', 'Authentic Korean BBQ experience'),
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
    name: i18next.t('allCategories', 'All Categories'),
    title: i18next.t('todaysRecommendation', 'Today\'s Recommendation'),
    subtitle: i18next.t('discoverFreshJjuwangsanProductsAtSpecialPrices', 'Discover fresh Jjuwangsan products at special prices.'),
    ctaText: 'View All',
    ctaUrl: '/products/category/all',
    bgColor: '#FF5833',
  },
  {
    id: 'livestock',
    name: i18next.t('livestock', 'Livestock'),
    title: i18next.t('premiumKoreanBeef', 'Premium Korean beef'),
    subtitle: i18next.t('onlyGrade1OrHigherIsCarefullySelected', 'Only grade 1 or higher is carefully selected'),
    ctaText: 'View livestock',
    ctaUrl: '/products/category/meat',
    bgColor: '#E74C3C',
  },
  {
    id: 'convenience',
    name: i18next.t('convenienceFood', 'Convenience food'),
    title: i18next.t('easyToEnjoy', 'Easy to enjoy'),
    subtitle: i18next.t('aDeliciousMeal', 'A delicious meal'),
    ctaText: i18next.t('viewSimpleMeals', 'View simple meals'),
    ctaUrl: '/products/category/ready',
    bgColor: '#F39C12',
  },
  {
    id: 'fisheries',
    name: i18next.t('fisheries', 'Fisheries'),
    title: i18next.t('freshSeafood', 'fresh seafood'),
    subtitle: i18next.t('directFromTheSea', 'Direct from the sea'),
    ctaText: 'View fisheries',
    ctaUrl: '/products/category/seafood',
    bgColor: '#3498DB',
  },
  {
    id: 'sidedish',
    name: i18next.t('sideDish', 'Side dish'),
    title: i18next.t('fullOfSincerity', 'Full of sincerity'),
    subtitle: i18next.t('sideDishesThatTasteLikeHomeCooking', 'Side dishes that taste like home cooking'),
    ctaText: i18next.t('viewSideDishes', 'View side dishes'),
    ctaUrl: '/products/category/sidedish',
    bgColor: '#27AE60',
  },
] as const

