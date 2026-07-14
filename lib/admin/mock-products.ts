export type ProductStatus = '판매중' | '품절' | '숨김'

export type Product = {
  id: number
  name: string
  imageUrl: string
  category: string
  brand: string
  price: number
  originalPrice?: number
  stock: number
  status: ProductStatus
  isWeeklyDeal: boolean
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: '유기농 쌀 10kg',
    imageUrl: '/korean-food-products.jpg',
    category: '쌀/잡곡',
    brand: '주방농산',
    price: 35000,
    originalPrice: 45000,
    stock: 50,
    status: '판매중',
    isWeeklyDeal: true,
  },
  {
    id: 2,
    name: '프리미엄 김치 1kg',
    imageUrl: '/korean-food-gift.jpg',
    category: '김치/반찬',
    brand: '주방식품',
    price: 12000,
    stock: 30,
    status: '판매중',
    isWeeklyDeal: false,
  },
  {
    id: 3,
    name: '한우 불고기 500g',
    imageUrl: '/new-korean-product-.jpg',
    category: '정육/계란',
    brand: '주방축산',
    price: 45000,
    originalPrice: 55000,
    stock: 0,
    status: '품절',
    isWeeklyDeal: false,
  },
  {
    id: 4,
    name: '생 고등어 2마리',
    imageUrl: '/korean-food-product-.jpg',
    category: '수산물',
    brand: '주방수산',
    price: 18000,
    stock: 25,
    status: '판매중',
    isWeeklyDeal: false,
  },
  {
    id: 5,
    name: '방울토마토 1kg',
    imageUrl: '/placeholder.jpg',
    category: '채소',
    brand: '주방농장',
    price: 8000,
    stock: 40,
    status: '판매중',
    isWeeklyDeal: false,
  },
  {
    id: 6,
    name: '국내산 계란 30구',
    imageUrl: '/placeholder.jpg',
    category: '정육/계란',
    brand: '주방농장',
    price: 7500,
    stock: 60,
    status: '판매중',
    isWeeklyDeal: false,
  },
  {
    id: 7,
    name: '청양고추 500g',
    imageUrl: '/placeholder.jpg',
    category: '채소',
    brand: '주방농장',
    price: 5000,
    stock: 20,
    status: '판매중',
    isWeeklyDeal: false,
  },
  {
    id: 8,
    name: '냉동 새우 1kg',
    imageUrl: '/placeholder.jpg',
    category: '수산물',
    brand: '주방수산',
    price: 28000,
    stock: 15,
    status: '숨김',
    isWeeklyDeal: false,
  },
]


