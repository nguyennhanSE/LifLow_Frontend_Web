'use client'

import { HeroSection } from "@/components/home/hero-section"
import { SpecialOffersSection } from "@/components/home/special-offers-section"
import { RecipesSection } from "@/components/home/recipes-section"
import { MarketSection } from "@/components/home/market-section"
import { CommunitySection } from "@/components/home/community-section"
import { usePathname } from "next/navigation"
import { ServiceSection } from "@/components/home/service-section"
import MarketPage from "./market/page"
import ContentsPage from "./contents/page"
import SpecialPage from "./special/page"
import CommunityCreatePage from "@/components/home/community/create/community-create"

export default function Home() {
  const pathname = usePathname()
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1 bg-white mx-auto w-full">
        <HeroSection />
        <SpecialOffersSection />
        <RecipesSection />
        <MarketSection />
        <CommunitySection />
        {pathname === '/service' && <ServiceSection />}
        {pathname === '/market' && <MarketPage />}
        {pathname === '/contents' && <ContentsPage />}
        {pathname === '/special' && <SpecialPage />}
      </main>
    </div>
  )
}
