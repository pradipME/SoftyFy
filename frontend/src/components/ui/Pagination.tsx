import { ChevronLeftIcon, ChevronRightIcon } from './icons'
import { IconButton } from './IconButton'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
  size?: number
}

export function Pagination({ page, totalPages, totalElements, onPageChange, size = 20 }: PaginationProps) {
  if (totalPages <= 0) return null

  const firstItem = totalElements === 0 ? 0 : page * size + 1
  const lastItem = Math.min((page + 1) * size, totalElements)

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted">
        {firstItem}–{lastItem} of {totalElements}
      </p>
      <div className="flex items-center gap-2">
        <IconButton
          label="Previous page"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        <span className="text-sm text-muted">
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>
        <IconButton
          label="Next page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </nav>
  )
}
