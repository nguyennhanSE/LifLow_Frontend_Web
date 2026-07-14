export type MemberGrade = "일반" | "실버" | "골드" | "VIP"

export type Member = {
  id: number
  username: string
  name: string
  email: string
  phone: string
  grade: MemberGrade
  joinDate: string
  orderCount: number
  totalAmount: number
  status: "정상" | "휴면" | "탈퇴"
}

export const memberGradeRuleSummary = [
  "실버 : 누적 20만원 이상",
  "골드 : 누적 50만원 이상",
  "VIP : 누적 100만원 이상",
] as const

export const mockMembers: Member[] = [
  {
    id: 1,
    username: "hwang123",
    name: "황정우",
    email: "hwang@example.com",
    phone: "010-2345-6789",
    grade: "골드",
    joinDate: "2024-01-10",
    orderCount: 23,
    totalAmount: 4200000,
    status: "정상",
  },
  {
    id: 2,
    username: "kim5678",
    name: "김상훈",
    email: "kim@example.com",
    phone: "010-9988-7766",
    grade: "실버",
    joinDate: "2024-02-18",
    orderCount: 11,
    totalAmount: 980000,
    status: "정상",
  },
  {
    id: 3,
    username: "park9102",
    name: "박지영",
    email: "park@example.com",
    phone: "010-5555-1212",
    grade: "VIP",
    joinDate: "2024-03-01",
    orderCount: 37,
    totalAmount: 10200000,
    status: "정상",
  },
]


