import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "마켓",
  description:
    "Liflow 마켓에서 엄선된 프리미엄 한국 식자재와 전통 조미료를 만나보세요.",
}

export default function MarketLayout({ children }: { children: ReactNode }) {
  return children
}
