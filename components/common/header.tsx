"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Heart, ShoppingBag, User } from "lucide-react"
import { useTranslation } from 'react-i18next'

export function CommonHeader() {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">{t('jjuwangmol', 'Jjuwangmol')}</div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              {t('main', 'Main')}
            </Link>
            <Link href="/service" className="text-sm font-medium hover:text-primary transition-colors">
              {t('serviceIntroduction', 'Service Introduction')}
            </Link>
            <Link href="/content" className="text-sm font-medium hover:text-primary transition-colors">
              {t('content', 'Content')}
            </Link>
            <Link href="/special" className="text-sm font-medium hover:text-primary transition-colors">
              {t('thisWeeksSpecial', 'This week\'s special')}
            </Link>
            <Link href="/market" className="text-sm font-medium hover:text-primary transition-colors">
              {t('market', 'Market')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </Button>
          <Button variant="outline" size="sm" className="hidden md:flex">
            {t('logIn', 'log in')}
          </Button>
        </div>
      </div>
    </header>
  )
}
