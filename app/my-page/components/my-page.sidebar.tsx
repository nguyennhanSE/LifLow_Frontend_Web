"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CreditCard, FileText, LogOut, MapPin, Package, User } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { USER_PROFILE_UPDATED_EVENT } from "@/lib/user-profile-sync"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { useAuthHook } from "@/hooks/use-auth/auth.hook"
import { useUser } from "@/hooks/use-user/user.hook"
import { User as UserEntity } from "@/entities/user.entity"

type NavItem = {
  label: string
  icon: React.ReactNode
  href?: string
  danger?: boolean
  onClick?: () => void
}

export default function MyPageSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { handleLogout } = useAuthHook()
  const { getMyInformation } = useUser()
  const [userData, setUserData] = useState<UserEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        const data = await getMyInformation()
        setUserData(data)
      } catch (error) {
        console.error("Failed to fetch user information:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [getMyInformation])

  // Stay in sync when profile/avatar is updated on 회원 정보 수정
  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const user = (e as CustomEvent<UserEntity>).detail
      if (user && typeof user === "object" && "id" in user) {
        setUserData(user)
      }
    }
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, onProfileUpdated)
    return () => window.removeEventListener(USER_PROFILE_UPDATED_EVENT, onProfileUpdated)
  }, [])

  const onLogout = async () => {
    try {
      // Get refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1]

      if (refreshToken) {
        await handleLogout(refreshToken)
      }
      // Redirect to home page after logout
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const navItems: NavItem[] = [
    {
      label: "주문/배송 조회",
      icon: <Package className="size-5" />,
      href: "/my-page/orders",
    },
    {
      label: "포인트 & 쿠폰",
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      href: "/my-page/points",
    },
    {
      label: "회원 정보 수정",
      icon: <User className="size-5" />,
      href: "/my-page/information",
    },
    {
      label: "배송지 관리",
      icon: <MapPin className="size-5" />,
      href: "/my-page/address",
    },
    {
      label: "내가 쓴 레시피",
      icon: <FileText className="size-5" />,
      href: "/my-page/recipe",
    },
    {
      label: "로그아웃",
      icon: <LogOut className="size-5" />,
      danger: true,
      onClick: onLogout,
    },
  ]

  return (
    <aside className="space-y-6">
      {/* Profile Card */}
      <Card className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="size-24 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 w-full">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : userData ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="size-24">
              {(() => {
                const u = userData as UserEntity & { avatarURL?: string }
                const avatarSrc = u.avatarUrl ?? u.avatarURL
                return avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt={userData.name} />
                ) : null
              })()}
              <AvatarFallback className="text-2xl bg-muted">
                {getInitials(userData.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{userData.name}</h2>
              <p className="text-muted-foreground text-sm">{userData.email}</p>
              <p className="text-sm">
                <span className="text-orange-500 font-semibold">
                  {userData.membership?.name || "GENERAL"}
                </span>
                <span> 등급</span>
              </p>
            </div>

            <div className="w-full bg-muted rounded-lg p-4 space-y-1">
              <p className="text-sm text-muted-foreground">보유 포인트</p>
              <p className="text-xl font-semibold text-orange-500">
                {formatNumber(userData.availablePoints)}P
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-sm text-muted-foreground">사용자 정보를 불러올 수 없습니다</p>
          </div>
        )}
      </Card>

      {/* Navigation Menu */}
      <Card className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href ? pathname?.startsWith(item.href) : false
            const baseClassName =
              "w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-colors"

            const className = cn(
              baseClassName,
              item.danger ? "text-red-500 hover:bg-muted" : "hover:bg-muted",
              isActive && "bg-muted"
            )

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            }

            return (
              <button 
                key={item.label} 
                type="button" 
                className={className}
                onClick={item.onClick}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </Card>
    </aside>
  )
}


