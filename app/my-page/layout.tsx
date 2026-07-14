import type { ReactNode } from "react"
import type { Metadata } from "next"

import MyPageSidebar from "@/app/my-page/components/my-page.sidebar"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-4xl font-bold mb-8">마이페이지</h1>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <MyPageSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}


