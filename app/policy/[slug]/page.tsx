'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useStaticPage } from '@/hooks/use-static-page/static-page.hook'

export default function PolicyPage() {
  const params = useParams()
  const slug = params.slug as string
  const { getStaticPageBySlug } = useStaticPage()

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['static-page', slug],
    queryFn: () => getStaticPageBySlug(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !page) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b bg-[#fafafa]">
        <div className="container px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-[#999]">
            <Link href="/" className="hover:text-[#333] transition-colors">
              Home
            </Link>
            <span>&gt;</span>
            <span className="font-medium text-[#333]">{page.title}</span>
          </nav>
        </div>
      </div>

      {/* Title */}
      <div className="container px-4 py-10">
        <h1 className="text-center text-2xl font-bold text-[#2d2d2d]">
          {page.title}
        </h1>
      </div>

      {/* HTML Content */}
      <div className="container px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <div
            className="prose prose-sm max-w-none text-[#333] 
              prose-headings:text-[#2d2d2d] prose-headings:font-bold
              prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-sm
              prose-li:text-sm prose-li:leading-relaxed
              prose-table:text-sm prose-th:bg-[#f5f5f5] prose-th:p-2 prose-td:p-2 prose-table:border-collapse
              prose-hr:my-6
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: page.htmlContent }}
          />
        </div>
      </div>
    </div>
  )
}
