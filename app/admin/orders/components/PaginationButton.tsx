'use client'

import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

interface PaginationButtonProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function PaginationButton({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationButtonProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis', totalPages]
    }
    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1 && !isLoading) onPageChange(currentPage - 1)
            }}
            className={
              currentPage <= 1 || isLoading
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer'
            }
            aria-disabled={currentPage <= 1 || isLoading}
          />
        </PaginationItem>
        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!isLoading) onPageChange(page)
                }}
                isActive={currentPage === page}
                className={
                  isLoading ? 'pointer-events-none opacity-70' : 'cursor-pointer'
                }
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages && !isLoading) onPageChange(currentPage + 1)
            }}
            className={
              currentPage >= totalPages || isLoading
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer'
            }
            aria-disabled={currentPage >= totalPages || isLoading}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
