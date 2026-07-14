'use client'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

export interface PaginationButtonProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const MAX_VISIBLE_PAGES = 5

export function PaginationButton({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  className,
}: PaginationButtonProps) {
  if (totalPages <= 1) return null

  const start = Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2))
  const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1)
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pageNumbers: (number | 'ellipsis')[] = []
  if (start > 1) {
    pageNumbers.push(1)
    if (start > 2) pageNumbers.push('ellipsis')
  }
  for (let i = start; i <= end; i++) pageNumbers.push(i)
  if (end < totalPages) {
    if (end < totalPages - 1) pageNumbers.push('ellipsis')
    pageNumbers.push(totalPages)
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3', className)}>
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? '0건'
          : `${from}-${to} / ${total.toLocaleString()}건`}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
              className={cn(
                'cursor-pointer',
                page <= 1 && 'pointer-events-none opacity-50'
              )}
              href="#"
            />
          </PaginationItem>
          {pageNumbers.map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={page === p}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(p)
                  }}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault()
                if (page < totalPages) onPageChange(page + 1)
              }}
              className={cn(
                'cursor-pointer',
                page >= totalPages && 'pointer-events-none opacity-50'
              )}
              href="#"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
