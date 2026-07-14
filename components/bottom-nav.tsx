'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid2x2, Tag, ShoppingBag, User } from "lucide-react"

const BOTTOM_LINKS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/contents", label: "콘텐츠", icon: Grid2x2 },
  { href: "/special", label: "특가", icon: Tag },
  { href: "/market", label: "마켓", icon: ShoppingBag },
  { href: "/my-page", label: "MY", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 items-center border-t border-gray-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      {BOTTOM_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
          >
            <Icon
              className={`h-5 w-5 transition-colors ${isActive ? 'text-[#FF5833]' : 'text-gray-400'}`}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#FF5833]' : 'text-gray-400'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
