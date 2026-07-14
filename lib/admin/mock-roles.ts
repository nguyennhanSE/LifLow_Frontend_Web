export type AdminRoleKey = "owner" | "manager" | "md" | "cs" | "marketing"

export type AdminRole = {
  id: number
  name: string
  email: string
  roleKey: AdminRoleKey
  roleLabel: string
  createdAt: string
  status: "활성" | "중지"
  lastLogin?: string
}

export type RolePermission = {
  section: string
  canAccess: boolean
}

export type RolePermissionConfig = {
  roleKey: AdminRoleKey
  roleLabel: string
  permissions: RolePermission[]
}

export const adminRoles: AdminRole[] = [
  {
    id: 1,
    name: "주방몰",
    email: "owner@jwang.com",
    roleKey: "owner",
    roleLabel: "총괄 관리자",
    createdAt: "2024-01-01",
    status: "활성",
    lastLogin: "오늘",
  },
  {
    id: 2,
    name: "한도연",
    email: "admin@jwang.com",
    roleKey: "manager",
    roleLabel: "운영팀",
    createdAt: "2024-03-15",
    status: "활성",
  },
  {
    id: 3,
    name: "이민호",
    email: "md@jwang.com",
    roleKey: "md",
    roleLabel: "MD",
    createdAt: "2024-03-10",
    status: "활성",
  },
  {
    id: 4,
    name: "박고운",
    email: "cs@jwang.com",
    roleKey: "cs",
    roleLabel: "CS 담당자",
    createdAt: "2024-04-05",
    status: "활성",
  },
  {
    id: 5,
    name: "최은정",
    email: "marketing@jwang.com",
    roleKey: "marketing",
    roleLabel: "마케팅",
    createdAt: "2024-05-20",
    status: "중지",
  },
]

export const rolePermissionConfigs: RolePermissionConfig[] = [
  {
    roleKey: "owner",
    roleLabel: "총괄 관리자",
    permissions: [
      { section: "대시보드", canAccess: true },
      { section: "회원 관리", canAccess: true },
      { section: "상품 관리", canAccess: true },
      { section: "주문 관리", canAccess: true },
      { section: "게시판 관리", canAccess: true },
      { section: "쿠폰 관리", canAccess: true },
      { section: "배너 관리", canAccess: true },
    ],
  },
  {
    roleKey: "md",
    roleLabel: "MD",
    permissions: [
      { section: "대시보드", canAccess: true },
      { section: "회원 관리", canAccess: false },
      { section: "상품 관리", canAccess: true },
      { section: "주문 관리", canAccess: true },
      { section: "게시판 관리", canAccess: false },
      { section: "쿠폰 관리", canAccess: true },
      { section: "배너 관리", canAccess: true },
    ],
  },
  {
    roleKey: "cs",
    roleLabel: "CS 담당자",
    permissions: [
      { section: "대시보드", canAccess: true },
      { section: "회원 관리", canAccess: true },
      { section: "상품 관리", canAccess: false },
      { section: "주문 관리", canAccess: true },
      { section: "게시판 관리", canAccess: true },
      { section: "쿠폰 관리", canAccess: false },
      { section: "배너 관리", canAccess: false },
    ],
  },
]


