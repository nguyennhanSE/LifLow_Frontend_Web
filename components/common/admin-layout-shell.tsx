'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

const AdminSidebar = dynamic(
  () => import('@/components/common/admin-sidebar').then((mod) => mod.AdminSidebar),
  { ssr: false },
)

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <SidebarInset className="bg-white">
        <main className="flex-1 bg-white px-6 py-3">
          <header className="mb-6 flex items-center gap-2">
            <SidebarTrigger className="mr-1" />
            {/* <h1 className="text-lg font-semibold">관리자</h1> */}
          </header>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

