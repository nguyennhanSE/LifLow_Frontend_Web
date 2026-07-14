import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "특가 상품",
  description:
    "Liflow 특가 상품을 만나보세요. 프리미엄 한국 식자재를 합리적인 가격으로 구매하세요.",
}

export default function SpecialLayout({ children }: { children: ReactNode }) {
  return children
}
