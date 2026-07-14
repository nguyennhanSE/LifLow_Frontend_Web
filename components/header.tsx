'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Menu, X, User, LogIn, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useAuthHook } from "@/hooks/use-auth/auth.hook"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useCart } from "@/hooks/use-cart/cart.hook"
import { ChatBadge } from "@/components/chatBadge"
import Image from "next/image"

const NAV_LINKS = [
  { href: "/", label: "메인", icon: "/homepage/1.png", alt: "home", iconSize: "w-5 h-5", px: 20 },
  { href: "/service", label: "서비스소개", icon: "/homepage/2.png", alt: "service", iconSize: "w-8 h-8", px: 32 },
  { href: "/contents", label: "콘텐츠", icon: "/homepage/3.png", alt: "contents", iconSize: "w-8 h-8", px: 32 },
  { href: "/special", label: "이번쭈특가", icon: "/homepage/4.png", alt: "special", iconSize: "w-8 h-8", px: 32 },
  { href: "/market", label: "마켓", icon: "/homepage/5.png", alt: "market", iconSize: "w-8 h-8", px: 32 },
]

export function Header() {
  const { handleLogout } = useAuthHook()
  const { getNumberOfCartItems } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isHidden, setIsHidden] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  useEffect(() => {
    const token = getCookie('access_token')
    setIsLoggedIn(!!token)
    const loadCartCount = async () => {
      if (token) {
        try {
          const count = await getNumberOfCartItems()
          setCartItemCount(count)
        } catch {
          setCartItemCount(0)
        }
      } else {
        setCartItemCount(0)
      }
    }
    loadCartCount()
  }, [pathname, getNumberOfCartItems])

  useEffect(() => {
    const handleCartUpdate = async () => {
      const token = getCookie('access_token')
      if (token) {
        try {
          const count = await getNumberOfCartItems()
          setCartItemCount(count)
        } catch {
          // silently fail
        }
      }
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [getNumberOfCartItems])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
        setIsHidden(true)
      } else {
        setIsHidden(false)
      }
      lastScrollY.current = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogoutClick = async () => {
    const refreshToken = getCookie('refresh_token')
    setMobileMenuOpen(false)
    if (refreshToken) {
      await handleLogout(refreshToken)
      router.push('/sign-in')
      router.refresh()
    } else {
      router.push('/sign-in')
    }
  }

  const CartBadge = () => (
    <Link href="/cart">
      <Button variant="ghost" size="icon" className="relative text-white hover:text-white/80 hover:bg-white/10 h-9 w-9">
        <ShoppingCart className="h-5 w-5" />
        {cartItemCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#FF5833]">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}
      </Button>
    </Link>
  )

  return (
    <header className={`sticky top-0 z-50 w-full bg-[#FF5833] shadow-sm transition-transform duration-300 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 md:h-16 items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/icon.svg" alt="쭈왕몰 로고" width={36} height={36} className="w-8 h-8 md:w-9 md:h-9" />
          <span className="text-lg md:text-xl font-bold text-white">쭈왕몰</span>
        </Link>

        {/* Desktop & Tablet Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map(({ href, label, icon, alt, iconSize, px }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/15 ${pathname === href ? 'bg-white/20' : ''}`}
            >
              <Image src={icon} alt={alt} width={px} height={px} className={`shrink-0 ${iconSize} object-contain`} />
              <span className="hidden lg:inline whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <ChatBadge />
          <CartBadge />

          {/* Login / My page — desktop only */}
          <button
            onClick={() => router.push(isLoggedIn ? '/my-page' : '/sign-in')}
            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
          >
            <User className="h-4 w-4" />
            <span>{isLoggedIn ? '마이페이지' : '로그인'}</span>
          </button>

          {/* Mobile hamburger — Sheet drawer */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/15 h-9 w-9"
                aria-label="메뉴 열기"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" title="메뉴" className="w-72 p-0 bg-white flex flex-col">
              {/* Drawer header */}
              <div className="flex items-center justify-between bg-[#FF5833] px-4 py-4">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Image src="/icon.svg" alt="쭈왕몰 로고" width={32} height={32} className="w-8 h-8" />
                  <span className="text-lg font-bold text-white">쭈왕몰</span>
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 h-8 w-8">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>

              {/* User status */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                {isLoggedIn ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User className="h-4 w-4 text-[#FF5833]" />
                      <span className="font-medium">마이페이지</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setMobileMenuOpen(false); router.push('/my-page') }}
                        className="text-xs text-[#FF5833] font-medium hover:underline"
                      >
                        내 정보
                      </button>
                      <span className="text-gray-300">|</span>
                      <button onClick={handleLogoutClick} className="text-xs text-gray-500 hover:underline">
                        로그아웃
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push('/sign-in') }}
                    className="flex w-full items-center gap-2 text-sm text-gray-700 font-medium"
                  >
                    <LogIn className="h-4 w-4 text-[#FF5833]" />
                    <span>로그인 / 회원가입</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </button>
                )}
              </div>

              {/* Nav links — icons stay main color via filter */}
              <nav className="flex-1 overflow-y-auto py-2">
                {NAV_LINKS.map(({ href, label, icon, alt }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-orange-50 ${pathname === href ? 'bg-orange-50 text-[#FF5833]' : 'text-gray-700'}`}
                  >
                    <Image
                      src={icon}
                      alt={alt}
                      width={32}
                      height={32}
                      className="shrink-0 w-8 h-8 object-contain filter-[brightness(0)_sepia(1)_saturate(1000%)_hue-rotate(10deg)]"
                    />
                    <span>{label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-300" />
                  </Link>
                ))}
              </nav>

              {/* Cart shortcut */}
              <div className="border-t border-gray-100 p-4">
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-[#FF5833] px-4 py-3 text-sm font-semibold text-white"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>장바구니 보기</span>
                  {cartItemCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#FF5833]">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
