'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AdminLayoutShell } from '@/components/common/admin-layout-shell'

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/admin/sign-in') {
    return <>{children}</>
  }
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
