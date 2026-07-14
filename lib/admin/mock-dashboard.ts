export type DashboardStat = {
  label: string
  value: string
  helper: string
  trend: "up" | "down"
}

export type DailySale = {
  date: string
  amount: number
}

export type RecentOrder = {
  id: string
  customer: string
  product: string
  amount: string
  status: "배송중" | "배송준비" | "완료"
}

export const dashboardStats: DashboardStat[] = [
  {
    label: "일일 매출",
    value: "1,890,000원",
    helper: "+15.2% 전일 대비",
    trend: "up",
  },
  {
    label: "신규 가입",
    value: "24명",
    helper: "+8명 전일 대비",
    trend: "up",
  },
  {
    label: "주문 진행",
    value: "입금대기 5 · 배송준비 12 · 배송중 8",
    helper: "실시간 주문 현황",
    trend: "up",
  },
]

export const recentDailySales: DailySale[] = [
  { date: "10/11", amount: 1200000 },
  { date: "10/12", amount: 1500000 },
  { date: "10/13", amount: 1100000 },
  { date: "10/14", amount: 1600000 },
  { date: "10/15", amount: 1800000 },
  { date: "10/16", amount: 1400000 },
  { date: "10/17", amount: 1900000 },
]

export const recentOrders: RecentOrder[] = [
  {
    id: "ORD-001",
    customer: "홍길동",
    product: "유기농 쌀",
    amount: "35,000",
    status: "배송중",
  },
  {
    id: "ORD-002",
    customer: "김철수",
    product: "프리미엄 김치",
    amount: "12,800",
    status: "배송준비",
  },
  {
    id: "ORD-003",
    customer: "이영희",
    product: "한우 불고기",
    amount: "45,000",
    status: "완료",
  },
]


