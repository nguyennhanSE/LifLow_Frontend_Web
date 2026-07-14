/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Spinner } from '@/components/ui/spinner'
import { PaginationButton } from '@/components/common/PaginationButton'
import { useProductInquiry } from '@/hooks/use-product-inquiry/product-inquiry.hook'
import type { ProductInquiryEntity } from '@/entities/product-inquiry/product-inquiry.entity'
import Link from 'next/link'

type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

type InquiryStatusFilter = 'all' | 'pending' | 'completed'

type ProductInquiryDashboard = {
  total: number
  pending: number
  completed: number
}

function normalizeDashboard(input: any): ProductInquiryDashboard {
  return {
    total: Number(input?.total ?? 0) || 0,
    pending: Number(input?.pending ?? 0) || 0,
    completed: Number(input?.completed ?? 0) || 0,
  }
}

function normalizeInquiryList(input: any): ProductInquiryEntity[] {
  if (Array.isArray(input)) return input as ProductInquiryEntity[]
  if (input && typeof input === 'object') {
    if (Array.isArray(input.items)) return input.items as ProductInquiryEntity[]
    if (Array.isArray(input.docs)) return input.docs as ProductInquiryEntity[]
    if (Array.isArray(input.data)) return input.data as ProductInquiryEntity[]
  }
  return []
}

function normalizeMeta(input: any): PaginationMeta {
  if (!input || typeof input !== 'object')
    return { total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false }
  return {
    total: Number(input.total ?? 0) || 0,
    page: Number(input.page ?? 1) || 1,
    limit: Number(input.limit ?? 10) || 10,
    totalPages: Number(input.totalPages ?? 1) || 1,
    hasNext: Boolean(input.hasNext),
    hasPrev: Boolean(input.hasPrev),
  }
}

function exportToCSV(data: Array<Record<string, any>>, filename = 'product-inquiries.csv') {
  if (!Array.isArray(data) || data.length === 0) return

  const headers = Object.keys(data[0])

  const escape = (value: any) => {
    if (value === null || value === undefined) return ''
    const s = String(value)
    // If contains comma, quote or newline, wrap in quotes and escape quotes
    if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`
    return s
  }

  const rows = data.map((row) => headers.map((h) => escape(row[h])).join(','))
  const csvContent = [headers.join(','), ...rows].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function AdminProductInquiriesPage() {
  const { getProductInquiries, getProductInquiryDashboard } = useProductInquiry()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<InquiryStatusFilter>('all')
  const [isExporting, setIsExporting] = useState(false)

  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // reset pagination when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, status])

  const dashboardQuery = useQuery({
    queryKey: ['product-inquiries-dashboard'],
    queryFn: async () => normalizeDashboard(await getProductInquiryDashboard()),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  })

  const inquiriesQuery = useQuery({
    queryKey: ['product-inquiries', page, limit, debouncedQuery, status],
    queryFn: async () => {
      const params: any = { page, limit }
      if (debouncedQuery) params.search = debouncedQuery
      if (status !== 'all') params.status = status

      const res = await getProductInquiries(params)
      const items = normalizeInquiryList(res?.items ?? res)
      const meta = normalizeMeta(res?.meta)
      return { items, meta }
    },
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  })

  const inquiries = inquiriesQuery.data?.items ?? []
  const meta = inquiriesQuery.data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false }
  const dashboard = dashboardQuery.data ?? { total: 0, pending: 0, completed: 0 }

  const rowNumberStart = useMemo(() => (page - 1) * limit, [page, limit])

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const qs = new URLSearchParams()
      if (debouncedQuery) qs.set('search', debouncedQuery)
      if (status !== 'all') qs.set('status', status)

      const res = await fetch(`/api/admin/product-inquiries/export?${qs.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'CSV 내보내기에 실패했습니다.')
      }

      const payload = await res.json()
      const items = normalizeInquiryList(payload?.items)

      if (items.length === 0) {
        toast.error('내보낼 데이터가 없습니다.')
        return
      }

      const rows = items.map((inquiry: ProductInquiryEntity, idx: number) => {
        const isCompleted =
          inquiry.hasAnswer === true ||
          Boolean(inquiry.answer) ||
          (inquiry.productInquiryAnswers?.length ?? 0) > 0
        const createdAt = inquiry.createdAt ? new Date(inquiry.createdAt as any) : null

        return {
          번호: idx + 1,
          상품명: inquiry.product?.productName ?? inquiry.productId,
          작성자: inquiry.user?.name ?? inquiry.authorId,
          이메일: inquiry.user?.email ?? '',
          제목: inquiry.title ?? '',
          문의내용: inquiry.content ?? '',
          상태: isCompleted ? '답변완료' : '답변대기',
          작성일: createdAt ? format(createdAt, 'yyyy-MM-dd HH:mm') : '',
        }
      })

      exportToCSV(rows)
      toast.success('CSV 내보내기 완료')
    } catch (e: any) {
      toast.error('CSV 내보내기 실패', { description: e?.message || '잠시 후 다시 시도해주세요.' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-xl font-semibold text-foreground">상품문의 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          고객의 상품문의를 확인하고 답변할 수 있습니다.
        </p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-1 text-xs text-muted-foreground">전체 문의</p>
          <p className="text-2xl font-semibold text-foreground">
            {dashboardQuery.isLoading ? <Spinner className="h-5 w-5" /> : `${dashboard.total}건`}
          </p>
        </div>
        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-1 text-xs text-muted-foreground">답변 대기</p>
          <p className="text-2xl font-semibold text-primary">
            {dashboardQuery.isLoading ? <Spinner className="h-5 w-5" /> : `${dashboard.pending}건`}
          </p>
        </div>
        <div className="bg-card border-border hover:shadow-sm rounded-lg border p-5 transition-shadow">
          <p className="mb-1 text-xs text-muted-foreground">답변 완료</p>
          <p className="text-2xl font-semibold text-green-600">
            {dashboardQuery.isLoading ? <Spinner className="h-5 w-5" /> : `${dashboard.completed}건`}
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="bg-card border-border rounded-lg border p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">검색 및 필터</h2>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
            <div className="relative w-full lg:flex-1">
              <svg
                className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="상품명, 작성자, 문의내용으로 검색..."
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-2 h-10 w-full rounded-md border px-3 pl-9 text-sm outline-none focus-visible:ring-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              aria-label="상태 필터"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring focus-visible:ring-offset-2 h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2 lg:w-44"
              value={status}
              onChange={(e) => setStatus(e.target.value as InquiryStatusFilter)}
            >
              <option value="all">전체</option>
              <option value="pending">답변대기</option>
              <option value="completed">답변완료</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isExporting ? '내보내는 중...' : 'CSV 내보내기'}
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatus('all')
            }}
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors"
          >
            초기화
          </button>
        </div>
      </section>

      {/* Table */}
      <section className="bg-card border-border rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr className="text-xs font-medium text-muted-foreground">
                <th className="p-4 text-left">번호</th>
                <th className="p-4 text-left">상품명</th>
                <th className="p-4 text-left">작성자</th>
                <th className="p-4 text-left">문의내용</th>
                <th className="p-4 text-left">상태</th>
                <th className="p-4 text-left">작성일</th>
                <th className="p-4 text-left">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {inquiriesQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>로딩 중...</span>
                    </div>
                  </td>
                </tr>
              ) : inquiriesQuery.isError ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-red-500">
                    상품문의 목록을 불러오지 못했습니다.
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry, idx) => {
                  const isCompleted =
                    inquiry.hasAnswer === true ||
                    Boolean(inquiry.answer) ||
                    (inquiry.productInquiryAnswers?.length ?? 0) > 0

                  const createdAt = inquiry.createdAt ? new Date(inquiry.createdAt) : null

                  return (
                    <tr
                      key={inquiry.id}
                      className="border-border border-t transition-colors hover:bg-muted/20"
                    >
                      <td className="p-4">{rowNumberStart + idx + 1}</td>
                      <td className="p-4">{inquiry.product?.productName ?? inquiry.productId}</td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">
                          {inquiry.user?.name ?? inquiry.authorId}
                        </div>
                        {inquiry.user?.email && (
                          <div className="text-muted-foreground text-sm">{inquiry.user.email}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-foreground">{inquiry.title}</div>
                        <div className="text-muted-foreground line-clamp-2 text-sm">{inquiry.content}</div>
                      </td>
                      <td className="p-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            답변완료
                          </span>
                        ) : (
                          <span className="bg-primary text-primary-foreground inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium">
                            답변대기
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {createdAt ? format(createdAt, 'yyyy-MM-dd HH:mm') : '-'}
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/product-inquiries/${inquiry.id}`} className="inline-flex items-center gap-2 text-muted-foreground border border-gray-300 rounded-md p-2 w-fit">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span>{isCompleted ? '수정' : '답변'}</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border flex items-center justify-between border-t px-6 py-4">
          {meta.totalPages > 1 ? (
            <PaginationButton
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {meta.total === 0 ? '0건' : `전체 ${meta.total}건`}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
  