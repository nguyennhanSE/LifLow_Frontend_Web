import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "콘텐츠",
  description:
    "Liflow에서 제공하는 한식 레시피, 식자재 이야기, 요리 팁 등 다양한 콘텐츠를 만나보세요.",
}

export default function ContentsLayout({ children }: { children: ReactNode }) {
  return children
}
