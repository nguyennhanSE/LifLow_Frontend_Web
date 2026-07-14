import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AdminLayoutClient } from './admin-layout-client'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
