'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthHook } from '@/hooks/use-auth/auth.hook'
import {
  LayoutDashboard,
  Shield,
  User,
  Package,
  ShoppingCart,
  Folder,
  FileText,
  Bell,
  Gift,
  Image,
  ClipboardList,
  Home,
  LogOut,
  Star,
  MessageSquare,
} from 'lucide-react'

import { Sidebar } from '@/components/ui/sidebar'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

const navItems = [
  // { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  // { href: '/admin/permissions', label: '권한 관리', icon: Shield },
  { href: '/admin/members', label: i18next.t('key140', '회원 관리'), icon: User },
  { href: '/admin/chats', label: i18next.t('key141', '앱 채팅 관리'), icon: MessageSquare },
  { href: '/admin/products', label: i18next.t('key142', '상품 관리'), icon: Package },
  { href: '/admin/orders', label: i18next.t('key143', '주문 관리'), icon: ShoppingCart },
  { href: '/admin/product-inquiries', label: i18next.t('key144', '상품문의 관리'), icon: Folder },
  { href: '/admin/community', label: i18next.t('key145', '레시피 관리'), icon: FileText },
  { href: '/admin/coupons', label: i18next.t('key146', '상품리뷰 관리'), icon: Star },
  { href: '/admin/announcement', label: i18next.t('key147', '공지사항 관리'), icon: Bell },
  { href: '/admin/banner-management', label: i18next.t('key148', '배너 관리'), icon: Image },
  { href: '/admin/policy-management', label: i18next.t('key149', '정책 관리'), icon: ClipboardList },
  // { href: '/admin/coupons', label: '쿠폰 관리', icon: Gift },
]

export function AdminSidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { handleLogout } = useAuthHook()

  // Choose a single "active" item by picking the best (longest) match.
  // This avoids multiple items being highlighted (e.g. `/admin` + a sub-route).
  const activeHref =
    navItems
      .filter(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  const handleLogoutClick = async () => {
    const refreshToken = getCookie('refresh_token')
    if (refreshToken) {
      await handleLogout(refreshToken)
      router.push('/admin/sign-in')
      router.refresh()
    } else {
      router.push('/admin/sign-in')
    }
  }

  return (
    <Sidebar collapsible="offcanvas">
      <div className="flex h-full flex-col border-r border-black/10 bg-[#FAFAFA]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-6">
          <div className="flex size-8 shrink-0 items-center justify-center">
            <NextImage 
              src="/Icon-black.png" 
              alt={t('logo', 'Logo')} 
              width={32} 
              height={32}
              className="rounded-full"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-foreground">{t('key150', '쭈왕몰')}</span>
            <span className="text-xs text-muted-foreground">{t('key5', '관리자')}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-2">
          <div>
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              {t('key151', '메뉴')}
            </p>
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const active = activeHref === item.href
                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={[
                        'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-white text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-white/50 hover:text-foreground',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            {/* <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              기타
            </p> */}
            <ul className="space-y-0.5 py-2">
              <li>
                <button onClick={() => window.open('/', '_blank')} className="text-muted-foreground hover:text-foreground hover:bg-white/50 flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors">
                  <Home className="h-4 w-4 shrink-0" />
                  {t('key152', '쇼핑몰 이동')}
                </button>
              </li>
              <li>
                <button 
                  onClick={handleLogoutClick}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/50 flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {t('key153', '로그아웃')}
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </Sidebar>
  )
}
