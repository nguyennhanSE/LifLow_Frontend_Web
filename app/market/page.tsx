import { Suspense } from "react"
import { MarketPageSection } from "@/components/home/market-page-section"

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-400">로딩 중...</div>}>
      <MarketPageSection />
    </Suspense>
  )
}
